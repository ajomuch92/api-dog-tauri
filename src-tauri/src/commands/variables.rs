use super::project_args;
use crate::apidog::{Cli, CliError};
use serde_json::Value;

/// Variables globales del proyecto (`{{NOMBRE}}` en rutas y cuerpos).
#[tauri::command]
pub fn list_global_variables(project_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["variables".into(), "list".into()];
    args.extend(project_args(&project_id));
    args.push("--scope".into());
    args.push("global".into());
    Cli::run(args)
}
