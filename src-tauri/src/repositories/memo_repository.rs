use crate::models::memo::{MemoDetail, MemoIndexItem};
use rusqlite::{Connection, OptionalExtension, Result};

pub struct MemoRepository;

impl MemoRepository {
    pub fn list(conn: &Connection, workspace_id: i32) -> Result<Vec<MemoIndexItem>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_title, title, description, thumbnail_image, created_at, updated_at, modified_at
                FROM memo
                WHERE workspace_id = ?
                ORDER BY modified_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let memos = stmt
            .query_map([workspace_id], |row| {
                Ok(MemoIndexItem {
                    id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    thumbnail_image: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    modified_at: row.get(7)?,
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
                "SELECT id, slug_title, title, json(content) AS content, description, thumbnail_image, workspace_id, created_at, updated_at, modified_at
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
                    thumbnail_image: row.get(5)?,
                    workspace_id: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                    modified_at: row.get(9)?,
                })
            })
            .optional()?;

        Ok(memo)
    }

    pub fn create(
        conn: &Connection,
        workspace_id: i32,
        slug_title: &str,
        title: &str,
        content: &str,
    ) -> Result<MemoDetail> {
        conn.execute(
            "INSERT INTO memo (workspace_id, slug_title, title, content, modified_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (workspace_id, slug_title, title, content),
        )?;

        let memo_id = conn.last_insert_rowid() as i32;

        let mut stmt = conn.prepare(
            "SELECT id, slug_title, title, json(content) AS content, description, thumbnail_image, workspace_id, created_at, updated_at, modified_at
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
                thumbnail_image: row.get(5)?,
                workspace_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                modified_at: row.get(9)?,
            })
        })?;

        Ok(memo)
    }

    pub fn save(
        conn: &mut Connection,
        memo_id: i32,
        workspace_slug: &str,
        target_slug_title: &str,
        slug_title: &str,
        title: &str,
        content: &str,
        description: &str,
        thumbnail_image: &str,
    ) -> Result<()> {
        let tx = conn.transaction()?;

        tx.execute(
            "UPDATE memo
            SET slug_title = ?, title = ?, content = ?, description = ?, thumbnail_image = ?, modified_at = CURRENT_TIMESTAMP
            WHERE id = ?",
            (slug_title, title, content, description, thumbnail_image, memo_id),
        )?;

        tx.execute(
            "UPDATE memo
            SET content = REPLACE(content, ?, ?)
            WHERE id IN (
                SELECT from_memo_id
                FROM link
                WHERE to_memo_id = ?
            )",
            (
                format!(r#""href":"/{}/{}""#, workspace_slug, target_slug_title),
                format!(r#""href":"/{}/{}""#, workspace_slug, slug_title),
                memo_id,
            ),
        )?;

        tx.commit()?;
        Ok(())
    }

    pub fn delete(conn: &mut Connection, memo_id: i32) -> Result<()> {
        let tx = conn.transaction()?;

        tx.execute(
            "DELETE FROM link
            WHERE from_memo_id = ? OR to_memo_id = ?
            ",
            (memo_id, memo_id),
        )?;

        tx.execute("DELETE FROM memo WHERE id = ?", (memo_id,))?;

        tx.commit()?;
        Ok(())
    }
}
