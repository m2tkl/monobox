use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub database_path: String,
    pub asset_dir_path: String,
    #[serde(default = "default_setup_complete")]
    pub setup_complete: bool,
}

fn default_setup_complete() -> bool {
    true
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            database_path: "${app_data_dir}/data.db".to_string(),
            asset_dir_path: "${app_data_dir}/_assets/".to_string(),
            setup_complete: false,
        }
    }
}

// Load the configuration and replace `${app_data_dir}` with the actual data directory path.
pub fn load_config(config_dir: &Path, data_dir: &Path) -> Result<AppConfig, String> {
    let config_path = config_dir.join("config.json");

    ensure_config_directory_exists(&config_path)?;

    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;

        let mut config: AppConfig =
            serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))?;

        // Replace placeholders in the configuration
        config.database_path = replace_placeholders(&config.database_path, data_dir);
        config.asset_dir_path = replace_placeholders(&config.asset_dir_path, data_dir);

        Ok(config)
    } else {
        // If config does not exist, create a default one
        let mut default_config = AppConfig::default();
        default_config.database_path =
            replace_placeholders(&default_config.database_path, data_dir);
        default_config.asset_dir_path =
            replace_placeholders(&default_config.asset_dir_path, data_dir);

        save_config(&default_config, &config_path)?;
        Ok(default_config)
    }
}

// Replace placeholders like `${app_data_dir}` with the actual data_dir path.
fn replace_placeholders(path: &str, data_dir: &Path) -> String {
    if path.contains("${app_data_dir}") {
        let dir_str = data_dir
            .to_str()
            .expect("Failed to convert data directory to string");
        path.replace("${app_data_dir}", dir_str)
    } else {
        path.to_string()
    }
}

pub fn ensure_config_directory_exists(config_path: &Path) -> Result<(), String> {
    if let Some(parent_dir) = config_path.parent() {
        if !parent_dir.exists() {
            fs::create_dir_all(parent_dir)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }
    }
    Ok(())
}

pub fn save_config(config: &AppConfig, config_path: &PathBuf) -> Result<(), String> {
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    let parent_dir = config_path
        .parent()
        .ok_or_else(|| "Failed to resolve config directory".to_string())?;
    let file_name = config_path
        .file_name()
        .ok_or_else(|| "Failed to resolve config filename".to_string())?;
    let tmp_path = parent_dir.join(format!(
        ".{}.tmp",
        file_name.to_string_lossy()
    ));

    let mut file = fs::File::create(&tmp_path)
        .map_err(|e| format!("Failed to create temp config file: {}", e))?;
    file.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write config file: {}", e))?;
    file.sync_all()
        .map_err(|e| format!("Failed to flush config file: {}", e))?;

    #[cfg(windows)]
    if config_path.exists() {
        fs::remove_file(config_path)
            .map_err(|e| format!("Failed to remove old config file: {}", e))?;
    }

    fs::rename(&tmp_path, config_path)
        .map_err(|e| format!("Failed to replace config file: {}", e))?;

    Ok(())
}
