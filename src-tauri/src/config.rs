use serde::{Deserialize, Serialize};
use std::path::{PathBuf,Path};
use std::{env, fs};
use std::io::Write;



#[derive(Serialize, Deserialize, Clone)]
pub struct Config {
    pub database_path: String,
    pub asset_dir_path: String,
}

impl Config {
    pub fn load() -> Result<Self, String> {
        let config_file = env::var("CONFIG_FILE").unwrap_or_else(|_| "config.dev.json".to_string());
        let config = Self::load_config(&config_file);

        config
    }

    fn load_config(file_path: &str) -> Result<Config, String> {
        let config_dir = PathBuf::from(file_path)
            .parent()
            .ok_or("Failed to determine config file directory")?
            .to_path_buf();

        let content = fs::read_to_string(file_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        let mut config: serde_json::Value =
            serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))?;

        // Replace placeholder
        if let Some(db_path) = config["database_path"].as_str() {
            let replaced_path = Self::replace_placeholders(db_path, &config_dir);
            config["database_path"] = serde_json::Value::String(replaced_path);
        }

        if let Some(db_path) = config["asset_dir_path"].as_str() {
            let replaced_path = Self::replace_placeholders(db_path, &config_dir);
            config["asset_dir_path"] = serde_json::Value::String(replaced_path);
        }

        serde_json::from_value(config).map_err(|e| format!("Failed to deserialize JSON: {}", e))
    }

    fn replace_placeholders(path: &str, config_dir: &PathBuf) -> String {
        if path.contains("${currentFilePathDir}") {
            let dir_str = config_dir
                .to_str()
                .expect("Failed to convert config directory to string");
            path.replace("${currentFilePathDir}", dir_str)
        } else {
            path.to_string()
        }
    }
}

#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub database_path: String,
    pub asset_dir_path: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        AppConfig {
            database_path: "./data.db".to_string(),
            asset_dir_path: "./_assets/".to_string(),
        }
    }
}

pub fn load_or_create_config(config_dir: &Path) -> Result<AppConfig, String> {
    let config_path = config_dir.join("config.json");
    ensure_config_directory_exists(&config_path)?;

    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config file: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))
    } else {
        let default_config = AppConfig::default();
        save_config(&default_config, &config_path)?;
        Ok(default_config)
    }
}

pub fn save_config(config: &AppConfig, config_path: &PathBuf) -> Result<(), String> {
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    let mut file = fs::File::create(config_path)
        .map_err(|e| format!("Failed to create config file: {}", e))?;
    file.write_all(json.as_bytes())
        .map_err(|e| format!("Failed to write config file: {}", e))?;

    Ok(())
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
