use crate::database::get_conn;
use crate::models::milestone::Milestone;
use crate::repositories::{MemoRepository, MilestoneRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct ListMilestonesArgs {
    pub workspace_slug_name: String,
    pub year: i32,
}

#[derive(Deserialize)]
pub struct CreateMilestoneArgs {
    pub workspace_slug_name: String,
    pub date: String,
    pub title: String,
}

#[derive(Deserialize)]
pub struct UpdateMilestoneArgs {
    pub workspace_slug_name: String,
    pub id: i32,
    pub date: String,
    pub title: String,
}

#[derive(Deserialize)]
pub struct MilestoneMemoArgs {
    pub workspace_slug_name: String,
    pub id: i32,
    pub memo_slug_title: String,
}

#[derive(Deserialize)]
pub struct DeleteMilestoneArgs {
    pub workspace_slug_name: String,
    pub id: i32,
}

#[derive(Deserialize)]
pub struct SetMilestoneCompletedArgs {
    pub workspace_slug_name: String,
    pub id: i32,
    pub completed: bool,
}

#[command]
pub fn list_milestones(args: ListMilestonesArgs) -> Result<Vec<Milestone>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    MilestoneRepository::list_by_year(&conn, workspace.id, args.year).map_err(|e| e.to_string())
}

#[command]
pub fn create_milestone(args: CreateMilestoneArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    validate_date(&conn, &args.date)?;
    let title = args.title.trim();
    if title.is_empty() {
        return Err("Milestone title is required.".to_string());
    }
    MilestoneRepository::create(&conn, workspace.id, &args.date, title)
        .map_err(|e| e.to_string())
        .map(|_| ())
}

#[command]
pub fn update_milestone(args: UpdateMilestoneArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    validate_date(&conn, &args.date)?;
    let title = args.title.trim();
    if title.is_empty() {
        return Err("Milestone title is required.".to_string());
    }
    let updated = MilestoneRepository::update(&conn, workspace.id, args.id, &args.date, title)
        .map_err(|e| e.to_string())?;
    if !updated {
        return Err(format!("Milestone not found: {}", args.id));
    }
    Ok(())
}

#[command]
pub fn add_milestone_memo(args: MilestoneMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;
    let updated = MilestoneRepository::add_memo(&conn, workspace.id, args.id, memo.id)
        .map_err(|e| e.to_string())?;
    if !updated {
        return Err(format!("Milestone not found: {}", args.id));
    }
    Ok(())
}

#[command]
pub fn remove_milestone_memo(args: MilestoneMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;
    let updated = MilestoneRepository::remove_memo(&conn, workspace.id, args.id, memo.id)
        .map_err(|e| e.to_string())?;
    if !updated {
        return Err(format!("Milestone not found: {}", args.id));
    }
    Ok(())
}

#[command]
pub fn set_milestone_completed(args: SetMilestoneCompletedArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    let updated = MilestoneRepository::set_completed(&conn, workspace.id, args.id, args.completed)
        .map_err(|e| e.to_string())?;
    if !updated {
        return Err(format!("Milestone not found: {}", args.id));
    }
    Ok(())
}

#[command]
pub fn delete_milestone(args: DeleteMilestoneArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    let deleted =
        MilestoneRepository::delete(&conn, workspace.id, args.id).map_err(|e| e.to_string())?;
    if !deleted {
        return Err(format!("Milestone not found: {}", args.id));
    }
    Ok(())
}

fn resolve_workspace(
    conn: &rusqlite::Connection,
    workspace_slug_name: &str,
) -> Result<crate::models::Workspace, String> {
    WorkspaceRepository::find_by_slug(conn, workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", workspace_slug_name))
}

fn validate_date(conn: &rusqlite::Connection, date: &str) -> Result<(), String> {
    let is_valid: bool = conn
        .query_row("SELECT date(?, '+0 days') = ?", (date, date), |row| {
            row.get(0)
        })
        .map_err(|e| e.to_string())?;
    if !is_valid {
        return Err(format!("Invalid milestone date: {date}"));
    }
    Ok(())
}
