use std::collections::HashMap;

use crate::models::milestone::{Milestone, MilestoneMemo};
use rusqlite::{Connection, Result};

pub struct MilestoneRepository;

impl MilestoneRepository {
    pub fn list_by_year(conn: &Connection, workspace_id: i32, year: i32) -> Result<Vec<Milestone>> {
        let start_date = format!("{year:04}-01-01");
        let end_date = format!("{:04}-01-01", year + 1);
        let mut stmt = conn.prepare(
            "SELECT milestone.id, milestone.workspace_id, milestone.date, milestone.title,
                    milestone.completed_at, milestone.created_at, milestone.updated_at
             FROM milestone
             WHERE milestone.workspace_id = ? AND milestone.date >= ? AND milestone.date < ?
             ORDER BY milestone.date ASC, milestone.created_at ASC, milestone.id ASC",
        )?;

        let mut milestones = stmt
            .query_map((workspace_id, &start_date, &end_date), |row| {
                Ok(Milestone {
                    id: row.get(0)?,
                    workspace_id: row.get(1)?,
                    date: row.get(2)?,
                    title: row.get(3)?,
                    memos: Vec::new(),
                    completed_at: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        let mut milestone_indexes = HashMap::new();
        for (index, milestone) in milestones.iter().enumerate() {
            milestone_indexes.insert(milestone.id, index);
        }

        let mut memo_stmt = conn.prepare(
            "SELECT milestone_memo.milestone_id, memo.id, memo.slug_title, memo.title
             FROM milestone_memo
             JOIN milestone ON milestone_memo.milestone_id = milestone.id
             JOIN memo ON milestone_memo.memo_id = memo.id
             WHERE milestone.workspace_id = ? AND milestone.date >= ? AND milestone.date < ?
             ORDER BY milestone.date ASC, milestone_memo.created_at ASC, memo.id ASC",
        )?;

        let memos = memo_stmt.query_map((workspace_id, &start_date, &end_date), |row| {
            Ok((
                row.get::<_, i32>(0)?,
                MilestoneMemo {
                    id: row.get(1)?,
                    slug_title: row.get(2)?,
                    title: row.get(3)?,
                },
            ))
        })?;

        for memo in memos {
            let (milestone_id, memo) = memo?;
            if let Some(index) = milestone_indexes.get(&milestone_id) {
                milestones[*index].memos.push(memo);
            }
        }

        Ok(milestones)
    }

    pub fn create(conn: &Connection, workspace_id: i32, date: &str, title: &str) -> Result<i32> {
        conn.execute(
            "INSERT INTO milestone (workspace_id, date, title)
             VALUES (?, ?, ?)",
            (workspace_id, date, title),
        )?;
        Ok(conn.last_insert_rowid() as i32)
    }

    pub fn update(
        conn: &Connection,
        workspace_id: i32,
        id: i32,
        date: &str,
        title: &str,
    ) -> Result<bool> {
        let updated = conn.execute(
            "UPDATE milestone
             SET date = ?, title = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND workspace_id = ?",
            (date, title, id, workspace_id),
        )?;
        Ok(updated > 0)
    }

    pub fn add_memo(
        conn: &Connection,
        workspace_id: i32,
        milestone_id: i32,
        memo_id: i32,
    ) -> Result<bool> {
        if !Self::belongs_to_workspace(conn, workspace_id, milestone_id)? {
            return Ok(false);
        }
        conn.execute(
            "INSERT INTO milestone_memo (milestone_id, memo_id)
             VALUES (?, ?)
             ON CONFLICT(milestone_id, memo_id) DO NOTHING",
            (milestone_id, memo_id),
        )?;
        Ok(true)
    }

    pub fn remove_memo(
        conn: &Connection,
        workspace_id: i32,
        milestone_id: i32,
        memo_id: i32,
    ) -> Result<bool> {
        if !Self::belongs_to_workspace(conn, workspace_id, milestone_id)? {
            return Ok(false);
        }
        conn.execute(
            "DELETE FROM milestone_memo WHERE milestone_id = ? AND memo_id = ?",
            (milestone_id, memo_id),
        )?;
        Ok(true)
    }

    pub fn set_completed(
        conn: &Connection,
        workspace_id: i32,
        id: i32,
        completed: bool,
    ) -> Result<bool> {
        let updated = if completed {
            conn.execute(
                "UPDATE milestone SET completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND workspace_id = ?",
                (id, workspace_id),
            )?
        } else {
            conn.execute(
                "UPDATE milestone SET completed_at = NULL, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ? AND workspace_id = ?",
                (id, workspace_id),
            )?
        };
        Ok(updated > 0)
    }

    pub fn delete(conn: &Connection, workspace_id: i32, id: i32) -> Result<bool> {
        let deleted = conn.execute(
            "DELETE FROM milestone WHERE id = ? AND workspace_id = ?",
            (id, workspace_id),
        )?;
        Ok(deleted > 0)
    }

    fn belongs_to_workspace(conn: &Connection, workspace_id: i32, id: i32) -> Result<bool> {
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM milestone WHERE id = ? AND workspace_id = ?",
            (id, workspace_id),
            |row| row.get(0),
        )?;
        Ok(count > 0)
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::MilestoneRepository;
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
    fn lists_milestone_with_multiple_memos() {
        let conn = setup_conn();
        let workspace = WorkspaceRepository::create(&conn, "test", "Test")
            .expect("workspace should be created");
        let memo_a =
            MemoRepository::create(&conn, workspace.id, "memo-a", "Memo A", r#"{"type":"doc"}"#)
                .expect("memo should be created");
        let memo_b =
            MemoRepository::create(&conn, workspace.id, "memo-b", "Memo B", r#"{"type":"doc"}"#)
                .expect("memo should be created");

        let milestone_id =
            MilestoneRepository::create(&conn, workspace.id, "2026-06-15", "Release")
                .expect("milestone should be created");
        MilestoneRepository::add_memo(&conn, workspace.id, milestone_id, memo_a.id)
            .expect("memo should link");
        MilestoneRepository::add_memo(&conn, workspace.id, milestone_id, memo_b.id)
            .expect("memo should link");

        let milestones = MilestoneRepository::list_by_year(&conn, workspace.id, 2026)
            .expect("milestones should load");
        assert_eq!(milestones.len(), 1);
        assert_eq!(milestones[0].memos.len(), 2);
    }
}
