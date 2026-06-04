use std::path::PathBuf;
use std::process::Command as ProcessCommand;

use directories::{ProjectDirs, UserDirs};
use serde::Deserialize;
use tauri::command;
use tauri_plugin_opener::reveal_item_in_dir;

use crate::config::load_config;
use crate::database::get_conn;
use crate::models::file::{
    InboxFilePage, ManagedFileDetail, ManagedFileListPage, ManagedFileRecord, MemoLinkedFileItem,
    ResolvedFileOpenTarget,
};
use crate::repositories::{FileRepository, MemoRepository, WorkspaceRepository};

#[derive(Deserialize)]
pub struct ImportInboxFileArgs {
    pub source_path: String,
}

#[derive(Deserialize)]
pub struct CreateExternalFileLinkArgs {
    pub display_name: String,
    pub url: String,
}

#[derive(Deserialize)]
pub struct FileIdArgs {
    pub file_id: String,
}

#[derive(Deserialize)]
pub struct LinkFileToMemoArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub file_id: String,
}

#[derive(Deserialize)]
pub struct MemoFilesArgs {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
}

#[derive(Deserialize)]
pub struct ListFilesArgs {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
    pub unlinked_only: Option<bool>,
}

#[derive(Deserialize)]
pub struct UpdateFileDisplayNameArgs {
    pub file_id: String,
    pub display_name: String,
}

#[derive(Deserialize)]
pub struct UpdateExternalFileLinkArgs {
    pub file_id: String,
    pub display_name: String,
    pub url: String,
}

#[derive(Deserialize)]
pub struct UpdateFileNoteArgs {
    pub file_id: String,
    pub note: String,
}

#[derive(Deserialize)]
pub struct OpenLocalPathArgs {
    pub path: String,
}

#[command]
pub fn list_inbox_files(args: ListFilesArgs) -> Result<InboxFilePage, String> {
    let user_dirs =
        UserDirs::new().ok_or_else(|| "Failed to determine the user directories.".to_string())?;
    let downloads_dir = user_dirs
        .download_dir()
        .ok_or_else(|| "Downloads folder could not be resolved.".to_string())?;
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    let limit = args.limit.unwrap_or(20);
    let offset = args.offset.unwrap_or(0);
    FileRepository::list_inbox_files(
        downloads_dir,
        limit,
        offset,
        &config.inbox_ignore_file_names,
    )
}

#[command]
pub fn import_inbox_file(args: ImportInboxFileArgs) -> Result<ManagedFileRecord, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    if config.files_storage_root.trim().is_empty() {
        return Err("Files storage folder is not configured.".to_string());
    }

    let mut conn = get_conn().map_err(|e| e.to_string())?;
    let source_path = PathBuf::from(args.source_path);
    let storage_root = PathBuf::from(config.files_storage_root);
    FileRepository::import_local_file(&mut conn, &source_path, &storage_root)
}

#[command]
pub fn create_external_file_link(
    args: CreateExternalFileLinkArgs,
) -> Result<ManagedFileRecord, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::create_external_link(&conn, &args.display_name, &args.url)
}

#[command]
pub fn list_files(args: ListFilesArgs) -> Result<ManagedFileListPage, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    let limit = args.limit.unwrap_or(20);
    let offset = args.offset.unwrap_or(0);
    let unlinked_only = args.unlinked_only.unwrap_or(false);
    FileRepository::list_files(&conn, limit, offset, unlinked_only)
}

#[command]
pub fn get_file_detail(args: FileIdArgs) -> Result<ManagedFileDetail, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::get_file_detail(&conn, &args.file_id)?
        .ok_or_else(|| "File record was not found.".to_string())
}

#[command]
pub fn resolve_file_open_target(args: FileIdArgs) -> Result<ResolvedFileOpenTarget, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    let storage_root = PathBuf::from(config.files_storage_root);
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::resolve_open_target(&conn, &storage_root, &args.file_id)
}

#[command]
pub fn open_managed_file(args: FileIdArgs) -> Result<(), String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    let storage_root = PathBuf::from(config.files_storage_root);
    let conn = get_conn().map_err(|e| e.to_string())?;
    let target = FileRepository::resolve_open_target(&conn, &storage_root, &args.file_id)?;

    match target.open_kind.as_str() {
        "path" => open_file_with_fallback(&target.value),
        "url" => open_with_system_background(&target.value),
        _ => Err("Unsupported open target.".to_string()),
    }
}

#[command]
pub fn open_local_path(args: OpenLocalPathArgs) -> Result<(), String> {
    open_file_with_fallback(&args.path)
}

fn open_with_system_background(target: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let mut command = {
        let mut cmd = ProcessCommand::new("open");
        cmd.arg(target);
        cmd
    };

    #[cfg(target_os = "windows")]
    let mut command = {
        let mut cmd = ProcessCommand::new("cmd");
        cmd.args(["/C", "start", "", target]);
        cmd
    };

    #[cfg(all(unix, not(target_os = "macos")))]
    let mut command = {
        let mut cmd = ProcessCommand::new("xdg-open");
        cmd.arg(target);
        cmd
    };

    command
        .spawn()
        .map_err(|e| format!("Failed to launch opener: {}", e))?;

    Ok(())
}

fn open_file_with_fallback(path: &str) -> Result<(), String> {
    match open_with_system_background(path) {
        Ok(()) => Ok(()),
        Err(open_error) => {
            reveal_item_in_dir(path).map_err(|reveal_error| {
                format!("{}; fallback reveal failed: {}", open_error, reveal_error)
            })?;
            Ok(())
        }
    }
}

#[command]
pub fn delete_file_record(args: FileIdArgs) -> Result<(), String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::delete_file_record(&conn, &args.file_id)
}

#[command]
pub fn update_file_display_name(
    args: UpdateFileDisplayNameArgs,
) -> Result<ManagedFileRecord, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::update_display_name(&conn, &args.file_id, &args.display_name)
}

#[command]
pub fn update_external_file_link(
    args: UpdateExternalFileLinkArgs,
) -> Result<ManagedFileRecord, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::update_external_link(&conn, &args.file_id, &args.display_name, &args.url)
}

#[command]
pub fn update_file_note(args: UpdateFileNoteArgs) -> Result<ManagedFileRecord, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;
    FileRepository::update_note(&conn, &args.file_id, &args.note)
}

#[command]
pub fn link_file_to_memo(args: LinkFileToMemoArgs) -> Result<(), String> {
    let mut conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    let file_record = FileRepository::find_record(&conn, &args.file_id)?
        .ok_or_else(|| "File record was not found.".to_string())?;

    FileRepository::append_file_link_to_memo(
        &mut conn,
        memo.id,
        &file_record.id,
        &file_record.display_name,
    )
}

#[command]
pub fn list_files_for_memo(args: MemoFilesArgs) -> Result<Vec<MemoLinkedFileItem>, String> {
    let conn = get_conn().map_err(|e| e.to_string())?;

    let workspace = WorkspaceRepository::find_by_slug(&conn, &args.workspace_slug_name)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", args.workspace_slug_name))?;

    let memo = MemoRepository::find_by_slug(&conn, workspace.id, &args.memo_slug_title)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Memo not found for slug: {}", args.memo_slug_title))?;

    FileRepository::list_files_for_memo(&conn, memo.id)
}
