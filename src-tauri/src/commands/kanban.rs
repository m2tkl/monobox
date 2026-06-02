use crate::database::get_conn;
use crate::models::kanban::Kanban;
use crate::repositories::{KanbanRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct ListKanbansArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn list_kanbans(args: ListKanbansArgs) -> Result<Vec<Kanban>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let kanban = KanbanRepository::ensure_global_status_board(&conn, workspace.id)
        .map_err(|e| e.to_string())?;

    Ok(vec![kanban])
}

#[derive(Deserialize)]
pub struct CreateKanbanArgs {
    pub workspace_slug_name: String,
    pub name: String,
}

#[command]
pub fn create_kanban(args: CreateKanbanArgs) -> Result<Kanban, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    KanbanRepository::create(&conn, workspace.id, &args.name).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct UpdateKanbanStatusRolesArgs {
    pub workspace_slug_name: String,
    pub id: i32,
    pub default_status_id: Option<i32>,
    pub focus_status_id: Option<i32>,
}

#[command]
pub fn update_kanban_status_roles(args: UpdateKanbanStatusRolesArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let updated = KanbanRepository::update_status_roles(
        &conn,
        workspace.id,
        args.id,
        args.default_status_id,
        args.focus_status_id,
    )
    .map_err(|e| e.to_string())?;

    if !updated {
        return Err(format!("Kanban not found: {}", args.id));
    }

    Ok(())
}

#[derive(Deserialize)]
pub struct DeleteKanbanArgs {
    pub workspace_slug_name: String,
    pub id: i32,
}

#[command]
pub fn delete_kanban(args: DeleteKanbanArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let deleted =
        KanbanRepository::delete(&conn, workspace.id, args.id).map_err(|e| e.to_string())?;

    if !deleted {
        return Err(format!("Kanban not found: {}", args.id));
    }

    Ok(())
}
