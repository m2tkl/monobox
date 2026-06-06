use crate::database::get_conn;
use crate::models::calendar_day::CalendarDay;
use crate::repositories::{CalendarDayRepository, MemoRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct ListCalendarDaysArgs {
    pub workspace_slug_name: String,
    pub year: i32,
}

#[derive(Deserialize)]
pub struct UpdateCalendarDayArgs {
    pub workspace_slug_name: String,
    pub date: String,
    pub note: Option<String>,
    pub is_non_working: bool,
}

#[derive(Deserialize)]
pub struct CalendarDayMemoArgs {
    pub workspace_slug_name: String,
    pub date: String,
    pub memo_slug_title: String,
}

#[derive(Deserialize)]
pub struct ListCalendarMemoDatesArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[command]
pub fn list_calendar_days(args: ListCalendarDaysArgs) -> Result<Vec<CalendarDay>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;

    CalendarDayRepository::list_by_year(&conn, workspace.id, args.year).map_err(|e| e.to_string())
}

#[command]
pub fn list_calendar_memo_dates(args: ListCalendarMemoDatesArgs) -> Result<Vec<String>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    CalendarDayRepository::list_dates_by_memo(&conn, workspace.id, memo.id)
        .map_err(|e| e.to_string())
}

#[command]
pub fn update_calendar_day(args: UpdateCalendarDayArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    validate_date(&conn, &args.date)?;

    CalendarDayRepository::update_day(
        &conn,
        workspace.id,
        &args.date,
        args.note.as_deref(),
        args.is_non_working,
    )
    .map_err(|e| e.to_string())
}

#[command]
pub fn add_calendar_day_memo(args: CalendarDayMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    validate_date(&conn, &args.date)?;
    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    CalendarDayRepository::add_memo(&conn, workspace.id, &args.date, memo.id)
        .map_err(|e| e.to_string())
}

#[command]
pub fn remove_calendar_day_memo(args: CalendarDayMemoArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let workspace = resolve_workspace(&conn, &args.workspace_slug_name)?;
    validate_date(&conn, &args.date)?;
    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    CalendarDayRepository::remove_memo(&conn, workspace.id, &args.date, memo.id)
        .map_err(|e| e.to_string())
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
        return Err(format!("Invalid calendar date: {date}"));
    }

    Ok(())
}
