use rusqlite::Connection;

pub const MIGRATIONS: &[(&str, &str)] = &[
    (
        "20250101_create_workspace_table",
        "CREATE TABLE if not exists workspace (
                id INTEGER PRIMARY KEY,
                slug_name VARCHAR(1024) NOT NULL UNIQUE CHECK(slug_name GLOB '[A-Za-z0-9_-]*'),
                name VARCHAR(256),
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TRIGGER if not exists trigger_workspace_updated_at AFTER UPDATE ON workspace
            BEGIN
                UPDATE workspace SET updated_at = CURRENT_TIMESTAMP WHERE NEW.id;
            END;
            ",
    ),
    (
        "20250101_create_memo_table",
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
            );

            CREATE TRIGGER if not exists trigger_memo_updated_at AFTER UPDATE ON memo
            BEGIN
                UPDATE memo SET updated_at = CURRENT_TIMESTAMP WHERE id == NEW.id;
            END;
            ",
    ),
    (
        "20250101_create_link_table",
        "CREATE TABLE if not exists link (
                id INTEGER PRIMARY KEY,
                from_memo_id INTEGER NOT NULL,
                to_memo_id INTEGER NOT NULL,

                FOREIGN KEY (from_memo_id) REFERENCES memo(id) ON DELETE CASCADE,
                FOREIGN KEY (to_memo_id) REFERENCES memo(id) ON DELETE CASCADE,
                UNIQUE (from_memo_id, to_memo_id)
            );
            ",
    ),
    (
        "20250110_add_modified_at_to_memo",
        "
        ALTER TABLE memo ADD COLUMN modified_at TEXT;
        UPDATE memo SET modified_at = updated_at;
        "
    )
];

pub fn apply_migrations(conn: &Connection) -> Result<(), String> {
    let applied_versions: Vec<String> = conn
        .prepare("SELECT version FROM schema_migrations")
        .map_err(|e| e.to_string())?
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .collect();

    for (version, sql) in MIGRATIONS {
        if !applied_versions.contains(&version.to_string()) {
            println!("Applying migration: {}", version);
            conn.execute_batch(sql)
                .map_err(|e| format!("Failed to apply migration {}: {}", version, e))?;
            conn.execute(
                "INSERT INTO schema_migrations (version) VALUES (?)",
                &[version],
            )
            .map_err(|e| format!("Failed to record migration {}: {}", version, e))?;
        }
    }
    Ok(())
}
