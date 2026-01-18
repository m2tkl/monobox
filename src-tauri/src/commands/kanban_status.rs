use crate::database::get_conn;
use crate::models::kanban_status::KanbanStatus;
use crate::repositories::{KanbanStatusRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct ListKanbanStatusesArgs {
    pub workspace_slug_name: String,
    pub kanban_id: Option<i32>,
}

#[command]
pub fn list_kanban_statuses(args: ListKanbanStatusesArgs) -> Result<Vec<KanbanStatus>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let kanban_id = if let Some(id) = args.kanban_id {
        id
    }
    else {
        let kanbans = crate::repositories::KanbanRepository::list_by_workspace(&conn, workspace.id)
            .map_err(|e| e.to_string())?;
        kanbans
            .first()
            .map(|k| k.id)
            .ok_or_else(|| "Kanban not found".to_string())?
    };

    KanbanStatusRepository::list_by_kanban(&conn, workspace.id, kanban_id)
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct CreateKanbanStatusArgs {
    pub workspace_slug_name: String,
    pub kanban_id: Option<i32>,
    pub name: String,
    pub color: Option<String>,
}

#[command]
pub fn create_kanban_status(args: CreateKanbanStatusArgs) -> Result<KanbanStatus, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let kanban_id = if let Some(id) = args.kanban_id {
        id
    }
    else {
        let kanbans = crate::repositories::KanbanRepository::list_by_workspace(&conn, workspace.id)
            .map_err(|e| e.to_string())?;
        kanbans
            .first()
            .map(|k| k.id)
            .ok_or_else(|| "Kanban not found".to_string())?
    };

    KanbanStatusRepository::create(
        &conn,
        workspace.id,
        kanban_id,
        &args.name,
        args.color.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct UpdateKanbanStatusArgs {
    pub workspace_slug_name: String,
    pub id: i32,
    pub name: String,
    pub color: Option<String>,
}

#[command]
pub fn update_kanban_status(args: UpdateKanbanStatusArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let updated = KanbanStatusRepository::update(
        &conn,
        workspace.id,
        args.id,
        &args.name,
        args.color.as_deref(),
    )
    .map_err(|e| e.to_string())?;

    if !updated {
        return Err(format!("Kanban status not found: {}", args.id));
    }

    Ok(())
}

#[derive(Deserialize)]
pub struct DeleteKanbanStatusArgs {
    pub workspace_slug_name: String,
    pub id: i32,
}

#[command]
pub fn delete_kanban_status(args: DeleteKanbanStatusArgs) -> Result<(), String> {
    let mut conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let deleted = KanbanStatusRepository::delete(&tx, workspace.id, args.id)
        .map_err(|e| e.to_string())?;

    if !deleted {
        return Err(format!("Kanban status not found: {}", args.id));
    }

    tx.execute(
        "DELETE FROM kanban_assignment
        WHERE workspace_id = ? AND kanban_status_id = ?",
        (workspace.id, args.id),
    )
    .map_err(|e| e.to_string())?;

    tx.commit().map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Deserialize)]
pub struct KanbanStatusOrderUpdate {
    pub id: i32,
    pub order_index: i32,
}

#[derive(Deserialize)]
pub struct UpdateKanbanStatusOrdersArgs {
    pub workspace_slug_name: String,
    pub updates: Vec<KanbanStatusOrderUpdate>,
}

#[command]
pub fn update_kanban_status_orders(args: UpdateKanbanStatusOrdersArgs) -> Result<(), String> {
    let mut conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let updates: Vec<(i32, i32)> = args
        .updates
        .into_iter()
        .map(|update| (update.id, update.order_index))
        .collect();

    KanbanStatusRepository::update_orders(&mut conn, workspace.id, &updates)
        .map_err(|e| e.to_string())?;

    Ok(())
}
