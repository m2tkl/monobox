use crate::database::get_conn;
use crate::models::Workspace;
use crate::repositories::WorkspaceRepository;
use serde::Deserialize;
use tauri::command;

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
        Ok(None) => Err(format!(
            "Workspace not found for slug: {}",
            args.workspace_slug_name
        )),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Deserialize)]
pub struct CreateWorkspaceArgs {
    pub workspace_slug_name: String,
    pub workspace_name: String,
}

#[command]
pub fn create_workspace(args: CreateWorkspaceArgs) -> Result<Workspace, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    WorkspaceRepository::create(&conn, &args.workspace_slug_name, &args.workspace_name)
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct SaveWorkspaceArgs {
    pub workspace_slug_name: String,
    pub workspace_name: String,
}

#[command]
pub fn save_workspace(args: SaveWorkspaceArgs) -> Result<(), String> {
    let mut conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("worspace not found for slug: {}", &args.workspace_slug_name))?;

    WorkspaceRepository::save(
        &mut conn,
        workspace.id,
        &args.workspace_slug_name,
        &args.workspace_name,
    )
    .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct DeleteWorkspaceArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn delete_workspace(args: DeleteWorkspaceArgs) -> Result<(), String> {
    let mut conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("worspace not found for slug: {}", &args.workspace_slug_name))?;

    WorkspaceRepository::delete(&mut conn, workspace.id).map_err(|e| e.to_string())?;

    Ok(())
}
