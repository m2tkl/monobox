use crate::models::Workspace;
use rusqlite::{Connection, OptionalExtension, Result};

pub struct WorkspaceRepository;

impl WorkspaceRepository {
    pub fn list(conn: &Connection) -> Result<Vec<Workspace>, String> {
        let mut stmt = conn
            .prepare("SELECT id, slug_name, name, created_at, updated_at FROM workspace")
            .map_err(|e| e.to_string())?;

        let workspaces = stmt
            .query_map([], |row| {
                Ok(Workspace {
                    id: row.get(0)?,
                    slug_name: row.get(1)?,
                    name: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(workspaces)
    }

    pub fn find_by_slug(conn: &Connection, slug_name: &str) -> Result<Option<Workspace>> {
        let mut stmt = conn.prepare(
            "SELECT id, slug_name, name, created_at, updated_at
            FROM workspace
            WHERE slug_name = ?
            ",
        )?;

        let workspace = stmt
            .query_row([slug_name], |row| {
                Ok(Workspace {
                    id: row.get(0)?,
                    slug_name: row.get(1)?,
                    name: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                })
            })
            .optional()?;

        Ok(workspace)
    }
}
