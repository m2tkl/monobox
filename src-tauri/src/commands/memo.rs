use crate::database::get_conn;
use crate::models::memo::MemoDetail;
use crate::models::MemoIndexItem;
use crate::repositories::{MemoRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct GetMemosArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn get_workspace_memos(args: GetMemosArgs) -> Result<Vec<MemoIndexItem>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    MemoRepository::list(&conn, workspace.id).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct GetMemoArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[command]
pub fn get_memo(args: GetMemoArgs) -> Result<MemoDetail, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    match MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title) {
        Ok(Some(memo)) => Ok(memo),
        Ok(None) => Err(format!("Memo not found for slug: {}", args.memo_slug_title)),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(Deserialize)]
pub struct CreateMemoArgs {
    pub workspace_slug_name: String,
    pub slug_title: String,
    pub title: String,
    pub content: String,
}

#[command]
pub fn create_memo(args: CreateMemoArgs) -> Result<MemoDetail, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| {
            format!(
                "Workspace not found for slug: {}",
                &args.workspace_slug_name
            )
        })?;

    MemoRepository::create(
        &conn,
        workspace.id,
        &args.slug_title,
        &args.title,
        &args.content,
    )
    .map_err(|e| e.to_string())
}
