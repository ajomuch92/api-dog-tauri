use serde::Serialize;
use std::fmt;

/// Clasificación del error para que la UI pueda reaccionar (por ejemplo
/// mostrar la pantalla de instalación o de login).
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ErrorKind {
    /// No se encontró el binario `apidog` en el sistema.
    NotInstalled,
    /// El CLI respondió con fallo de autenticación (exit code 2).
    NotLoggedIn,
    /// El CLI respondió con `success: false` o un exit code distinto de 0.
    Cli,
    /// El payload no pasó `cli-schema validate` (exit code 3).
    Validation,
    /// No se pudo interpretar la salida del CLI como JSON.
    Parse,
    /// Error de E/S al lanzar el proceso o escribir archivos temporales.
    Io,
    /// Error al ejecutar una petición HTTP desde el cliente ligero.
    Http,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CliError {
    pub kind: ErrorKind,
    pub message: String,
    /// Código devuelto por el CLI (`error.code`), si existe.
    pub code: Option<String>,
    /// Sugerencia devuelta por el CLI (`error.suggestion`), si existe.
    pub suggestion: Option<String>,
    pub exit_code: Option<i32>,
    /// Salida cruda (stdout/stderr) para depuración.
    pub raw: Option<String>,
}

impl CliError {
    pub fn new(kind: ErrorKind, message: impl Into<String>) -> Self {
        Self {
            kind,
            message: message.into(),
            code: None,
            suggestion: None,
            exit_code: None,
            raw: None,
        }
    }

    pub fn not_installed() -> Self {
        Self::new(
            ErrorKind::NotInstalled,
            "No se encontró el CLI de Apidog. Instálalo con `npm install -g apidog-cli` o define la variable de entorno APIDOG_CLI con la ruta al binario.",
        )
    }

    pub fn not_logged_in() -> Self {
        Self::new(
            ErrorKind::NotLoggedIn,
            "No hay una sesión activa en el CLI de Apidog. Inicia sesión con tu access token.",
        )
    }

    pub fn io(err: std::io::Error) -> Self {
        Self::new(ErrorKind::Io, err.to_string())
    }

    pub fn http(err: reqwest::Error) -> Self {
        Self::new(ErrorKind::Http, err.to_string())
    }

    pub fn with_exit_code(mut self, code: Option<i32>) -> Self {
        self.exit_code = code;
        self
    }

    pub fn with_raw(mut self, raw: impl Into<String>) -> Self {
        let raw = raw.into();
        self.raw = if raw.trim().is_empty() { None } else { Some(raw) };
        self
    }
}

impl fmt::Display for CliError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.message)
    }
}

impl std::error::Error for CliError {}
