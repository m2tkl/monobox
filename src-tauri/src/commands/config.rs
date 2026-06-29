use std::fs;
use std::fs::OpenOptions;
use std::path::PathBuf;

use directories::ProjectDirs;
use tauri::{command, AppHandle, State};
use uuid::Uuid;

use crate::config::{default_selection_copy_format, load_config, save_config};
use crate::global_shortcuts::{
    normalize_shortcut, update_global_shortcuts, GlobalShortcutSettings,
};
use crate::mcp::McpServerInfo;

#[derive(serde::Serialize)]
pub struct ConfigPayload {
    pub database_path: String,
    pub asset_dir_path: String,
    pub files_storage_root: String,
    pub inbox_ignore_file_names: Vec<String>,
    pub setup_complete: bool,
    pub theme_preference: Option<String>,
    pub app_window_opacity: f64,
    pub focus_app_shortcut: String,
    pub new_memo_shortcut: String,
    pub selection_copy_format: String,
    pub mcp_server_url: String,
}

#[derive(serde::Deserialize)]
pub struct SaveConfigArgs {
    pub database_path: String,
    pub asset_dir_path: String,
    pub files_storage_root: String,
    pub setup_complete: bool,
    pub create_missing: bool,
}

#[derive(serde::Serialize)]
pub struct StorageCandidates {
    pub database_paths: Vec<String>,
    pub asset_dir_paths: Vec<String>,
}

#[derive(serde::Serialize)]
pub struct DefaultStoragePaths {
    pub database_path: String,
    pub asset_dir_path: String,
}

#[derive(serde::Deserialize)]
pub struct ThemePreferenceArgs {
    pub mode: String,
}

#[derive(serde::Deserialize)]
pub struct WindowOpacityArgs {
    pub opacity: f64,
}

#[derive(serde::Deserialize)]
pub struct InboxIgnoreFileNamesArgs {
    pub file_names: Vec<String>,
}

#[derive(serde::Deserialize)]
pub struct GlobalShortcutArgs {
    pub focus_app_shortcut: String,
    pub new_memo_shortcut: String,
}

#[derive(serde::Deserialize)]
pub struct SelectionCopyFormatArgs {
    pub format: String,
}

#[command]
pub fn get_app_config(mcp_server_info: State<McpServerInfo>) -> Result<ConfigPayload, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}

fn build_config_payload(config: crate::config::AppConfig, mcp_server_url: &str) -> ConfigPayload {
    ConfigPayload {
        database_path: config.database_path,
        asset_dir_path: config.asset_dir_path,
        files_storage_root: config.files_storage_root,
        inbox_ignore_file_names: config.inbox_ignore_file_names,
        setup_complete: config.setup_complete,
        theme_preference: config.theme_preference,
        app_window_opacity: config.app_window_opacity,
        focus_app_shortcut: config.focus_app_shortcut,
        new_memo_shortcut: config.new_memo_shortcut,
        selection_copy_format: normalize_selection_copy_format(&config.selection_copy_format),
        mcp_server_url: mcp_server_url.to_string(),
    }
}

fn normalize_inbox_ignore_file_names(file_names: &[String]) -> Vec<String> {
    let mut names: Vec<String> = file_names
        .iter()
        .map(|name| name.trim())
        .filter(|name| !name.is_empty())
        .map(ToString::to_string)
        .collect();
    names.sort_by_key(|name| name.to_lowercase());
    names.dedup_by(|a, b| a.eq_ignore_ascii_case(b));
    names
}

fn normalize_selection_copy_format(format: &str) -> String {
    match format {
        "markdown" => "markdown".to_string(),
        "html" => "html".to_string(),
        _ => default_selection_copy_format(),
    }
}

#[command]
pub fn get_mcp_server_info(mcp_server_info: State<McpServerInfo>) -> Result<McpServerInfo, String> {
    Ok(mcp_server_info.inner().clone())
}

#[command]
pub fn regenerate_mcp_server_token() -> Result<McpServerInfo, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");
    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    config.mcp_token = Uuid::new_v4().to_string();
    save_config(&config, &config_path)?;
    Ok(McpServerInfo {
        enabled: false,
        bind_host: config.mcp_bind_host.clone(),
        url_host: config.mcp_url_host.clone(),
        port: config.mcp_port,
        token: config.mcp_token.clone(),
        url: crate::mcp::build_server_url(&config.mcp_url_host, config.mcp_port, &config.mcp_token),
        setup_complete: config.setup_complete,
    })
}

#[command]
pub fn detect_storage_candidates() -> Result<StorageCandidates, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;

    let mut database_paths: Vec<String> = Vec::new();
    let mut asset_dir_paths: Vec<String> = Vec::new();

    let candidate_dirs = vec![proj_dirs.data_dir(), proj_dirs.config_dir()];
    for dir in candidate_dirs {
        let db_path = dir.join("data.db");
        if db_path.exists() {
            database_paths.push(db_path.to_string_lossy().to_string());
        }

        let asset_path = dir.join("_assets");
        if asset_path.exists() {
            asset_dir_paths.push(asset_path.to_string_lossy().to_string());
        }
    }

    database_paths.sort();
    database_paths.dedup();
    asset_dir_paths.sort();
    asset_dir_paths.dedup();

    Ok(StorageCandidates {
        database_paths,
        asset_dir_paths,
    })
}

#[command]
pub fn get_default_storage_paths() -> Result<DefaultStoragePaths, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let data_dir = proj_dirs.data_dir();

    Ok(DefaultStoragePaths {
        database_path: data_dir.join("data.db").to_string_lossy().to_string(),
        asset_dir_path: data_dir.join("_assets").to_string_lossy().to_string(),
    })
}

