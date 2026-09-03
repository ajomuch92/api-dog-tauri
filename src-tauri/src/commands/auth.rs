use super::blocking;
use crate::apidog::{Cli, CliError, ErrorKind};
use serde::Serialize;
use serde_json::Value;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CliStatus {
    pub installed: bool,
    pub binary_path: Option<String>,
    pub version: Option<String>,
    pub logged_in: bool,
    /// Resultado de `auth whoami` cuando hay sesión.
    pub user: Option<Value>,
    /// Error no relacionado con instalación/login (p. ej. red).
    pub error: Option<CliError>,
}

/// Diagnóstico completo: ¿está instalado el CLI? ¿hay sesión?
#[tauri::command]
pub async fn cli_status() -> CliStatus {
    blocking(move || Ok(cli_status_blocking())).await.unwrap_or_else(|e| CliStatus {
        installed: true,
        binary_path: None,
        version: None,
        logged_in: false,
        user: None,
        error: Some(e),
    })
}

pub(crate) fn cli_status_blocking() -> CliStatus {
    let Some(bin) = Cli::binary() else {
        return CliStatus {
            installed: false,
            binary_path: None,
            version: None,
            logged_in: false,
            user: None,
            error: None,
        };
    };

    let version = Cli::version().ok();
    let (logged_in, user, error) = match Cli::run(["auth", "whoami"]) {
        Ok(user) => (true, Some(user), None),
        Err(e) if e.kind == ErrorKind::NotLoggedIn => (false, None, None),
        Err(e) => (false, None, Some(e)),
    };

    CliStatus {
        installed: true,
        binary_path: Some(bin.to_string_lossy().to_string()),
        version,
        logged_in,
        user,
        error,
    }
}

#[tauri::command]
pub async fn auth_login(token: String, api_base_url: Option<String>) -> Result<Value, CliError> {
    blocking(move || auth_login_blocking(token, api_base_url)).await
}

pub(crate) fn auth_login_blocking(token: String, api_base_url: Option<String>) -> Result<Value, CliError> {
    let token = token.trim().to_string();
    if token.is_empty() {
        return Err(CliError::new(ErrorKind::Validation, "El access token es obligatorio"));
    }
    let mut args = vec!["auth".to_string(), "login".to_string(), "--with-token".to_string(), token];
    if let Some(url) = api_base_url.filter(|u| !u.trim().is_empty()) {
        args.push("--api-base-url".into());
        args.push(url.trim().to_string());
    }
    Cli::run(args)?;
    // Confirmamos que la sesión quedó activa.
    Cli::run(["auth", "whoami"])
}

#[tauri::command]
pub async fn auth_logout() -> Result<(), CliError> {
    blocking(move || auth_logout_blocking()).await
}

pub(crate) fn auth_logout_blocking() -> Result<(), CliError> {
    Cli::run(["auth", "logout"]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Requiere el CLI instalado y con sesión; se ejecuta con `cargo test -- --ignored`.
    #[test]
    #[ignore]
    fn cli_status_reports_logged_in_session() {
        let status = cli_status_blocking();
        assert!(status.installed, "apidog no encontrado");
        assert!(status.logged_in, "sin sesión: {:?}", status.error);
        assert!(status.user.is_some());
        assert!(status.version.is_some());
    }

    #[test]
    #[ignore]
    fn list_projects_and_endpoints_roundtrip() {
        let projects = crate::commands::projects::list_projects_blocking(None).expect("project list");
        let first = projects.as_array().and_then(|a| a.first()).expect("al menos un proyecto");
        let id = first["id"].to_string();
        let endpoints = crate::commands::endpoints::list_endpoints_blocking(id.clone(), None).expect("endpoint list");
        assert!(endpoints.is_array(), "endpoints: {}", { let t = serde_json::to_string(&endpoints).unwrap_or_default(); format!("len={} tail={}", t.len(), t.chars().rev().take(200).collect::<String>().chars().rev().collect::<String>()) });
        let folders = crate::commands::folders::list_folders_blocking(id.clone(), None).expect("folder list");
        assert!(folders.is_array());
        let envs = crate::commands::environments::list_environments_blocking(id).expect("environment list");
        assert!(envs.is_array());
    }

    #[test]
    #[ignore]
    fn validation_error_is_typed() {
        let err = crate::commands::endpoints::create_endpoint_blocking("1".into(), serde_json::json!({"name": "x"}))
            .expect_err("debe fallar la validación");
        assert_eq!(err.kind, ErrorKind::Validation, "{err:?}");
        assert!(err.suggestion.is_some());
    }
}
