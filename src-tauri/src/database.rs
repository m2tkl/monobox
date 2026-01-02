use crate::config::load_config;
use crate::errors::AppError;
use crate::migrations;
use rusqlite::Connection;

pub fn get_conn() -> Result<Connection, AppError> {
    let proj_dirs = directories::ProjectDirs::from("com", "m2tkl", "monobox")
        .expect("Failed to determine project directories");

    let app_config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())
        .expect("Failed to load or create config");

    let conn = Connection::open(&app_config.database_path).map_err(AppError::DatabaseError)?;

    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(AppError::DatabaseError)?;

    Ok(conn)
}

pub fn initialize_database() -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )",
        [],
    )
    .map_err(|e| e.to_string())?;

    migrations::apply_migrations(&conn)?;

    Ok(())
}
