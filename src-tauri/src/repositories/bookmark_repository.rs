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
                "SELECT id, workspace_id, memo_id, order_index, created_at
                 FROM bookmark
                 WHERE workspace_id = ?
                 ORDER BY order_index ASC, created_at ASC, id ASC",
            )
            .map_err(|e| e.to_string())?;

        let bookmarks = stmt
            .query_map([workspace_id], |row| {
                Ok(Bookmark {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    memo_id: row.get(2)?,
                    order_index: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(bookmarks)
    }

    pub fn create(conn: &Connection, workspace_id: i32, memo_id: i32) -> Result<()> {
        let next_order_index: i32 = conn.query_row(
            "SELECT COALESCE(MAX(order_index), -1) + 1 FROM bookmark WHERE workspace_id = ?",
            [workspace_id],
            |row| row.get(0),
        )?;

        conn.execute(
            "INSERT INTO bookmark (workspace_id, memo_id, order_index) VALUES (?, ?, ?)",
            (workspace_id, memo_id, next_order_index),
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

    pub fn reorder_by_memo_id(
        conn: &Connection,
        workspace_id: i32,
        memo_id: i32,
        target_memo_id: i32,
        position: &str,
    ) -> Result<(), String> {
        if memo_id == target_memo_id {
            return Ok(());
        }

        let mut bookmarks = Self::list_by_workspace(conn, workspace_id)?;

        let current_index = bookmarks
            .iter()
            .position(|bookmark| bookmark.memo_id == memo_id)
            .ok_or_else(|| format!("Bookmark not found for memo_id: {}", memo_id))?;
        let current = bookmarks.remove(current_index);

        let target_index = bookmarks
            .iter()
            .position(|bookmark| bookmark.memo_id == target_memo_id)
            .ok_or_else(|| format!("Target bookmark not found for memo_id: {}", target_memo_id))?;

        let insert_index = match position {
            "before" => target_index,
            "after" => target_index + 1,
            _ => return Err(format!("Unsupported bookmark reorder position: {}", position)),
        };

        bookmarks.insert(insert_index, current);

        for (index, bookmark) in bookmarks.iter().enumerate() {
            conn.execute(
                "UPDATE bookmark SET order_index = ? WHERE id = ?",
                (index as i32, bookmark.id),
            )
            .map_err(|e| e.to_string())?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::BookmarkRepository;
    use rusqlite::Connection;

    #[test]
    fn reorder_by_memo_id_moves_item_after_target() {
        let conn = Connection::open_in_memory().expect("in-memory db should open");
        conn.execute_batch(
            "
            CREATE TABLE bookmark (
                id INTEGER PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                order_index INTEGER NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO bookmark (id, workspace_id, memo_id, order_index, created_at) VALUES
              (1, 10, 101, 0, '2026-04-26 10:00:00'),
              (2, 10, 102, 1, '2026-04-26 10:01:00'),
              (3, 10, 103, 2, '2026-04-26 10:02:00'),
              (4, 10, 104, 3, '2026-04-26 10:03:00');
            ",
        )
        .expect("schema and fixtures should be created");

        BookmarkRepository::reorder_by_memo_id(&conn, 10, 101, 103, "after")
            .expect("reorder should succeed");

        let ordered = BookmarkRepository::list_by_workspace(&conn, 10)
            .expect("bookmarks should be listed");
        let memo_ids: Vec<i32> = ordered.into_iter().map(|bookmark| bookmark.memo_id).collect();

        assert_eq!(memo_ids, vec![102, 103, 101, 104]);
    }
}
