// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod database;
mod errors;
mod models;
mod repositories;
mod commands;

use crate::database::initialize_database;

fn main() {
    initialize_database().expect("Failed to initialize database");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Workspace
            commands::workspace::get_workspaces,
            commands::workspace::get_workspace,
            // Memo
            commands::memo::get_workspace_memos,
            commands::memo::get_memo,
            commands::memo::create_memo,
            commands::memo::save_memo,
            commands::memo::delete_memo,
            // Link

            // Asset
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
