use rusqlite::Connection;
use crate::errors::AppError;
use crate::config::Config;

pub fn get_conn() -> Result<Connection, AppError> {
    let config = Config::load().map_err(AppError::ConfigLoadError)?;
    Connection::open(&config.database_path).map_err(AppError::DatabaseError)
}

pub fn initialize_database() -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS box (
            id INTEGER PRIMARY KEY,
            slug TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS memo (
            id INTEGER PRIMARY KEY,
            slug TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            box_id INTEGER NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (box_id) REFERENCES box(id)
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
