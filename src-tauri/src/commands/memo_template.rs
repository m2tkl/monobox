use crate::database::get_conn;
use crate::models::memo_template::{MemoTemplateDetail, MemoTemplateIndexItem};
use crate::repositories::{MemoTemplateRepository, WorkspaceRepository};
use serde::Deserialize;
use tauri::command;

#[derive(Deserialize)]
pub struct GetMemoTemplatesArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn get_workspace_memo_templates(
    args: GetMemoTemplatesArgs,
) -> Result<Vec<MemoTemplateIndexItem>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    MemoTemplateRepository::list(&conn, workspace.id)
}

#[derive(Deserialize)]
pub struct GetMemoTemplateArgs {
    pub workspace_slug_name: String,
    pub template_slug_name: String,
}

#[command]
pub fn get_memo_template(args: GetMemoTemplateArgs) -> Result<MemoTemplateDetail, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    match MemoTemplateRepository::find_by_slug(&conn, workspace.id, &args.template_slug_name) {
        Ok(Some(template)) => Ok(template),
        Ok(None) => Err(format!(
            "Memo template not found for slug: {}",
            args.template_slug_name
        )),
        Err(error) => Err(error),
    }
}

#[derive(Deserialize)]
pub struct CreateMemoTemplateArgs {
    pub workspace_slug_name: String,
    pub slug_name: String,
    pub name: String,
    pub content: String,
}

#[command]
pub fn create_memo_template(args: CreateMemoTemplateArgs) -> Result<MemoTemplateDetail, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    MemoTemplateRepository::create(
        &conn,
        workspace.id,
        &args.slug_name,
        &args.name,
        &args.content,
    )
}

#[derive(Deserialize)]
pub struct SaveMemoTemplateArgs {
    pub workspace_slug_name: String,
    pub target_slug_name: String,
    pub new_slug_name: String,
    pub new_name: String,
    pub new_content: String,
}

#[command]
pub fn save_memo_template(args: SaveMemoTemplateArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let template =
        MemoTemplateRepository::find_by_slug(&conn, workspace.id, &args.target_slug_name)?
            .ok_or_else(|| {
                format!(
                    "Memo template not found for slug: {}",
                    args.target_slug_name
                )
            })?;

    MemoTemplateRepository::save(
        &conn,
        template.id,
        &args.new_slug_name,
        &args.new_name,
        &args.new_content,
    )
}

#[derive(Deserialize)]
pub struct DeleteMemoTemplateArgs {
    pub workspace_slug_name: String,
    pub template_slug_name: String,
}

#[command]
pub fn delete_memo_template(args: DeleteMemoTemplateArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let template =
        MemoTemplateRepository::find_by_slug(&conn, workspace.id, &args.template_slug_name)?
            .ok_or_else(|| {
                format!(
                    "Memo template not found for slug: {}",
                    args.template_slug_name
                )
            })?;

    MemoTemplateRepository::delete(&conn, template.id)
}

#[derive(Deserialize)]
pub struct SetDefaultMemoTemplateArgs {
    pub workspace_slug_name: String,
    pub template_slug_name: String,
}

#[command]
pub fn set_default_memo_template(args: SetDefaultMemoTemplateArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let template =
        MemoTemplateRepository::find_by_slug(&conn, workspace.id, &args.template_slug_name)?
            .ok_or_else(|| {
                format!(
                    "Memo template not found for slug: {}",
                    args.template_slug_name
                )
            })?;

    MemoTemplateRepository::set_default(&conn, workspace.id, template.id)
}

#[derive(Deserialize)]
pub struct ClearDefaultMemoTemplateArgs {
    pub workspace_slug_name: String,
}

#[command]
pub fn clear_default_memo_template(args: ClearDefaultMemoTemplateArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    MemoTemplateRepository::clear_default(&conn, workspace.id)
}
