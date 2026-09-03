use super::error::{CliError, ErrorKind};
use serde_json::Value;
use std::ffi::OsStr;
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::sync::OnceLock;

const BINARY_NAMES: &[&str] = &["apidog", "apidog.cmd", "apidog.exe"];

/// Códigos de salida documentados por `apidog exit-codes`.
const EXIT_AUTH_FAILURE: i32 = 2;
const EXIT_VALIDATION_FAILURE: i32 = 3;

static BINARY: OnceLock<Option<PathBuf>> = OnceLock::new();

/// Fachada sobre el binario `apidog`.
pub struct Cli;

/// Resultado crudo de una ejecución.
pub struct RawOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
}

impl Cli {
    /// Ruta al binario, resuelta una sola vez por proceso.
    pub fn binary() -> Option<PathBuf> {
        BINARY.get_or_init(resolve_binary).clone()
    }

    /// Ejecuta el CLI y devuelve stdout/stderr sin interpretar.
    pub fn run_raw<I, S>(args: I) -> Result<RawOutput, CliError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        let bin = Self::binary().ok_or_else(CliError::not_installed)?;

        // stdout va a un archivo temporal y no a un pipe: el CLI (Node) sale
        // con `process.exit()` sin vaciar escrituras pendientes cuando el pipe
        // se llena (64 KB), lo que truncaba respuestas grandes como
        // `endpoint list`. Las escrituras a archivo son síncronas en Node.
        let stdout_file = tempfile::tempfile().map_err(CliError::io)?;
        let stdout_handle = stdout_file.try_clone().map_err(CliError::io)?;

        let mut cmd = Command::new(bin);
        cmd.args(args)
            .stdin(Stdio::null())
            .stdout(Stdio::from(stdout_handle))
            .stderr(Stdio::piped())
            // Evita que el CLI coloree la salida.
            .env("NO_COLOR", "1")
            .env("FORCE_COLOR", "0");
        hide_console(&mut cmd);

        let Output { status, stderr, .. } = cmd.output().map_err(CliError::io)?;

        let mut stdout_file = stdout_file;
        stdout_file.seek(SeekFrom::Start(0)).map_err(CliError::io)?;
        let mut stdout = Vec::new();
        stdout_file.read_to_end(&mut stdout).map_err(CliError::io)?;

        Ok(RawOutput {
            stdout: strip_ansi(&String::from_utf8_lossy(&stdout)),
            stderr: strip_ansi(&String::from_utf8_lossy(&stderr)),
            exit_code: status.code(),
        })
    }

    /// Ejecuta el CLI esperando el sobre JSON `{ success, data, error }` y
    /// devuelve únicamente `data` cuando la operación fue exitosa.
    pub fn run<I, S>(args: I) -> Result<Value, CliError>
    where
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        let out = Self::run_raw(args)?;
        parse_envelope(out)
    }

    /// Igual que `run` pero escribe `payload` en un archivo temporal y lo
    /// pasa con `--file <ruta>` (patrón que usa el CLI para create/update).
    pub fn run_with_file(args: &[&str], payload: &Value) -> Result<Value, CliError> {
        let file = write_temp_json(payload)?;
        let path = file.path().to_string_lossy().to_string();
        let mut full: Vec<String> = args.iter().map(|s| s.to_string()).collect();
        full.push("--file".into());
        full.push(path);
        Self::run(full)
    }

    /// Valida `payload` contra un esquema del CLI (`cli-schema validate`).
    pub fn validate(schema_key: &str, payload: &Value) -> Result<(), CliError> {
        Self::run_with_file(&["cli-schema", "validate", schema_key], payload).map(|_| ())
    }

    pub fn version() -> Result<String, CliError> {
        let out = Self::run_raw(["--version"])?;
        Ok(out.stdout.trim().to_string())
    }
}

