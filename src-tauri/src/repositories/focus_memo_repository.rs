use crate::models::focus_memo::FocusMemo;
use rusqlite::{Connection, Result};

pub struct FocusMemoRepository;

impl FocusMemoRepository {
    pub fn list_by_workspace(
        conn: &Connection,
        workspace_id: i32,
    ) -> Result<Vec<FocusMemo>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, workspace_id, memo_id, order_index, done_for_today_on, created_at, updated_at
                 FROM focus_memo
                 WHERE workspace_id = ?
                 ORDER BY order_index ASC, created_at ASC, id ASC",
            )
            .map_err(|e| e.to_string())?;

        let focus_memos = stmt
            .query_map([workspace_id], |row| {
                Ok(FocusMemo {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    memo_id: row.get(2)?,
                    order_index: row.get(3)?,
                    done_for_today_on: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(focus_memos)
    }

    pub fn create(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        let next_order_index: i32 = conn.query_row(
            "SELECT COALESCE(MAX(order_index), -1) + 1 FROM focus_memo WHERE workspace_id = ?",
            [workspace_id],
            |row| row.get(0),
        )?;

        conn.execute(
            "INSERT INTO focus_memo (workspace_id, memo_id, order_index, done_for_today_on)
             VALUES (?, ?, ?, NULL)
             ON CONFLICT(workspace_id, memo_id) DO UPDATE SET done_for_today_on = NULL",
            (workspace_id, memo_id, next_order_index),
        )?;
        Ok(())
    }

    pub fn delete(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        conn.execute(
            "DELETE FROM focus_memo WHERE workspace_id = ? AND memo_id = ?",
            (workspace_id, memo_id),
        )?;
        Ok(())
    }

    pub fn mark_done_for_today(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        let next_order_index: i32 = conn.query_row(
            "SELECT COALESCE(MAX(order_index), -1) + 1 FROM focus_memo WHERE workspace_id = ?",
            [workspace_id],
            |row| row.get(0),
        )?;

        conn.execute(
            "INSERT INTO focus_memo (workspace_id, memo_id, order_index, done_for_today_on)
             VALUES (?, ?, ?, date('now', 'localtime'))
             ON CONFLICT(workspace_id, memo_id) DO UPDATE SET
               done_for_today_on = date('now', 'localtime'),
               updated_at = CURRENT_TIMESTAMP",
            (workspace_id, memo_id, next_order_index),
        )?;
        Ok(())
    }

    pub fn clear_done_for_today(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        conn.execute(
            "UPDATE focus_memo
             SET done_for_today_on = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE workspace_id = ? AND memo_id = ?",
            (workspace_id, memo_id),
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::FocusMemoRepository;
    use crate::migrations::apply_migrations;
    use crate::repositories::{MemoRepository, WorkspaceRepository};

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
    fn mark_done_for_today_creates_missing_focus_memo_row() {
        let conn = setup_conn();
        let workspace = WorkspaceRepository::create(&conn, "test", "Test")
            .expect("workspace should be created");
        let memo = MemoRepository::create(&conn, workspace.id, "memo", "Memo", r#"{"type":"doc"}"#)
            .expect("memo should be created");

        FocusMemoRepository::mark_done_for_today(&conn, workspace.id, memo.id)
            .expect("focus memo should be marked done");

        let items = FocusMemoRepository::list_by_workspace(&conn, workspace.id)
            .expect("focus memos should load");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].memo_id, memo.id);
        assert!(items[0].done_for_today_on.is_some());
    }
}
