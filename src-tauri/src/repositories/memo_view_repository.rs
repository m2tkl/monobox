use rusqlite::{params, Connection, OptionalExtension};

use crate::models::memo::{CurrentMemoDetail, MemoDetail};

pub struct MemoViewRepository;

impl MemoViewRepository {
    pub fn record_view(
        conn: &mut Connection,
        workspace_id: i32,
        memo_id: i32,
    ) -> Result<(), String> {
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO memo_view_event (workspace_id, memo_id) VALUES (?, ?)",
            params![workspace_id, memo_id],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO memo_view_state (slot, workspace_id, memo_id, viewed_at)
             VALUES ('current', ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(slot) DO UPDATE SET
               workspace_id = excluded.workspace_id,
               memo_id = excluded.memo_id,
               viewed_at = CURRENT_TIMESTAMP",
            params![workspace_id, memo_id],
        )
        .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())
    }

    pub fn get_current_memo(conn: &Connection) -> Result<Option<CurrentMemoDetail>, String> {
        conn.query_row(
            "SELECT
                workspace.slug_name,
                memo.slug_title,
                memo_view_state.viewed_at,
                memo.id,
                memo.slug_title,
                memo.title,
                json(memo.content) AS content,
                memo.description,
                memo.thumbnail_image,
                memo.workspace_id,
                memo.created_at,
                memo.updated_at,
                memo.modified_at
             FROM memo_view_state
             JOIN workspace ON workspace.id = memo_view_state.workspace_id
             JOIN memo ON memo.id = memo_view_state.memo_id
             WHERE memo_view_state.slot = 'current'",
            [],
            |row| {
                Ok(CurrentMemoDetail {
                    workspace_slug_name: row.get(0)?,
                    memo_slug_title: row.get(1)?,
                    viewed_at: row.get(2)?,
                    memo: MemoDetail {
                        id: row.get(3)?,
                        slug_title: row.get(4)?,
                        title: row.get(5)?,
                        content: row.get(6)?,
                        description: row.get(7)?,
                        thumbnail_image: row.get(8)?,
                        workspace_id: row.get(9)?,
                        created_at: row.get(10)?,
                        updated_at: row.get(11)?,
                        modified_at: row.get(12)?,
                    },
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::MemoViewRepository;
    use rusqlite::Connection;

    #[test]
    fn record_view_updates_current_slot() {
        let mut conn = Connection::open_in_memory().expect("in-memory db should open");
        conn.execute_batch(
            "
            CREATE TABLE workspace (
                id INTEGER PRIMARY KEY,
                slug_name TEXT NOT NULL,
                name TEXT
            );
            CREATE TABLE memo (
                id INTEGER PRIMARY KEY,
                slug_title TEXT NOT NULL,
                title TEXT,
                content TEXT,
                description TEXT,
                thumbnail_image TEXT,
                workspace_id INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                modified_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_event (
                id INTEGER PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_state (
                slot TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO workspace (id, slug_name, name) VALUES (1, 'default', 'Default');
            INSERT INTO memo (id, slug_title, title, content, workspace_id) VALUES
              (11, 'alpha', 'Alpha', '{\"type\":\"doc\",\"content\":[]}', 1),
              (12, 'beta', 'Beta', '{\"type\":\"doc\",\"content\":[]}', 1);
            ",
        )
        .expect("schema and fixtures should be created");

        MemoViewRepository::record_view(&mut conn, 1, 11).expect("first view should record");
        MemoViewRepository::record_view(&mut conn, 1, 12).expect("second view should record");

        let current = MemoViewRepository::get_current_memo(&conn)
            .expect("current memo should load")
            .expect("current memo should exist");
        assert_eq!(current.memo_slug_title, "beta");

        let event_count: i32 = conn
            .query_row("SELECT COUNT(*) FROM memo_view_event", [], |row| row.get(0))
            .expect("event count should be readable");
        assert_eq!(event_count, 2);
    }
}
