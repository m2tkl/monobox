// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod config;
mod database;
mod errors;
mod global_shortcuts;
mod mcp;
mod migrations;
mod models;
mod repositories;

use mime_guess;
use std::{fs, path::PathBuf};
use tauri::http::{Request, Response};
use uuid::Uuid;

fn main() {
    let proj_dirs = directories::ProjectDirs::from("com", "m2tkl", "monobox")
        .expect("Failed to determine project directories");
    let app_config = load_runtime_config(proj_dirs.config_dir(), proj_dirs.data_dir())
        .expect("Failed to load or create config");
    let runtime_config = build_runtime_config(app_config);
    let mut mcp_server_info = mcp::build_server_info(&runtime_config);
    let asset_dir_path = runtime_config.asset_dir_path.clone();

    if runtime_config.setup_complete {
        if let Err(error) = database::initialize_database() {
            eprintln!("Failed to initialize database: {}", error);
        }
    }

    if let Err(error) = mcp::spawn_http_server(runtime_config.clone()) {
        eprintln!("Failed to start monobox MCP server: {}", error);
        mcp_server_info.enabled = false;
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .manage(runtime_config.clone())
        .manage(mcp_server_info)
        .manage(global_shortcuts::GlobalShortcutState::from_config(
            &runtime_config,
        ))
        .setup(|app| {
            #[cfg(desktop)]
            global_shortcuts::register_global_shortcuts(app)?;

            Ok(())
        })
        .register_asynchronous_uri_scheme_protocol(
            "asset",
            move |_context: tauri::UriSchemeContext<tauri::Wry>,
                  request: Request<Vec<u8>>,
                  responder| {
                // According to the specification of PathBuf::join, if the path passed to join
                // starts with a root (e.g., / or C:\), the result will be the input path itself
                // instead of being joined with the base path.
                let asset_file_name = request
                    .uri()
                    .path()
                    .strip_prefix("/monobox/")
                    .unwrap_or("")
                    .to_string();
                let base_dir = PathBuf::from(&asset_dir_path);

                std::thread::spawn(move || {
                    let file_path = base_dir.join(asset_file_name);

                    let response = if file_path.exists() {
                        match fs::read(&file_path) {
                            Ok(content) => {
                                let mime =
                                    mime_guess::from_path(&file_path).first_or_octet_stream();
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
                    };

                    responder.respond(response);
                });
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
            commands::config::get_mcp_server_info,
            commands::config::regenerate_mcp_server_token,
            commands::config::set_theme_preference,
            commands::config::set_app_window_opacity,
            commands::config::set_inbox_ignore_file_names,
            commands::config::set_global_shortcuts,
            // Files
            commands::file::list_inbox_files,
            commands::file::import_inbox_file,
            commands::file::import_inbox_entry,
            commands::file::create_external_file_link,
            commands::file::list_files,
            commands::file::get_file_detail,
            commands::file::resolve_file_open_target,
            commands::file::open_managed_file,
            commands::file::open_local_path,
            commands::file::delete_file_record,
            commands::file::update_file_display_name,
            commands::file::update_external_file_link,
            commands::file::update_file_note,
            commands::file::link_file_to_memo,
            commands::file::list_files_for_memo,
            // Focus Memo
            commands::focus_memo::list_focus_memos,
            commands::focus_memo::add_focus_memo,
            commands::focus_memo::delete_focus_memo,
            commands::focus_memo::mark_focus_memo_done_for_today,
            commands::focus_memo::clear_focus_memo_done_for_today,
            // Calendar
            commands::calendar_day::list_calendar_days,
            commands::calendar_day::list_calendar_memo_dates,
            commands::calendar_day::update_calendar_day,
            commands::calendar_day::add_calendar_day_memo,
            commands::calendar_day::remove_calendar_day_memo,
            // Milestone
            commands::milestone::list_milestones,
            commands::milestone::create_milestone,
            commands::milestone::update_milestone,
            commands::milestone::add_milestone_memo,
            commands::milestone::remove_milestone_memo,
            commands::milestone::set_milestone_completed,
            commands::milestone::delete_milestone,
            // Workspace
            commands::workspace::get_workspaces,
            commands::workspace::get_workspace,
            commands::workspace::create_workspace,
            commands::workspace::save_workspace,
            commands::workspace::delete_workspace,
            // Memo
            commands::memo::get_workspace_memos,
            commands::memo::get_memo,
            commands::memo::get_current_memo,
            commands::memo::record_memo_view,
            commands::memo::create_memo,
            commands::memo::save_memo,
            commands::memo::delete_memo,
            commands::memo::search_memos,
            // Memo Template
            commands::memo_template::get_workspace_memo_templates,
            commands::memo_template::get_memo_template,
            commands::memo_template::create_memo_template,
            commands::memo_template::save_memo_template,
            commands::memo_template::delete_memo_template,
            commands::memo_template::set_default_memo_template,
            commands::memo_template::clear_default_memo_template,
            // HTML Export
            commands::html_export::save_html_export,
            // Memo Status
            commands::kanban_status::list_kanban_statuses,
            commands::kanban_status::create_kanban_status,
            commands::kanban_status::update_kanban_status,
            commands::kanban_status::update_kanban_status_orders,
            commands::kanban_status::delete_kanban_status,
            // Kanban
            commands::kanban::list_kanbans,
            commands::kanban::create_kanban,
            commands::kanban::update_kanban_status_roles,
            commands::kanban::delete_kanban,
            // Memo Kanban
            commands::kanban_assignment::list_kanban_assignment_items,
            commands::kanban_assignment::list_kanban_assignment_entries,
            commands::kanban_assignment::upsert_kanban_assignment_status,
            commands::kanban_assignment::remove_kanban_assignment,
            // Link
            commands::link::get_links,
            commands::link::list_workspace_link_counts,
            commands::link::create_link,
            commands::link::delete_link,
            // Bookmark
            commands::bookmark::list_bookmarks,
            commands::bookmark::add_bookmark,
            commands::bookmark::delete_bookmark,
            commands::bookmark::reorder_bookmark,
            // Asset
            commands::asset::save_image,
            commands::asset::read_image_as_data_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}

fn build_runtime_config(mut app_config: config::AppConfig) -> config::AppConfig {
    if app_config.mcp_token.trim().is_empty() {
        app_config.mcp_token = Uuid::new_v4().to_string();
    }
    app_config
}

fn load_runtime_config(
    config_dir: &std::path::Path,
    data_dir: &std::path::Path,
) -> Result<config::AppConfig, String> {
    let config_path = config_dir.join("config.json");
    let mut app_config = config::load_config(config_dir, data_dir)?;

    if app_config.mcp_token.trim().is_empty() {
        app_config.mcp_token = Uuid::new_v4().to_string();
        if let Err(error) = config::save_config(&app_config, &config_path) {
            eprintln!("Failed to persist MCP token: {}", error);
        }
    }

    Ok(app_config)
}
