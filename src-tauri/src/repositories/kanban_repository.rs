use crate::models::kanban::Kanban;
use rusqlite::{Connection, OptionalExtension, Result};

pub struct KanbanRepository;

impl KanbanRepository {
    const GLOBAL_STATUS_BOARD_NAME: &'static str = "Status";
    const GLOBAL_STATUS_NAMES: [&'static str; 6] = ["Inbox", "Now", "Next", "Later", "Waiting", "Done"];

    pub fn ensure_global_status_board(conn: &Connection, workspace_id: i32) -> Result<Kanban> {
        let (kanban, should_seed_statuses) = if let Some(existing) = Self::find_by_name(
            conn,
            workspace_id,
            Self::GLOBAL_STATUS_BOARD_NAME,
        )? {
            let status_count: i32 = conn.query_row(
                "SELECT COUNT(*) FROM kanban_status WHERE workspace_id = ? AND kanban_id = ?",
                (workspace_id, existing.id),
                |row| row.get(0),
            )?;
            (existing, status_count == 0)
        } else {
            (Self::create(conn, workspace_id, Self::GLOBAL_STATUS_BOARD_NAME)?, true)
        };

        if should_seed_statuses {
            for (order_index, name) in Self::GLOBAL_STATUS_NAMES.iter().enumerate() {
                conn.execute(
                    "INSERT INTO kanban_status (workspace_id, kanban_id, name, order_index)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(kanban_id, name) DO NOTHING",
                    (workspace_id, kanban.id, name, order_index as i32),
                )?;
            }
        }

        Ok(kanban)
    }

    pub fn global_status_names() -> &'static [&'static str; 6] {
        &Self::GLOBAL_STATUS_NAMES
    }

    pub fn create(conn: &Connection, workspace_id: i32, name: &str) -> Result<Kanban> {
        let order_index: i32 = conn.query_row(
            "SELECT COALESCE(MAX(order_index) + 1, 0) FROM kanban WHERE workspace_id = ?",
            [workspace_id],
            |row| row.get(0),
        )?;

        conn.execute(
            "INSERT INTO kanban (workspace_id, name, order_index)
            VALUES (?, ?, ?)",
            (workspace_id, name, order_index),
        )?;

        let kanban_id = conn.last_insert_rowid() as i32;
        Self::find_by_id(conn, workspace_id, kanban_id)?
            .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)
    }

    pub fn delete(conn: &Connection, workspace_id: i32, kanban_id: i32) -> Result<bool> {
        let deleted = conn.execute(
            "DELETE FROM kanban WHERE id = ? AND workspace_id = ?",
            (kanban_id, workspace_id),
        )?;
        Ok(deleted > 0)
    }

    pub fn find_by_id(
        conn: &Connection,
        workspace_id: i32,
        kanban_id: i32,
    ) -> Result<Option<Kanban>> {
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, order_index, created_at, updated_at
            FROM kanban
            WHERE id = ? AND workspace_id = ?",
        )?;

        let item = stmt
            .query_row((kanban_id, workspace_id), |row| {
                Ok(Kanban {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    name: row.get(2)?,
                    order_index: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .optional()?;

        Ok(item)
    }

    fn find_by_name(
        conn: &Connection,
        workspace_id: i32,
        name: &str,
    ) -> Result<Option<Kanban>> {
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, order_index, created_at, updated_at
            FROM kanban
            WHERE workspace_id = ? AND name = ?",
        )?;

        let item = stmt
            .query_row((workspace_id, name), |row| {
                Ok(Kanban {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    name: row.get(2)?,
                    order_index: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .optional()?;

        Ok(item)
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::KanbanRepository;
    use crate::migrations::apply_migrations;
    use crate::repositories::{KanbanStatusRepository, WorkspaceRepository};

    fn setup_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory DB should open");
        conn.execute(
            "CREATE TABLE schema_migrations (version TEXT PRIMARY KEY)",
            [],
        )
        .expect("schema_migrations should be creatable");
        apply_migrations(&conn).expect("migrations should apply");
        conn
    }

    #[test]
    fn ensure_global_status_board_does_not_recreate_renamed_default_status() {
        let conn = setup_conn();
        let workspace = WorkspaceRepository::create(&conn, "test", "Test")
            .expect("workspace should be created");

        let kanban = KanbanRepository::ensure_global_status_board(&conn, workspace.id)
            .expect("global status board should be created");
        let statuses = KanbanStatusRepository::list_by_kanban(&conn, workspace.id, kanban.id)
            .expect("statuses should load");
        let inbox = statuses
            .iter()
            .find(|status| status.name == "Inbox")
            .expect("Inbox should exist");

        KanbanStatusRepository::update(&conn, workspace.id, inbox.id, "Triage", inbox.color.as_deref())
            .expect("status should update");

        KanbanRepository::ensure_global_status_board(&conn, workspace.id)
            .expect("global status board should still load");

        let statuses = KanbanStatusRepository::list_by_kanban(&conn, workspace.id, kanban.id)
            .expect("statuses should load");
        assert_eq!(statuses.len(), KanbanRepository::global_status_names().len());
        assert!(statuses.iter().any(|status| status.name == "Triage"));
        assert!(!statuses.iter().any(|status| status.name == "Inbox"));
    }
}