fn write_temp_json(payload: &Value) -> Result<tempfile::NamedTempFile, CliError> {
    let mut file = tempfile::Builder::new()
        .prefix("apidog-")
        .suffix(".json")
        .tempfile()
        .map_err(CliError::io)?;
    let body = serde_json::to_vec_pretty(payload)
        .map_err(|e| CliError::new(ErrorKind::Parse, e.to_string()))?;
    file.write_all(&body).map_err(CliError::io)?;
    file.flush().map_err(CliError::io)?;
    Ok(file)
}

fn parse_envelope(out: RawOutput) -> Result<Value, CliError> {
    let raw = format!("{}\n{}", out.stdout, out.stderr);
    let json = extract_json(&out.stdout);

    match json {
        Some(Value::Object(map)) => {
            let success = map.get("success").and_then(Value::as_bool).unwrap_or(false);
            if success {
                return Ok(map.get("data").cloned().unwrap_or(Value::Null));
            }
            let err = map.get("error").cloned().unwrap_or(Value::Null);
            let message = err
                .get("message")
                .and_then(Value::as_str)
                .map(str::to_string)
                .unwrap_or_else(|| "El CLI de Apidog devolvió un error".to_string());
            let kind = kind_for_exit(out.exit_code);
            let mut e = CliError::new(kind, message)
                .with_exit_code(out.exit_code)
                .with_raw(raw);
            e.code = err.get("code").and_then(Value::as_str).map(str::to_string);
            e.suggestion = err
                .get("suggestion")
                .and_then(Value::as_str)
                .map(str::to_string);
            Err(e)
        }
        Some(other) => {
            // Salida JSON pero sin el sobre esperado: la devolvemos tal cual.
            if out.exit_code == Some(0) {
                Ok(other)
            } else {
                Err(CliError::new(kind_for_exit(out.exit_code), "Respuesta inesperada del CLI")
                    .with_exit_code(out.exit_code)
                    .with_raw(raw))
            }
        }
        None => {
            if out.exit_code == Some(0) {
                // Comandos que no producen JSON (p. ej. `auth login`).
                return Ok(Value::String(out.stdout.trim().to_string()));
            }
            let kind = kind_for_exit(out.exit_code);
            let message = if kind == ErrorKind::NotLoggedIn {
                CliError::not_logged_in().message
            } else {
                first_meaningful_line(&out.stderr)
                    .or_else(|| first_meaningful_line(&out.stdout))
                    .unwrap_or_else(|| "El CLI de Apidog falló sin mensaje".to_string())
            };
            Err(CliError::new(kind, message)
                .with_exit_code(out.exit_code)
                .with_raw(raw))
        }
    }
}

fn kind_for_exit(code: Option<i32>) -> ErrorKind {
    match code {
        Some(EXIT_AUTH_FAILURE) => ErrorKind::NotLoggedIn,
        Some(EXIT_VALIDATION_FAILURE) => ErrorKind::Validation,
        _ => ErrorKind::Cli,
    }
}

/// Busca el primer objeto/array JSON dentro de la salida (el CLI a veces
/// imprime texto antes del JSON).
fn extract_json(text: &str) -> Option<Value> {
    let trimmed = text.trim();
    if let Ok(v) = serde_json::from_str::<Value>(trimmed) {
        return Some(v);
    }
    let start = trimmed.find(['{', '['])?;
    serde_json::from_str::<Value>(&trimmed[start..]).ok()
}

fn first_meaningful_line(text: &str) -> Option<String> {
    text.lines()
        .map(str::trim)
        .find(|l| !l.is_empty())
        .map(|l| l.trim_start_matches("error:").trim().to_string())
}

fn strip_ansi(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\u{1b}' {
            // Secuencia CSI: ESC [ ... letra final
            if chars.peek() == Some(&'[') {
                chars.next();
                for n in chars.by_ref() {
                    if n.is_ascii_alphabetic() {
                        break;
                    }
                }
            }
            continue;
        }
        out.push(c);
    }
    out
}

