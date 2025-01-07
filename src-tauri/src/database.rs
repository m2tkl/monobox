use crate::config::load_config;
use crate::errors::AppError;
use rusqlite::Connection;

pub fn get_conn() -> Result<Connection, AppError> {
    let proj_dirs = directories::ProjectDirs::from("com", "m2tkl", "monobox")
        .expect("Failed to determine project directories");

    let app_config = load_config(proj_dirs.config_dir()).expect("Failed to load or create config");

    let conn = Connection::open(&app_config.database_path).map_err(AppError::DatabaseError)?;

    conn.execute("PRAGMA foreign_keys = ON;", [])
        .map_err(AppError::DatabaseError)?;

    Ok(conn)
}

pub fn initialize_database() -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    // Workspace table
    conn.execute(
        "CREATE TABLE if not exists workspace (
            id INTEGER PRIMARY KEY,
            slug_name VARCHAR(1024) NOT NULL UNIQUE CHECK(slug_name GLOB '[A-Za-z0-9_-]*'),
            name VARCHAR(256),
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TRIGGER if not exists trigger_workspace_updated_at AFTER UPDATE ON workspace
        BEGIN
            UPDATE workspace SET updated_at = CURRENT_TIMESTAMP WHERE NEW.id;
        END",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE if not exists memo (
            id INTEGER PRIMARY KEY,
            slug_title VARCHAR(1024) NOT NULL,
            title VARCHAR(256),
            content JSON,
            description TEXT,
            workspace_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

            UNIQUE (workspace_id, slug_title), -- Title is unique in workspace
            FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TRIGGER if not exists trigger_memo_updated_at AFTER UPDATE ON memo
        BEGIN
            UPDATE memo SET updated_at = CURRENT_TIMESTAMP WHERE id == NEW.id;
        END",
        [],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "CREATE TABLE if not exists link (
            id INTEGER PRIMARY KEY,
            from_memo_id INTEGER NOT NULL,
            to_memo_id INTEGER NOT NULL,

            FOREIGN KEY (from_memo_id) REFERENCES memo(id) ON DELETE CASCADE,
            FOREIGN KEY (to_memo_id) REFERENCES memo(id) ON DELETE CASCADE,
            UNIQUE (from_memo_id, to_memo_id)
        )",
        [],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
