use crate::models::kanban::Kanban;
use rusqlite::{Connection, OptionalExtension, Result};

pub struct KanbanRepository;

impl KanbanRepository {
    pub fn list_by_workspace(conn: &Connection, workspace_id: i32) -> Result<Vec<Kanban>> {
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, order_index, created_at, updated_at
            FROM kanban
            WHERE workspace_id = ?
            ORDER BY order_index ASC, created_at ASC",
        )?;

        let items = stmt
            .query_map([workspace_id], |row| {
                Ok(Kanban {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    name: row.get(2)?,
                    order_index: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(items)
    }

    pub fn create(conn: &Connection, workspace_id: i32, name: &str) -> Result<Kanban> {
        let order_index: i32 = conn
            .query_row(
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
}
