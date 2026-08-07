use crate::database::get_conn;
use crate::models::focus_daily_state;
use crate::repositories::{FocusDailyStateRepository, MemoRepository, WorkspaceRepository};
use rusqlite::Connection;
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct GetFocusDailyStatesArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn list_focus_daily_states(
    args: GetFocusDailyStatesArgs,
) -> Result<Vec<focus_daily_state::FocusDailyState>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    FocusDailyStateRepository::list_by_workspace(&conn, workspace.id)
}

#[derive(Deserialize)]
pub struct FocusDailyStateArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

fn resolve_workspace_and_memo_ids(
    conn: &Connection,
    args: &FocusDailyStateArgs,
) -> Result<(i32, i32), String> {
    let workspace = WorkspaceRepository::find_by_slug(conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    Ok((workspace.id, memo.id))
}

#[command]
pub fn mark_focus_done_for_today(args: FocusDailyStateArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let (workspace_id, memo_id) = resolve_workspace_and_memo_ids(&conn, &args)?;
    FocusDailyStateRepository::mark_done_for_today(&conn, workspace_id, memo_id)
        .map_err(|e| e.to_string())
}

#[command]
pub fn clear_focus_done_for_today(args: FocusDailyStateArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let (workspace_id, memo_id) = resolve_workspace_and_memo_ids(&conn, &args)?;
    FocusDailyStateRepository::clear_done_for_today(&conn, workspace_id, memo_id)
        .map_err(|e| e.to_string())
}
