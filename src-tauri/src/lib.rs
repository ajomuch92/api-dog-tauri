mod apidog;
mod commands;

use commands::{auth, endpoints, environments, folders, http, projects, variables};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            auth::cli_status,
            auth::auth_login,
            auth::auth_logout,
            projects::list_projects,
            projects::get_project,
            endpoints::list_endpoints,
            endpoints::get_endpoint,
            endpoints::create_endpoint,
            endpoints::update_endpoint_fields,
            endpoints::update_endpoint_json,
            endpoints::delete_endpoint,
            folders::list_folders,
            folders::create_folder,
            folders::update_folder,
            folders::delete_folder,
            environments::list_environments,
            environments::get_environment,
            variables::list_global_variables,
            http::send_request,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
