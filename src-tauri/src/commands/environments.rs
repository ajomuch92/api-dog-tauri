use super::project_args;
use super::blocking;
use crate::apidog::{Cli, CliError};
use serde_json::Value;

#[tauri::command]
pub async fn list_environments(project_id: String) -> Result<Value, CliError> {
    blocking(move || list_environments_blocking(project_id)).await
}

pub(crate) fn list_environments_blocking(project_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["environment".into(), "list".into()];
    args.extend(project_args(&project_id));
    Cli::run(args)
}

#[tauri::command]
pub async fn get_environment(project_id: String, environment_id: String) -> Result<Value, CliError> {
    blocking(move || get_environment_blocking(project_id, environment_id)).await
}

pub(crate) fn get_environment_blocking(project_id: String, environment_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["environment".into(), "get".into(), environment_id];
    args.extend(project_args(&project_id));
    Cli::run(args)
}
