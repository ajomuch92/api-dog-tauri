use super::project_args;
use crate::apidog::{Cli, CliError};
use serde_json::Value;

#[tauri::command]
pub fn list_environments(project_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["environment".into(), "list".into()];
    args.extend(project_args(&project_id));
    Cli::run(args)
}

#[tauri::command]
pub fn get_environment(project_id: String, environment_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["environment".into(), "get".into(), environment_id];
    args.extend(project_args(&project_id));
    Cli::run(args)
}
