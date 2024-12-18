use crate::database::get_conn;
use crate::models::{Link, LinkId};
use crate::repositories::{MemoRepository, WorkspaceRepository, LinkRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct GetLinksArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[command]
pub fn get_links(args: GetLinksArgs) -> Result<Vec<Link>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    let links = LinkRepository::list(&conn, memo.id);

    links
}

#[derive(Deserialize)]
pub struct CreateLinkArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub to_memo_slug_title: String,
}

#[command]
pub fn create_link(args: CreateLinkArgs) -> Result<LinkId, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    let link = LinkRepository::create(&conn, memo.id, &args.to_memo_slug_title)
        .map_err(|e| e.to_string());

    link
}
