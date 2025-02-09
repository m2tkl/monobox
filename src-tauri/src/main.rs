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
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

fn main() {
    database::initialize_database().expect("Failed to initialize database");

    let proj_dirs = directories::ProjectDirs::from("com", "m2tkl", "monobox")
        .expect("Failed to determine project directories");
    let app_config =
        config::load_config(proj_dirs.config_dir()).expect("Failed to load or create config");

    tauri::Builder::default()
        .setup(|app| {
            let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("monobox")
                .inner_size(800.0, 600.0);

            #[cfg(target_os = "macos")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Transparent);

            #[cfg(target_os = "windows")]
            let win_builder = win_builder.title_bar_style(TitleBarStyle::Overlay);

            let window: tauri::WebviewWindow = win_builder.build().unwrap();

            #[cfg(target_os = "macos")]
            {
                use cocoa::appkit::{NSColor, NSWindow};
                use cocoa::base::{id, nil};

                let ns_window = window.ns_window().unwrap() as id;
                unsafe {
                    let bg_color = NSColor::colorWithRed_green_blue_alpha_(
                        nil,
                        226.0 / 255.0,
                        232.0 / 255.0,
                        240.0 / 255.0,
                        1.0,
                    );
                    ns_window.setBackgroundColor_(bg_color);
                }
            }

            #[cfg(target_os = "windows")]
            {
                use tauri::window::Color;

                window
                    .set_background_color(Color::Rgb(226, 232, 240))
                    .expect("Failed to set background color on Windows");
            }

            Ok(())
        })
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
            // Link
            commands::link::get_links,
            commands::link::create_link,
            commands::link::delete_link,
            // Asset
            commands::asset::save_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
