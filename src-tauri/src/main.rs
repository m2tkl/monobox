// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod database;
mod errors;
mod migrations;
mod models;
mod repositories;

use mime_guess;
use std::{fs, path::PathBuf};
use tauri::http::{Request, Response};

fn main() {
    let proj_dirs = directories::ProjectDirs::from("com", "m2tkl", "monobox")
        .expect("Failed to determine project directories");
    let app_config = config::load_config(proj_dirs.config_dir(), proj_dirs.data_dir())
        .expect("Failed to load or create config");

    if app_config.setup_complete {
        database::initialize_database().expect("Failed to initialize database");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .manage(app_config.clone())
        .register_uri_scheme_protocol(
            "asset",
            move |_context: tauri::UriSchemeContext<tauri::Wry>, request: Request<Vec<u8>>| {
                // According to the specification of PathBuf::join, if the path passed to join
                // starts with a root (e.g., / or C:\), the result will be the input path itself
                // instead of being joined with the base path.
                let asset_file_name = request.uri().path().strip_prefix("/monobox/").unwrap_or("");

                let base_dir = PathBuf::from(&app_config.asset_dir_path);
                let file_path = base_dir.join(asset_file_name);

                if file_path.exists() {
                    match fs::read(&file_path) {
                        Ok(content) => {
                            let mime = mime_guess::from_path(&file_path).first_or_octet_stream();
                            Response::builder()
                                .header("Content-Type", mime.as_ref())
                                .status(200)
                                .body(content)
                                .expect("Failed to build response")
                        }
                        Err(_) => Response::builder()
                            .status(500)
                            .body(Vec::new())
                            .expect("Failed to build error response"),
                    }
                } else {
                    Response::builder()
                        .status(404)
                        .body(Vec::new())
                        .expect("Failed to build 404 response")
                }
            },
        )
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Config
            commands::config::get_app_config,
            commands::config::save_app_config,
            commands::config::detect_storage_candidates,
            commands::config::validate_app_config,
            commands::config::get_default_storage_paths,
            commands::config::set_theme_preference,
            // Workspace
            commands::workspace::get_workspaces,
            commands::workspace::get_workspace,
            commands::workspace::create_workspace,
            commands::workspace::save_workspace,
            commands::workspace::delete_workspace,
            // Memo
            commands::memo::get_workspace_memos,
            commands::memo::get_memo,
            commands::memo::create_memo,
            commands::memo::save_memo,
            commands::memo::delete_memo,
            commands::memo::search_memos,
            // Memo Status
            commands::kanban_status::list_kanban_statuses,
            commands::kanban_status::create_kanban_status,
            commands::kanban_status::update_kanban_status,
            commands::kanban_status::update_kanban_status_orders,
            commands::kanban_status::delete_kanban_status,
            // Kanban
            commands::kanban::list_kanbans,
            commands::kanban::create_kanban,
            commands::kanban::delete_kanban,
            // Memo Kanban
            commands::kanban_assignment::list_kanban_assignment_items,
            commands::kanban_assignment::list_kanban_assignment_entries,
            commands::kanban_assignment::upsert_kanban_assignment_status,
            commands::kanban_assignment::remove_kanban_assignment,
            // Link
            commands::link::get_links,
            commands::link::create_link,
            commands::link::delete_link,
            // Bookmark
            commands::bookmark::list_bookmarks,
            commands::bookmark::add_bookmark,
            commands::bookmark::delete_bookmark,
            // Asset
            commands::asset::save_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