fn resolve_binary() -> Option<PathBuf> {
    if let Ok(custom) = std::env::var("APIDOG_CLI") {
        let p = PathBuf::from(custom);
        if p.is_file() {
            return Some(p);
        }
    }
    if let Some(found) = find_in_path() {
        return Some(found);
    }
    resolve_via_login_shell()
}

fn find_in_path() -> Option<PathBuf> {
    let path_var = std::env::var_os("PATH")?;
    for dir in std::env::split_paths(&path_var) {
        for name in BINARY_NAMES {
            let candidate = dir.join(name);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

/// Cuando la app se lanza desde un escritorio Linux/macOS, el PATH suele no
/// incluir los binarios instalados por nvm/fnm/volta. Preguntamos a un shell
/// de login dónde está `apidog`.
#[cfg(unix)]
fn resolve_via_login_shell() -> Option<PathBuf> {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".into());
    let output = Command::new(shell)
        .args(["-lc", "command -v apidog"])
        .stdin(Stdio::null())
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let p = Path::new(&path);
    p.is_file().then(|| p.to_path_buf())
}

#[cfg(not(unix))]
fn resolve_via_login_shell() -> Option<PathBuf> {
    None
}

#[cfg(windows)]
fn hide_console(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x0800_0000;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn hide_console(_cmd: &mut Command) {}

#[cfg(test)]
mod tests {
    use super::*;

    fn raw(stdout: &str, stderr: &str, code: i32) -> RawOutput {
        RawOutput {
            stdout: stdout.to_string(),
            stderr: stderr.to_string(),
            exit_code: Some(code),
        }
    }

    #[test]
    fn success_envelope_returns_data() {
        let out = raw(r#"{"success":true,"resource":"project","operation":"list","data":[{"id":1}]}"#, "", 0);
        let data = parse_envelope(out).unwrap();
        assert_eq!(data[0]["id"], 1);
    }

    #[test]
    fn error_envelope_maps_code_and_message() {
        let out = raw(
            r#"{"success":false,"error":{"code":"404000","message":"Not found"}}"#,
            "",
            1,
        );
        let err = parse_envelope(out).unwrap_err();
        assert_eq!(err.kind, ErrorKind::Cli);
        assert_eq!(err.code.as_deref(), Some("404000"));
        assert_eq!(err.message, "Not found");
    }

    #[test]
    fn validation_exit_code_maps_to_validation_kind() {
        let out = raw(
            r#"{"success":false,"error":{"code":"VALIDATION_FAILED","message":"invalid","suggestion":"{\"valid\":false}"}}"#,
            "",
            3,
        );
        let err = parse_envelope(out).unwrap_err();
        assert_eq!(err.kind, ErrorKind::Validation);
        assert!(err.suggestion.is_some());
    }

    #[test]
    fn auth_exit_code_without_json_maps_to_not_logged_in() {
        let out = raw("", "error: not logged in", 2);
        let err = parse_envelope(out).unwrap_err();
        assert_eq!(err.kind, ErrorKind::NotLoggedIn);
    }

    #[test]
    fn non_json_failure_uses_stderr_message() {
        let out = raw("", "\n\x1b[31merror: unknown option '--x'\x1b[39m\nUSAGE", 1);
        let err = parse_envelope(RawOutput {
            stdout: strip_ansi(&out.stdout),
            stderr: strip_ansi(&out.stderr),
            exit_code: out.exit_code,
        })
        .unwrap_err();
        assert_eq!(err.message, "unknown option '--x'");
    }

    #[test]
    fn extracts_json_after_leading_text() {
        let v = extract_json("Good afternoon\n{\"success\":true,\"data\":5}").unwrap();
        assert_eq!(v["data"], 5);
    }

    #[test]
    fn strips_ansi_sequences() {
        assert_eq!(strip_ansi("\x1b[31mrojo\x1b[0m ok"), "rojo ok");
    }
}
