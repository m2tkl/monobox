use crate::models::memo::{MemoDetail, MemoIndexItem};
use rusqlite::{Connection, Result, OptionalExtension};

pub struct MemoRepository;

impl MemoRepository {
    pub fn list(conn: &Connection, workspace_id: i32) -> Result<Vec<MemoIndexItem>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_title, title, description, created_at, updated_at
                FROM memo
                WHERE workspace_id = ?
                ORDER BY updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let memos = stmt
            .query_map([workspace_id], |row| {
                Ok(MemoIndexItem {
                    id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(memos)
    }

    pub fn find_by_slug(
        conn: &Connection,
        workspace_id: i32,
        memo_slug_title: &str,
    ) -> Result<Option<MemoDetail>> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_title, title, json(content) AS content, description, workspace_id, created_at, updated_at
                FROM memo
                WHERE
                  workspace_id = ?
                  AND slug_title = ?",
            )?;

        let memo: Option<MemoDetail> = stmt
            .query_row((workspace_id, memo_slug_title), |row| {
                Ok(MemoDetail {
                    id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    description: row.get(4)?,
                    workspace_id: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .optional()?;

        Ok(memo)
    }

    pub fn create(conn: &Connection, workspace_id: i32, slug_title: &str, title: &str, content: &str) -> Result<MemoDetail> {
        conn.execute(
            "INSERT INTO memo (workspace_id, slug_title, title, content)
            VALUES (?, ?, ?, ?)",
            (workspace_id, slug_title, title, content),
        )?;

        let memo_id = conn.last_insert_rowid() as i32;

        let mut stmt = conn.prepare(
            "SELECT id, slug_title, title, json(content) AS content, description, workspace_id, created_at, updated_at
            FROM memo
            WHERE id = ?",
        )?;

        let memo = stmt.query_row([memo_id], |row| {
            Ok(MemoDetail {
                id: row.get(0)?,
                slug_title: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                description: row.get(4)?,
                workspace_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?;

        Ok(memo)
    }
}
