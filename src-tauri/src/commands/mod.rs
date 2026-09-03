//! Comandos expuestos al frontend vía `invoke`. Cada archivo agrupa un
//! recurso del CLI de Apidog (auth, project, endpoint, folder, environment,
//! variables) más el cliente HTTP ligero.

pub mod auth;
pub mod endpoints;
pub mod environments;
pub mod folders;
pub mod http;
pub mod projects;
pub mod variables;

use crate::apidog::{CliError, ErrorKind};

/// Ejecuta trabajo bloqueante (spawn del CLI) fuera del hilo principal.
///
/// Los comandos síncronos de Tauri corren en el hilo del webview y congelan
/// la UI mientras el CLI responde; por eso cada comando es `async` y delega
/// aquí.
pub(crate) async fn blocking<T, F>(task: F) -> Result<T, CliError>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, CliError> + Send + 'static,
{
    tauri::async_runtime::spawn_blocking(task)
        .await
        .map_err(|e| CliError::new(ErrorKind::Io, format!("La tarea del CLI se interrumpió: {e}")))?
}

/// Ayuda para construir argumentos `--project <id>` y similares.
pub(crate) fn project_args(project_id: &str) -> [String; 2] {
    ["--project".to_string(), project_id.to_string()]
}
