use std::fs;
use std::fs::OpenOptions;
use std::path::PathBuf;

use directories::ProjectDirs;
use tauri::command;

use crate::config::{load_config, save_config, AppConfig};

#[derive(serde::Serialize)]
pub struct ConfigPayload {
    pub database_path: String,
    pub asset_dir_path: String,
    pub setup_complete: bool,
}

#[derive(serde::Deserialize)]
pub struct SaveConfigArgs {
    pub database_path: String,
    pub asset_dir_path: String,
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

#[command]
pub fn get_app_config() -> Result<ConfigPayload, String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;

    Ok(ConfigPayload {
        database_path: config.database_path,
        asset_dir_path: config.asset_dir_path,
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
pub fn save_app_config(args: SaveConfigArgs) -> Result<ConfigPayload, String> {
    let db_path = PathBuf::from(&args.database_path);
    if db_path.is_dir() {
        return Err("DB_PATH_IS_DIR:Database path points to a directory".to_string());
    }

    let db_parent = db_path
        .parent()
        .ok_or_else(|| "DB_PARENT_MISSING:Database path has no parent".to_string())?;
    if !db_parent.exists() {
        if args.create_missing {
            fs::create_dir_all(db_parent)
                .map_err(|e| format!("DB_PARENT_CREATE_FAILED:Failed to create db directory: {}", e))?;
        }
        else {
            return Err("DB_PARENT_MISSING:Database directory does not exist".to_string());
        }
    }

    if !db_path.exists() {
        if args.create_missing {
            OpenOptions::new()
                .write(true)
                .create(true)
                .open(&db_path)
                .map_err(|e| format!("DB_FILE_CREATE_FAILED:Failed to create db file: {}", e))?;
        }
        else {
            return Err("DB_FILE_MISSING:Database file does not exist".to_string());
        }
    }

    let asset_path = PathBuf::from(&args.asset_dir_path);
    if asset_path.exists() && !asset_path.is_dir() {
        return Err("ASSET_PATH_NOT_DIR:Asset path is not a directory".to_string());
    }

    if !asset_path.exists() {
        if args.create_missing {
            fs::create_dir_all(&asset_path)
                .map_err(|e| format!("ASSET_DIR_CREATE_FAILED:Failed to create asset directory: {}", e))?;
        }
        else {
            return Err("ASSET_DIR_MISSING:Asset directory does not exist".to_string());
        }
    }

    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config_path = proj_dirs.config_dir().join("config.json");

    let config = AppConfig {
        database_path: args.database_path.clone(),
        asset_dir_path: args.asset_dir_path.clone(),
        setup_complete: args.setup_complete,
    };

    save_config(&config, &config_path)?;

    Ok(ConfigPayload {
        database_path: args.database_path,
        asset_dir_path: args.asset_dir_path,
        setup_complete: args.setup_complete,
    })
}

fn validate_storage_paths(database_path: &str, asset_dir_path: &str) -> Result<(), String> {
    let db_path = PathBuf::from(database_path);
    if db_path.is_dir() {
        return Err("DB_PATH_IS_DIR:Database path points to a directory".to_string());
    }
    if !db_path.exists() {
        return Err("DB_FILE_MISSING:Database file does not exist".to_string());
    }

    let asset_path = PathBuf::from(asset_dir_path);
    if asset_path.exists() && !asset_path.is_dir() {
        return Err("ASSET_PATH_NOT_DIR:Asset path is not a directory".to_string());
    }
    if !asset_path.exists() {
        return Err("ASSET_DIR_MISSING:Asset directory does not exist".to_string());
    }

    Ok(())
}

#[command]
pub fn validate_app_config() -> Result<(), String> {
    let proj_dirs = ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    let config = load_config(proj_dirs.config_dir(), proj_dirs.data_dir())?;
    validate_storage_paths(&config.database_path, &config.asset_dir_path)
}
