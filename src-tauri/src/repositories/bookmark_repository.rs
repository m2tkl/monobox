use crate::models::bookmark::Bookmark;
use rusqlite::{Connection, Result};

pub struct BookmarkRepository;

impl BookmarkRepository {
    pub fn list_by_workspace(
        conn: &Connection,
        workspace_id: i32,
    ) -> Result<Vec<Bookmark>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, workspace_id, memo_id, created_at FROM bookmark WHERE workspace_id = ?",
            )
            .map_err(|e| e.to_string())?;

        let bookmarks = stmt
            .query_map([workspace_id], |row| {
                Ok(Bookmark {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    memo_id: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(bookmarks)
    }

    pub fn create(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        conn.execute(
            "INSERT INTO bookmark (workspace_id, memo_id) VALUES (?, ?)",
            (workspace_id, memo_id),
        )?;
        Ok(())
    }

    pub fn delete(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        conn.execute(
            "DELETE FROM bookmark WHERE workspace_id = ? AND memo_id = ?",
            (workspace_id, memo_id),
        )?;
        Ok(())
    }
}
