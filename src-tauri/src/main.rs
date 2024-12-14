// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod database;
mod errors;
mod models;

use crate::database::{get_conn, initialize_database};
use crate::models::Workspace;

use tauri::command;

#[command]
fn get_workspaces() -> Result<Vec<Workspace>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, slug, name FROM box")
        .map_err(|e| e.to_string())?;
    let workspaces = stmt
        .query_map([], |row| {
            Ok(Workspace {
                id: row.get(0)?,
                slug: row.get(1)?,
                name: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;
    Ok(workspaces)
}

fn main() {
    initialize_database().expect("Failed to initialize database");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_workspaces,])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
