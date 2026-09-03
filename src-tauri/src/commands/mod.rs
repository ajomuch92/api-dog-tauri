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

/// Ayuda para construir argumentos `--project <id>` y similares.
pub(crate) fn project_args(project_id: &str) -> [String; 2] {
    ["--project".to_string(), project_id.to_string()]
}
