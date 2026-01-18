use crate::models::kanban_status::KanbanStatus;
use rusqlite::{Connection, Result};

pub struct KanbanStatusRepository;

impl KanbanStatusRepository {
    pub fn list_by_kanban(
        conn: &Connection,
        workspace_id: i32,
        kanban_id: i32,
    ) -> Result<Vec<KanbanStatus>> {
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, kanban_id, name, color, order_index, created_at, updated_at
            FROM kanban_status
            WHERE workspace_id = ? AND kanban_id = ?
            ORDER BY order_index ASC, created_at ASC",
        )?;

        let statuses = stmt
            .query_map((workspace_id, kanban_id), |row| {
                Ok(KanbanStatus {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    kanban_id: row.get(2)?,
                    name: row.get(3)?,
                    color: row.get(4)?,
                    order_index: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(statuses)
    }

    pub fn create(
        conn: &Connection,
        workspace_id: i32,
        kanban_id: i32,
        name: &str,
        color: Option<&str>,
    ) -> Result<KanbanStatus> {
        let order_index: i32 = conn
            .query_row(
                "SELECT COALESCE(MAX(order_index) + 1, 0)
                FROM kanban_status
                WHERE workspace_id = ? AND kanban_id = ?",
                (workspace_id, kanban_id),
                |row| row.get(0),
            )?;

        conn.execute(
            "INSERT INTO kanban_status (workspace_id, kanban_id, name, color, order_index)
            VALUES (?, ?, ?, ?, ?)",
            (workspace_id, kanban_id, name, color, order_index),
        )?;

        let status_id = conn.last_insert_rowid() as i32;

        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, kanban_id, name, color, order_index, created_at, updated_at
            FROM kanban_status
            WHERE id = ?",
        )?;

        let status = stmt.query_row([status_id], |row| {
            Ok(KanbanStatus {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                kanban_id: row.get(2)?,
                name: row.get(3)?,
                color: row.get(4)?,
                order_index: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        Ok(status)
    }

    pub fn update(
        conn: &Connection,
        workspace_id: i32,
        status_id: i32,
        name: &str,
        color: Option<&str>,
    ) -> Result<bool> {
        let updated = conn.execute(
            "UPDATE kanban_status
            SET name = ?, color = ?
            WHERE id = ? AND workspace_id = ?",
            (name, color, status_id, workspace_id),
        )?;

        Ok(updated > 0)
    }

    pub fn delete(conn: &Connection, workspace_id: i32, status_id: i32) -> Result<bool> {
        let deleted = conn.execute(
            "DELETE FROM kanban_status
            WHERE id = ? AND workspace_id = ?",
            (status_id, workspace_id),
        )?;

        Ok(deleted > 0)
    }

    pub fn update_orders(
        conn: &mut Connection,
        workspace_id: i32,
        updates: &[(i32, i32)],
    ) -> Result<()> {
        let tx = conn.transaction()?;

        for (status_id, order_index) in updates {
            let affected = tx.execute(
                "UPDATE kanban_status
                SET order_index = ?
                WHERE id = ? AND workspace_id = ?",
                (*order_index, *status_id, workspace_id),
            )?;

            if affected == 0 {
                return Err(rusqlite::Error::QueryReturnedNoRows);
            }
        }

        tx.commit()?;
        Ok(())
    }
}