#[command]
pub fn save_app_config(
    args: SaveConfigArgs,
    mcp_server_info: State<McpServerInfo>,
) -> Result<ConfigPayload, String> {
    validate_storage_paths(
        &args.database_path,
        &args.asset_dir_path,
        &args.files_storage_root,
        args.create_missing,
    )?;

    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    config.database_path = args.database_path.clone();
    config.asset_dir_path = args.asset_dir_path.clone();
    config.files_storage_root = args.files_storage_root.clone();
    config.setup_complete = args.setup_complete;

    save_config(&config, &config_path)?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}

fn validate_storage_paths(
    database_path: &str,
    asset_dir_path: &str,
    files_storage_root: &str,
    create_missing: bool,
) -> Result<(), String> {
    let db_path = PathBuf::from(database_path);
    if db_path.is_dir() {
        return Err("DB_PATH_IS_DIR:Database path points to a directory".to_string());
    }

    let db_parent = db_path
        .parent()
        .ok_or_else(|| "DB_PARENT_MISSING:Database path has no parent".to_string())?;
    if !db_parent.exists() {
        if create_missing {
            fs::create_dir_all(db_parent).map_err(|e| {
                format!(
                    "DB_PARENT_CREATE_FAILED:Failed to create db directory: {}",
                    e
                )
            })?;
        } else {
            return Err("DB_PARENT_MISSING:Database directory does not exist".to_string());
        }
    }

    if !db_path.exists() {
        if create_missing {
            OpenOptions::new()
                .write(true)
                .create(true)
                .open(&db_path)
                .map_err(|e| format!("DB_FILE_CREATE_FAILED:Failed to create db file: {}", e))?;
        } else {
            return Err("DB_FILE_MISSING:Database file does not exist".to_string());
        }
    }

    let asset_path = PathBuf::from(asset_dir_path);
    if asset_path.exists() && !asset_path.is_dir() {
        return Err("ASSET_PATH_NOT_DIR:Asset path is not a directory".to_string());
    }
    if !asset_path.exists() {
        if create_missing {
            fs::create_dir_all(&asset_path).map_err(|e| {
                format!(
                    "ASSET_DIR_CREATE_FAILED:Failed to create asset directory: {}",
                    e
                )
            })?;
        } else {
            return Err("ASSET_DIR_MISSING:Asset directory does not exist".to_string());
        }
    }

    if !files_storage_root.trim().is_empty() {
        let files_path = PathBuf::from(files_storage_root);
        if files_path.exists() && !files_path.is_dir() {
            return Err("FILES_STORAGE_NOT_DIR:Files storage path is not a directory".to_string());
        }
        if !files_path.exists() {
            if create_missing {
                fs::create_dir_all(&files_path).map_err(|e| {
                    format!(
                        "FILES_STORAGE_CREATE_FAILED:Failed to create files storage directory: {}",
                        e
                    )
                })?;
            } else {
                return Err(
                    "FILES_STORAGE_MISSING:Files storage directory does not exist".to_string(),
                );
            }
        }
    }

    Ok(())
}

#[command]
pub fn validate_app_config() -> Result<(), String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    validate_storage_paths(
        &config.database_path,
        &config.asset_dir_path,
        &config.files_storage_root,
        false,
    )
}

#[command]
pub fn set_theme_preference(
    args: ThemePreferenceArgs,
    mcp_server_info: State<McpServerInfo>,
) -> Result<ConfigPayload, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    config.theme_preference = Some(args.mode);

    save_config(&config, &config_path)?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}

#[command]
pub fn set_app_window_opacity(
    args: WindowOpacityArgs,
    mcp_server_info: State<McpServerInfo>,
) -> Result<ConfigPayload, String> {
    if !args.opacity.is_finite() {
        return Err("INVALID_OPACITY:Opacity must be a finite number".to_string());
    }

    let opacity = args.opacity.clamp(0.2, 1.0);
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    config.app_window_opacity = opacity;

    save_config(&config, &config_path)?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}

#[command]
pub fn set_selection_copy_format(
    args: SelectionCopyFormatArgs,
    mcp_server_info: State<McpServerInfo>,
) -> Result<ConfigPayload, String> {
    let format = normalize_selection_copy_format(&args.format);
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    config.selection_copy_format = format;
    save_config(&config, &config_path)?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}

#[command]
pub fn set_inbox_ignore_file_names(
    args: InboxIgnoreFileNamesArgs,
    mcp_server_info: State<McpServerInfo>,
) -> Result<ConfigPayload, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    config.inbox_ignore_file_names = normalize_inbox_ignore_file_names(&args.file_names);
    save_config(&config, &config_path)?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}

#[command]
pub fn set_global_shortcuts(
    app: AppHandle,
    args: GlobalShortcutArgs,
    mcp_server_info: State<McpServerInfo>,
) -> Result<ConfigPayload, String> {
    let focus_app_shortcut = normalize_shortcut(&args.focus_app_shortcut)?;
    let new_memo_shortcut = normalize_shortcut(&args.new_memo_shortcut)?;

    if focus_app_shortcut == new_memo_shortcut {
        return Err("DUPLICATE_SHORTCUT:Shortcuts must be different".to_string());
    }

    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let mut config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    update_global_shortcuts(
        &app,
        &GlobalShortcutSettings {
            focus_app_shortcut: config.focus_app_shortcut.clone(),
            new_memo_shortcut: config.new_memo_shortcut.clone(),
        },
        GlobalShortcutSettings {
            focus_app_shortcut: focus_app_shortcut.clone(),
            new_memo_shortcut: new_memo_shortcut.clone(),
        },
    )?;

    config.focus_app_shortcut = focus_app_shortcut;
    config.new_memo_shortcut = new_memo_shortcut;
    save_config(&config, &config_path)?;

    Ok(build_config_payload(config, &mcp_server_info.url))
}
