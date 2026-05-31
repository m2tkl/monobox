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
        conn.execute(
            "UPDATE focus_memo
             SET done_for_today_on = date('now', 'localtime'), updated_at = CURRENT_TIMESTAMP
             WHERE workspace_id = ? AND memo_id = ?",
            (workspace_id, memo_id),
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
