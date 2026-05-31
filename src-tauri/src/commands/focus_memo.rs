use crate::database::get_conn;
use crate::models::focus_memo;
use crate::repositories::{FocusMemoRepository, MemoRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct GetFocusMemosArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn list_focus_memos(args: GetFocusMemosArgs) -> Result<Vec<focus_memo::FocusMemo>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    FocusMemoRepository::list_by_workspace(&conn, workspace.id)
}

#[derive(Deserialize)]
pub struct FocusMemoArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

fn resolve_workspace_and_memo_ids(args: &FocusMemoArgs) -> Result<(i32, i32), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    Ok((workspace.id, memo.id))
}

#[command]
pub fn add_focus_memo(args: FocusMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;
    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    FocusMemoRepository::create(&conn, workspace.id, memo.id).map_err(|e| e.to_string())
}

#[command]
pub fn delete_focus_memo(args: FocusMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let (workspace_id, memo_id) = resolve_workspace_and_memo_ids(&args)?;
    FocusMemoRepository::delete(&conn, workspace_id, memo_id).map_err(|e| e.to_string())
}

#[command]
pub fn mark_focus_memo_done_for_today(args: FocusMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let (workspace_id, memo_id) = resolve_workspace_and_memo_ids(&args)?;
    FocusMemoRepository::mark_done_for_today(&conn, workspace_id, memo_id)
        .map_err(|e| e.to_string())
}

#[command]
pub fn clear_focus_memo_done_for_today(args: FocusMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let (workspace_id, memo_id) = resolve_workspace_and_memo_ids(&args)?;
    FocusMemoRepository::clear_done_for_today(&conn, workspace_id, memo_id)
        .map_err(|e| e.to_string())
}
