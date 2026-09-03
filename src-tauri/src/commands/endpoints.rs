use super::project_args;
use crate::apidog::{Cli, CliError, ErrorKind};
use serde::Deserialize;
use serde_json::Value;

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EndpointFilters {
    pub method: Option<String>,
    pub status: Option<String>,
    pub folder_id: Option<String>,
    pub tag: Option<String>,
    pub name_contains: Option<String>,
    pub path_contains: Option<String>,
}

/// Campos editables mediante flags de `endpoint update` (sin `--file`).
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EndpointFields {
    pub name: Option<String>,
    pub method: Option<String>,
    pub path: Option<String>,
    pub status: Option<String>,
    pub folder_id: Option<String>,
    pub description: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[tauri::command]
pub fn list_endpoints(project_id: String, filters: Option<EndpointFilters>) -> Result<Value, CliError> {
    let f = filters.unwrap_or_default();
    let mut args: Vec<String> = vec!["endpoint".into(), "list".into()];
    args.extend(project_args(&project_id));
    push_opt(&mut args, "--method", f.method);
    push_opt(&mut args, "--status", f.status);
    push_opt(&mut args, "--folder-id", f.folder_id);
    push_opt(&mut args, "--tag", f.tag);
    push_opt(&mut args, "--name-contains", f.name_contains);
    push_opt(&mut args, "--path-contains", f.path_contains);
    Cli::run(args)
}

#[tauri::command]
pub fn get_endpoint(project_id: String, endpoint_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["endpoint".into(), "get".into(), endpoint_id];
    args.extend(project_args(&project_id));
    Cli::run(args)
}

/// Crea un endpoint. El payload sigue el esquema `endpoint-create`; se
/// valida con el CLI antes de escribir.
#[tauri::command]
pub fn create_endpoint(project_id: String, payload: Value) -> Result<Value, CliError> {
    ensure_object(&payload)?;
    Cli::validate("endpoint-create", &payload)?;
    let args = ["endpoint", "create", "--project", project_id.as_str()];
    Cli::run_with_file(&args, &payload)
}

/// Actualiza campos simples mediante flags (más seguro que `--file`, que
/// sobreescribe estructuras completas).
#[tauri::command]
pub fn update_endpoint_fields(
    project_id: String,
    endpoint_id: String,
    fields: EndpointFields,
) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["endpoint".into(), "update".into(), endpoint_id];
    args.extend(project_args(&project_id));
    let before = args.len();
    push_opt(&mut args, "--name", fields.name);
    push_opt(&mut args, "--method", fields.method);
    push_opt(&mut args, "--path", fields.path);
    push_opt(&mut args, "--status", fields.status);
    push_opt(&mut args, "--folder-id", fields.folder_id);
    push_opt(&mut args, "--description", fields.description);
    if let Some(tags) = fields.tags {
        args.push("--tags".into());
        args.push(tags.join(","));
    }
    if args.len() == before {
        return Err(CliError::new(ErrorKind::Validation, "No hay campos para actualizar"));
    }
    Cli::run(args)
}

/// Reemplaza el endpoint completo con un JSON (esquema `endpoint-update`).
#[tauri::command]
pub fn update_endpoint_json(
    project_id: String,
    endpoint_id: String,
    payload: Value,
) -> Result<Value, CliError> {
    ensure_object(&payload)?;
    Cli::validate("endpoint-update", &payload)?;
    let args = ["endpoint", "update", endpoint_id.as_str(), "--project", project_id.as_str()];
    Cli::run_with_file(&args, &payload)
}

#[tauri::command]
pub fn delete_endpoint(project_id: String, endpoint_id: String) -> Result<Value, CliError> {
    let mut args: Vec<String> = vec!["endpoint".into(), "delete".into(), endpoint_id];
    args.extend(project_args(&project_id));
    Cli::run(args)
}

fn ensure_object(payload: &Value) -> Result<(), CliError> {
    if payload.is_object() {
        Ok(())
    } else {
        Err(CliError::new(ErrorKind::Validation, "El payload debe ser un objeto JSON"))
    }
}

pub(crate) fn push_opt(args: &mut Vec<String>, flag: &str, value: Option<String>) {
    if let Some(v) = value {
        let v = v.trim().to_string();
        if !v.is_empty() {
            args.push(flag.to_string());
            args.push(v);
        }
    }
}
