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
        ",
    ),
    (
        "20250112_add_thumbnail_to_memo",
        "
        ALTER TABLE memo ADD COLUMN thumbnail_image TEXT;
        ",
    ),
    (
        "20250523_create_bookmark_table",
        "CREATE TABLE IF NOT EXISTS bookmark (
            id INTEGER PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            memo_id INTEGER NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (workspace_id, memo_id),
            FOREIGN KEY (memo_id) REFERENCES memo(id) ON DELETE CASCADE,
            FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE
        );",
    ),
    (
        "20250530_add_body_text_to_memo",
        "
        ALTER TABLE memo ADD COLUMN body_text TEXT;
        ",
    ),
    (
        "20250530_create_memo_fts",
        "CREATE VIRTUAL TABLE IF NOT EXISTS memo_fts USING fts5(
            title,
            description,
            body_text,
            memo_id UNINDEXED,
            workspace_id UNINDEXED,
            slug_title UNINDEXED,
            tokenize = 'trigram'
        );",
    ),
    (
        "20250601_create_kanban_table",
        "CREATE TABLE IF NOT EXISTS kanban (
            id INTEGER PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            name VARCHAR(128) NOT NULL,
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (workspace_id, name),
            FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_kanban_workspace_id ON kanban(workspace_id);

        CREATE TRIGGER if not exists trigger_kanban_updated_at AFTER UPDATE ON kanban
        BEGIN
            UPDATE kanban SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
        ",
    ),
    (
        "20250602_create_kanban_status_table",
        "CREATE TABLE IF NOT EXISTS kanban_status (
            id INTEGER PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            kanban_id INTEGER NOT NULL,
            name VARCHAR(128) NOT NULL,
            color VARCHAR(32),
            order_index INTEGER NOT NULL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (kanban_id, name),
            FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE,
            FOREIGN KEY (kanban_id) REFERENCES kanban(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_kanban_status_workspace_id ON kanban_status(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_kanban_status_kanban_id ON kanban_status(kanban_id);

        CREATE TRIGGER if not exists trigger_kanban_status_updated_at AFTER UPDATE ON kanban_status
        BEGIN
            UPDATE kanban_status SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
        ",
    ),
    (
        "20250603_create_kanban_assignment_table",
        "CREATE TABLE IF NOT EXISTS kanban_assignment (
            id INTEGER PRIMARY KEY,
            workspace_id INTEGER NOT NULL,
            memo_id INTEGER NOT NULL,
            kanban_id INTEGER NOT NULL,
            kanban_status_id INTEGER,
            position INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (memo_id, kanban_id),
            FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE,
            FOREIGN KEY (memo_id) REFERENCES memo(id) ON DELETE CASCADE,
            FOREIGN KEY (kanban_id) REFERENCES kanban(id) ON DELETE CASCADE,
            FOREIGN KEY (kanban_status_id) REFERENCES kanban_status(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_kanban_assignment_workspace_id ON kanban_assignment(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_kanban_assignment_kanban_id ON kanban_assignment(kanban_id);
        CREATE INDEX IF NOT EXISTS idx_kanban_assignment_status_id ON kanban_assignment(kanban_status_id);
        CREATE INDEX IF NOT EXISTS idx_kanban_assignment_position ON kanban_assignment(position);

        CREATE TRIGGER if not exists trigger_kanban_assignment_updated_at AFTER UPDATE ON kanban_assignment
        BEGIN
            UPDATE kanban_assignment SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
        ",
    ),
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
