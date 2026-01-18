use crate::models::kanban_assignment::{KanbanAssignmentEntry, KanbanAssignmentItem};
use rusqlite::{Connection, Result};

pub struct KanbanAssignmentRepository;

impl KanbanAssignmentRepository {
    pub fn list_items_by_kanban(
        conn: &Connection,
        workspace_id: i32,
        kanban_id: i32,
    ) -> Result<Vec<KanbanAssignmentItem>> {
        let mut stmt = conn.prepare(
            "SELECT memo.id, memo.slug_title, memo.title, memo.description,
                    kanban_assignment.kanban_status_id, kanban_assignment.position, memo.modified_at, kanban_assignment.kanban_id
            FROM kanban_assignment
            JOIN memo ON kanban_assignment.memo_id = memo.id
            WHERE kanban_assignment.workspace_id = ? AND kanban_assignment.kanban_id = ?
            ORDER BY kanban_assignment.position ASC, memo.modified_at DESC",
        )?;

        let items = stmt
            .query_map((workspace_id, kanban_id), |row| {
                Ok(KanbanAssignmentItem {
                    memo_id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    kanban_status_id: row.get(4)?,
                    position: row.get(5)?,
                    modified_at: row.get(6)?,
                    kanban_id: row.get(7)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(items)
    }

    pub fn list_entries_by_memo(
        conn: &Connection,
        workspace_id: i32,
        memo_id: i32,
    ) -> Result<Vec<KanbanAssignmentEntry>> {
        let mut stmt = conn.prepare(
            "SELECT kanban.id, kanban.name,
                    kanban_assignment.kanban_status_id, kanban_status.name, kanban_status.color,
                    kanban_assignment.position
            FROM kanban_assignment
            JOIN kanban ON kanban_assignment.kanban_id = kanban.id
            LEFT JOIN kanban_status ON kanban_assignment.kanban_status_id = kanban_status.id
            WHERE kanban_assignment.workspace_id = ? AND kanban_assignment.memo_id = ?
            ORDER BY kanban.order_index ASC, kanban.created_at ASC",
        )?;

        let items = stmt
            .query_map((workspace_id, memo_id), |row| {
                Ok(KanbanAssignmentEntry {
                    kanban_id: row.get(0)?,
                    kanban_name: row.get(1)?,
                    kanban_status_id: row.get(2)?,
                    kanban_status_name: row.get(3)?,
                    kanban_status_color: row.get(4)?,
                    position: row.get(5)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(items)
    }

    pub fn upsert_status(
        conn: &Connection,
        workspace_id: i32,
        memo_id: i32,
        kanban_id: i32,
        kanban_status_id: Option<i32>,
        position: Option<i64>,
    ) -> Result<()> {
        conn.execute(
            "INSERT INTO kanban_assignment (workspace_id, memo_id, kanban_id, kanban_status_id, position)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(memo_id, kanban_id) DO UPDATE SET
              kanban_status_id = excluded.kanban_status_id,
              position = excluded.position,
              updated_at = CURRENT_TIMESTAMP",
            (workspace_id, memo_id, kanban_id, kanban_status_id, position),
        )?;

        Ok(())
    }

    pub fn delete_entry(
        conn: &Connection,
        workspace_id: i32,
        memo_id: i32,
        kanban_id: i32,
    ) -> Result<bool> {
        let deleted = conn.execute(
            "DELETE FROM kanban_assignment
            WHERE workspace_id = ? AND memo_id = ? AND kanban_id = ?",
            (workspace_id, memo_id, kanban_id),
        )?;
        Ok(deleted > 0)
    }

}
