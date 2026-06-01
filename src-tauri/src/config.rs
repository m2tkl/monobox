use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub database_path: String,
    pub asset_dir_path: String,
    #[serde(default)]
    pub files_storage_root: String,
    #[serde(default = "default_setup_complete")]
    pub setup_complete: bool,
    #[serde(default)]
    pub theme_preference: Option<String>,
    #[serde(default = "default_app_window_opacity")]
    pub app_window_opacity: f64,
    #[serde(default = "default_focus_app_shortcut")]
    pub focus_app_shortcut: String,
    #[serde(default = "default_new_memo_shortcut")]
    pub new_memo_shortcut: String,
    #[serde(default = "default_mcp_port")]
    pub mcp_port: u16,
    #[serde(default = "default_mcp_host")]
    pub mcp_bind_host: String,
    #[serde(default = "default_mcp_host")]
    pub mcp_url_host: String,
    #[serde(default = "default_mcp_token")]
    pub mcp_token: String,
}

fn default_setup_complete() -> bool {
    true
}

fn default_mcp_port() -> u16 {
    38453
}

fn default_mcp_host() -> String {
    "127.0.0.1".to_string()
}

fn default_app_window_opacity() -> f64 {
    1.0
}

pub fn default_focus_app_shortcut() -> String {
    "CommandOrControl+Shift+M".to_string()
}

pub fn default_new_memo_shortcut() -> String {
    "CommandOrControl+Shift+N".to_string()
}

fn default_mcp_token() -> String {
    String::new()
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            database_path: "${app_data_dir}/data.db".to_string(),
            asset_dir_path: "${app_data_dir}/_assets/".to_string(),
            files_storage_root: String::new(),
            setup_complete: false,
            theme_preference: None,
            app_window_opacity: default_app_window_opacity(),
            focus_app_shortcut: default_focus_app_shortcut(),
            new_memo_shortcut: default_new_memo_shortcut(),
            mcp_port: default_mcp_port(),
            mcp_bind_host: default_mcp_host(),
            mcp_url_host: default_mcp_host(),
            mcp_token: default_mcp_token(),
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
        config.files_storage_root = replace_placeholders(&config.files_storage_root, data_dir);

        Ok(config)
    } else {
        // If config does not exist, create a default one
        let mut default_config = AppConfig::default();
        default_config.database_path =
            replace_placeholders(&default_config.database_path, data_dir);
        default_config.asset_dir_path =
            replace_placeholders(&default_config.asset_dir_path, data_dir);
        default_config.files_storage_root =
            replace_placeholders(&default_config.files_storage_root, data_dir);

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
    let tmp_path = parent_dir.join(format!(".{}.tmp", file_name.to_string_lossy()));

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
