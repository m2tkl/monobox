use std::collections::HashMap;

use crate::models::calendar_day::{CalendarDay, CalendarDayMemo};
use rusqlite::{Connection, OptionalExtension, Result};

pub struct CalendarDayRepository;

impl CalendarDayRepository {
    pub fn list_by_year(
        conn: &Connection,
        workspace_id: i32,
        year: i32,
    ) -> Result<Vec<CalendarDay>> {
        let start_date = format!("{year:04}-01-01");
        let end_date = format!("{:04}-01-01", year + 1);

        let mut stmt = conn.prepare(
            "SELECT id, date, note, is_non_working
             FROM calendar_day
             WHERE workspace_id = ? AND date >= ? AND date < ?
             ORDER BY date ASC",
        )?;

        let mut days = stmt
            .query_map((workspace_id, &start_date, &end_date), |row| {
                Ok(CalendarDay {
                    id: row.get(0)?,
                    date: row.get(1)?,
                    note: row.get(2)?,
                    is_non_working: row.get(3)?,
                    memos: Vec::new(),
                })
            })?
            .collect::<Result<Vec<_>>>()?;

        let mut day_indexes = HashMap::new();
        for (index, day) in days.iter().enumerate() {
            day_indexes.insert(day.id, index);
        }

        let mut memo_stmt = conn.prepare(
            "SELECT calendar_day_memo.calendar_day_id, memo.id, memo.slug_title, memo.title
             FROM calendar_day_memo
             JOIN calendar_day ON calendar_day_memo.calendar_day_id = calendar_day.id
             JOIN memo ON calendar_day_memo.memo_id = memo.id
             WHERE calendar_day.workspace_id = ? AND calendar_day.date >= ? AND calendar_day.date < ?
             ORDER BY calendar_day.date ASC, calendar_day_memo.created_at ASC, memo.id ASC",
        )?;

        let memos = memo_stmt.query_map((workspace_id, &start_date, &end_date), |row| {
            Ok((
                row.get::<_, i32>(0)?,
                CalendarDayMemo {
                    id: row.get(1)?,
                    slug_title: row.get(2)?,
                    title: row.get(3)?,
                },
            ))
        })?;

        for memo in memos {
            let (day_id, memo) = memo?;
            if let Some(index) = day_indexes.get(&day_id) {
                days[*index].memos.push(memo);
            }
        }

        Ok(days)
    }

    pub fn update_day(
        conn: &Connection,
        workspace_id: i32,
        date: &str,
        note: Option<&str>,
        is_non_working: bool,
    ) -> Result<()> {
        let normalized_note = note.map(str::trim).filter(|value| !value.is_empty());

        conn.execute(
            "INSERT INTO calendar_day (workspace_id, date, note, is_non_working)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(workspace_id, date) DO UPDATE SET
               note = excluded.note,
               is_non_working = excluded.is_non_working,
               updated_at = CURRENT_TIMESTAMP",
            (workspace_id, date, normalized_note, is_non_working),
        )?;

        Self::delete_if_empty(conn, workspace_id, date)
    }

    pub fn add_memo(conn: &Connection, workspace_id: i32, date: &str, memo_id: i32) -> Result<()> {
        conn.execute(
            "INSERT INTO calendar_day (workspace_id, date)
             VALUES (?, ?)
             ON CONFLICT(workspace_id, date) DO NOTHING",
            (workspace_id, date),
        )?;

        let calendar_day_id =
            Self::find_id(conn, workspace_id, date)?.ok_or(rusqlite::Error::QueryReturnedNoRows)?;

        conn.execute(
            "INSERT INTO calendar_day_memo (calendar_day_id, memo_id)
             VALUES (?, ?)
             ON CONFLICT(calendar_day_id, memo_id) DO NOTHING",
            (calendar_day_id, memo_id),
        )?;

        Ok(())
    }

    pub fn remove_memo(
        conn: &Connection,
        workspace_id: i32,
        date: &str,
        memo_id: i32,
    ) -> Result<()> {
        if let Some(calendar_day_id) = Self::find_id(conn, workspace_id, date)? {
            conn.execute(
                "DELETE FROM calendar_day_memo WHERE calendar_day_id = ? AND memo_id = ?",
                (calendar_day_id, memo_id),
            )?;
        }

        Self::delete_if_empty(conn, workspace_id, date)
    }

    fn find_id(conn: &Connection, workspace_id: i32, date: &str) -> Result<Option<i32>> {
        conn.query_row(
            "SELECT id FROM calendar_day WHERE workspace_id = ? AND date = ?",
            (workspace_id, date),
            |row| row.get(0),
        )
        .optional()
    }

    fn delete_if_empty(conn: &Connection, workspace_id: i32, date: &str) -> Result<()> {
        conn.execute(
            "DELETE FROM calendar_day
             WHERE workspace_id = ? AND date = ?
               AND COALESCE(note, '') = ''
               AND is_non_working = 0
               AND NOT EXISTS (
                 SELECT 1 FROM calendar_day_memo
                 WHERE calendar_day_memo.calendar_day_id = calendar_day.id
               )",
            (workspace_id, date),
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use super::CalendarDayRepository;
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
    fn empty_calendar_day_is_removed() {
        let conn = setup_conn();
        let workspace = WorkspaceRepository::create(&conn, "test", "Test")
            .expect("workspace should be created");

        CalendarDayRepository::update_day(&conn, workspace.id, "2026-06-03", Some("Note"), true)
            .expect("calendar day should update");
        CalendarDayRepository::update_day(&conn, workspace.id, "2026-06-03", None, false)
            .expect("calendar day should clear");

        let days = CalendarDayRepository::list_by_year(&conn, workspace.id, 2026)
            .expect("calendar days should load");
        assert!(days.is_empty());
    }

    #[test]
    fn memo_link_keeps_calendar_day_until_removed() {
        let conn = setup_conn();
        let workspace = WorkspaceRepository::create(&conn, "test", "Test")
            .expect("workspace should be created");
        let memo = MemoRepository::create(&conn, workspace.id, "memo", "Memo", r#"{"type":"doc"}"#)
            .expect("memo should be created");

        CalendarDayRepository::add_memo(&conn, workspace.id, "2026-06-03", memo.id)
            .expect("memo should link");

        let days = CalendarDayRepository::list_by_year(&conn, workspace.id, 2026)
            .expect("calendar days should load");
        assert_eq!(days.len(), 1);
        assert_eq!(days[0].memos.len(), 1);

        CalendarDayRepository::remove_memo(&conn, workspace.id, "2026-06-03", memo.id)
            .expect("memo should unlink");
        let days = CalendarDayRepository::list_by_year(&conn, workspace.id, 2026)
            .expect("calendar days should load");
        assert!(days.is_empty());
    }
}
