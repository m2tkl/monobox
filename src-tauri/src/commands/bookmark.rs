use crate::database::get_conn;
use crate::models::bookmark;
use crate::repositories::{BookmarkRepository, MemoRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct GetBookmarksArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn list_bookmarks(args: GetBookmarksArgs) -> Result<Vec<bookmark::Bookmark>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    BookmarkRepository::list_by_workspace(&conn, workspace.id)
}

#[derive(Deserialize)]
pub struct CreateBookmarkArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[command]
pub fn add_bookmark(args: CreateBookmarkArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    BookmarkRepository::create(&conn, workspace.id, memo.id).map_err(|e| e.to_string())
}

#[derive(Deserialize)]
pub struct DeleteBookmarkArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[command]
pub fn delete_bookmark(args: DeleteBookmarkArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    BookmarkRepository::delete(&conn, workspace.id, memo.id).map_err(|e| e.to_string())
}
