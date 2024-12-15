use tauri::command;
use crate::database::get_conn;
use crate::repositories::WorkspaceRepository;
use crate::models::Workspace;
use serde::Deserialize;

#[command]
pub fn get_workspaces() -> Result<Vec<Workspace>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    WorkspaceRepository::list(&conn).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct GetWorkspaceArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn get_workspace(args: GetWorkspaceArgs) -> Result<Workspace, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    match WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name) {
        Ok(Some(workspace)) => Ok(workspace),
        Ok(None) => Err(format!("Workspace not found for slug: {}", args.workspace_slug_name)),
        Err(e) => Err(e.to_string()),

    }
}
