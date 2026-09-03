use super::blocking;
use crate::apidog::{Cli, CliError};
use serde_json::Value;

#[tauri::command]
pub async fn list_projects(team_id: Option<String>) -> Result<Value, CliError> {
    blocking(move || list_projects_blocking(team_id)).await
}

pub(crate) fn list_projects_blocking(team_id: Option<String>) -> Result<Value, CliError> {
    let mut args = vec!["project".to_string(), "list".to_string()];
    if let Some(team) = team_id.filter(|t| !t.trim().is_empty()) {
        args.push("--team".into());
        args.push(team);
    }
    Cli::run(args)
}

#[tauri::command]
pub async fn get_project(project_id: String) -> Result<Value, CliError> {
    blocking(move || get_project_blocking(project_id)).await
}

pub(crate) fn get_project_blocking(project_id: String) -> Result<Value, CliError> {
    Cli::run(["project", "get", project_id.as_str()])
}
