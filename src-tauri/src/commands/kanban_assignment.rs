use crate::database::get_conn;
use crate::models::kanban_assignment::{KanbanAssignmentEntry, KanbanAssignmentItem};
use crate::repositories::{KanbanAssignmentRepository, MemoRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct ListKanbanAssignmentItemsArgs {
    pub workspace_slug_name: String,
    pub kanban_id: i32,
}

#[command]
pub fn list_kanban_assignment_items(
    args: ListKanbanAssignmentItemsArgs,
) -> Result<Vec<KanbanAssignmentItem>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    KanbanAssignmentRepository::list_items_by_kanban(&conn, workspace.id, args.kanban_id)
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct ListKanbanAssignmentEntriesArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[command]
pub fn list_kanban_assignment_entries(
    args: ListKanbanAssignmentEntriesArgs,
) -> Result<Vec<KanbanAssignmentEntry>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    KanbanAssignmentRepository::list_entries_by_memo(&conn, workspace.id, memo.id)
        .map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct UpsertKanbanAssignmentStatusArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub kanban_id: i32,
    pub kanban_status_id: Option<i32>,
    pub position: Option<i64>,
}

#[command]
pub fn upsert_kanban_assignment_status(args: UpsertKanbanAssignmentStatusArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    KanbanAssignmentRepository::upsert_status(
        &conn,
        workspace.id,
        memo.id,
        args.kanban_id,
        args.kanban_status_id,
        args.position,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[derive(Deserialize)]
pub struct RemoveKanbanAssignmentArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub kanban_id: i32,
}

#[command]
pub fn remove_kanban_assignment(args: RemoveKanbanAssignmentArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    let deleted = KanbanAssignmentRepository::delete_entry(&conn, workspace.id, memo.id, args.kanban_id)
        .map_err(|e| e.to_string())?;

    if !deleted {
        return Err("Memo is not in the kanban.".to_string());
    }

    Ok(())
}
