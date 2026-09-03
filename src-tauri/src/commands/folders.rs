use super::endpoints::push_opt;
use super::project_args;
use crate::apidog::{Cli, CliError, ErrorKind};
use serde_json::{json, Value};

const DEFAULT_TYPE: &str = "endpoint";

fn folder_type(t: Option<String>) -> String {
    t.filter(|s| !s.trim().is_empty()).unwrap_or_else(|| DEFAULT_TYPE.to_string())
}

#[tauri::command]
pub fn list_folders(project_id: String, folder_type_name: Option<String>) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["folder".into(), "list".into()];
    args.extend(project_args(&project_id));
    args.push("--type".into());
    args.push(folder_type(folder_type_name));
    Cli::run(args)
}

#[tauri::command]
pub fn create_folder(
    project_id: String,
    name: String,
    parent_id: Option<i64>,
    folder_type_name: Option<String>,
) -> Result<Value, CliError> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(CliError::new(ErrorKind::Validation, "El nombre de la carpeta es obligatorio"));
    }
    let ftype = folder_type(folder_type_name);
    let mut payload = json!({ "name": name, "type": ftype });
    if let Some(parent) = parent_id.filter(|p| *p > 0) {
        payload["parentId"] = json!(parent);
    }
    Cli::validate("folder-create", &payload)?;
    let args = ["folder", "create", "--project", project_id.as_str(), "--type", ftype.as_str()];
    Cli::run_with_file(&args, &payload)
}

#[tauri::command]
pub fn update_folder(
    project_id: String,
    folder_id: String,
    name: Option<String>,
    description: Option<String>,
    parent_id: Option<i64>,
    folder_type_name: Option<String>,
) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["folder".into(), "update".into(), folder_id];
    args.extend(project_args(&project_id));
    args.push("--type".into());
    args.push(folder_type(folder_type_name));
    let before = args.len();
    push_opt(&mut args, "--name", name);
    push_opt(&mut args, "--description", description);
    if let Some(parent) = parent_id {
        args.push("--parent".into());
        args.push(parent.to_string());
    }
    if args.len() == before {
        return Err(CliError::new(ErrorKind::Validation, "No hay campos para actualizar"));
    }
    Cli::run(args)
}

#[tauri::command]
pub fn delete_folder(
    project_id: String,
    folder_id: String,
    folder_type_name: Option<String>,
) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["folder".into(), "delete".into(), folder_id];
    args.extend(project_args(&project_id));
    args.push("--type".into());
    args.push(folder_type(folder_type_name));
    Cli::run(args)
}
