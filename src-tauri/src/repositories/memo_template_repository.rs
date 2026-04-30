use crate::models::memo_template::{MemoTemplateDetail, MemoTemplateIndexItem};
use rusqlite::{Connection, OptionalExtension, Result};

pub struct MemoTemplateRepository;

impl MemoTemplateRepository {
    pub fn list(conn: &Connection, workspace_id: i32) -> Result<Vec<MemoTemplateIndexItem>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_name, name, is_default, created_at, updated_at
                FROM memo_template
                WHERE workspace_id = ?
                ORDER BY is_default DESC, name ASC, updated_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let templates = stmt
            .query_map([workspace_id], |row| {
                Ok(MemoTemplateIndexItem {
                    id: row.get(0)?,
                    slug_name: row.get(1)?,
                    name: row.get(2)?,
                    is_default: row.get(3)?,
                    created_at: row.get(4)?,
                    updated_at: row.get(5)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(templates)
    }

    pub fn find_by_slug(
        conn: &Connection,
        workspace_id: i32,
        template_slug_name: &str,
    ) -> Result<Option<MemoTemplateDetail>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_name, name, json(content) AS content, is_default, workspace_id, created_at, updated_at
                FROM memo_template
                WHERE workspace_id = ? AND slug_name = ?",
            )
            .map_err(|e| e.to_string())?;

        let template = stmt
            .query_row((workspace_id, template_slug_name), |row| {
                Ok(MemoTemplateDetail {
                    id: row.get(0)?,
                    slug_name: row.get(1)?,
                    name: row.get(2)?,
                    content: row.get(3)?,
                    is_default: row.get(4)?,
                    workspace_id: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .optional()
            .map_err(|e| e.to_string())?;

        Ok(template)
    }

    pub fn create(
        conn: &Connection,
        workspace_id: i32,
        slug_name: &str,
        name: &str,
        content: &str,
    ) -> Result<MemoTemplateDetail, String> {
        conn.execute(
            "INSERT INTO memo_template (workspace_id, slug_name, name, content)
            VALUES (?, ?, ?, ?)",
            (workspace_id, slug_name, name, content),
        )
        .map_err(|e| e.to_string())?;

        let template_id = conn.last_insert_rowid() as i32;
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_name, name, json(content) AS content, is_default, workspace_id, created_at, updated_at
                FROM memo_template
                WHERE id = ?",
            )
            .map_err(|e| e.to_string())?;

        stmt.query_row([template_id], |row| {
            Ok(MemoTemplateDetail {
                id: row.get(0)?,
                slug_name: row.get(1)?,
                name: row.get(2)?,
                content: row.get(3)?,
                is_default: row.get(4)?,
                workspace_id: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())
    }

    pub fn save(
        conn: &Connection,
        template_id: i32,
        slug_name: &str,
        name: &str,
        content: &str,
    ) -> Result<(), String> {
        conn.execute(
            "UPDATE memo_template
            SET slug_name = ?, name = ?, content = ?
            WHERE id = ?",
            (slug_name, name, content, template_id),
        )
        .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn delete(conn: &Connection, template_id: i32) -> Result<(), String> {
        conn.execute("DELETE FROM memo_template WHERE id = ?", [template_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn set_default(conn: &Connection, workspace_id: i32, template_id: i32) -> Result<(), String> {
        conn.execute(
            "UPDATE memo_template
            SET is_default = 0
            WHERE workspace_id = ?",
            [workspace_id],
        )
        .map_err(|e| e.to_string())?;

        conn.execute(
            "UPDATE memo_template
            SET is_default = 1
            WHERE id = ? AND workspace_id = ?",
            (template_id, workspace_id),
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn clear_default(conn: &Connection, workspace_id: i32) -> Result<(), String> {
        conn.execute(
            "UPDATE memo_template
            SET is_default = 0
            WHERE workspace_id = ?",
            [workspace_id],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::MemoTemplateRepository;
    use crate::migrations::apply_migrations;
    use rusqlite::Connection;

    #[test]
    fn set_default_marks_only_one_template_in_workspace() {
        let conn = Connection::open_in_memory().expect("in-memory DB should open");
        conn.execute("CREATE TABLE schema_migrations (version TEXT PRIMARY KEY)", [])
            .expect("schema_migrations should be creatable");
        apply_migrations(&conn).expect("migrations should apply");

        conn.execute(
            "INSERT INTO workspace (id, slug_name, name) VALUES (1, 'sample-workspace', 'Sample')",
            [],
        )
        .expect("workspace insert should succeed");

        conn.execute(
            "INSERT INTO memo_template (id, workspace_id, slug_name, name, content)
            VALUES (1, 1, 'alpha', 'Alpha', '\"\"'), (2, 1, 'beta', 'Beta', '\"\"')",
            [],
        )
        .expect("template inserts should succeed");

        MemoTemplateRepository::set_default(&conn, 1, 2).expect("set_default should succeed");

        let templates = MemoTemplateRepository::list(&conn, 1).expect("templates should load");
        let default_templates = templates
            .iter()
            .filter(|template| template.is_default)
            .map(|template| template.slug_name.as_str())
            .collect::<Vec<_>>();

        assert_eq!(default_templates, vec!["beta"]);
    }

    #[test]
    fn clear_default_unsets_default_template() {
        let conn = Connection::open_in_memory().expect("in-memory DB should open");
        conn.execute("CREATE TABLE schema_migrations (version TEXT PRIMARY KEY)", [])
            .expect("schema_migrations should be creatable");
        apply_migrations(&conn).expect("migrations should apply");

        conn.execute(
            "INSERT INTO workspace (id, slug_name, name) VALUES (1, 'sample-workspace', 'Sample')",
            [],
        )
        .expect("workspace insert should succeed");

        conn.execute(
            "INSERT INTO memo_template (id, workspace_id, slug_name, name, content, is_default)
            VALUES (1, 1, 'alpha', 'Alpha', '\"\"', 1)",
            [],
        )
        .expect("template insert should succeed");

        MemoTemplateRepository::clear_default(&conn, 1).expect("clear_default should succeed");

        let templates = MemoTemplateRepository::list(&conn, 1).expect("templates should load");
        assert!(templates.iter().all(|template| !template.is_default));
    }
}
