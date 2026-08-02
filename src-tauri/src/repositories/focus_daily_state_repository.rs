use crate::models::focus_daily_state::FocusDailyState;
use rusqlite::{Connection, Result};

pub struct FocusDailyStateRepository;

impl FocusDailyStateRepository {
    pub fn list_by_workspace(
        conn: &Connection,
        workspace_id: i32,
    ) -> Result<Vec<FocusDailyState>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, workspace_id, memo_id, done_on, created_at, updated_at
                 FROM focus_daily_state
                 WHERE workspace_id = ?
                 ORDER BY done_on DESC, updated_at DESC, id DESC",
            )
            .map_err(|e| e.to_string())?;

        let states = stmt
            .query_map([workspace_id], |row| {
                Ok(FocusDailyState {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    memo_id: row.get(2)?,
                    done_on: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(states)
    }

    pub fn mark_done_for_today(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        conn.execute(
            "INSERT INTO focus_daily_state (workspace_id, memo_id, done_on)
             VALUES (?, ?, date('now', 'localtime'))
             ON CONFLICT(workspace_id, memo_id, done_on) DO UPDATE SET
               updated_at = CURRENT_TIMESTAMP",
            (workspace_id, memo_id),
        )?;
        Ok(())
    }

    pub fn clear_done_for_today(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        conn.execute(
            "DELETE FROM focus_daily_state
             WHERE workspace_id = ? AND memo_id = ? AND done_on = date('now', 'localtime')",
            (workspace_id, memo_id),
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::FocusDailyStateRepository;
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
    fn mark_done_for_today_creates_daily_state_row() {
        let conn = setup_conn();
        let workspace = WorkspaceRepository::create(&conn, "test", "Test")
            .expect("workspace should be created");
        let memo = MemoRepository::create(&conn, workspace.id, "memo", "Memo", r#"{"type":"doc"}"#)
            .expect("memo should be created");

        FocusDailyStateRepository::mark_done_for_today(&conn, workspace.id, memo.id)
            .expect("focus state should be marked done");

        let items = FocusDailyStateRepository::list_by_workspace(&conn, workspace.id)
            .expect("focus states should load");
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].memo_id, memo.id);
        assert!(!items[0].done_on.is_empty());
    }
}
