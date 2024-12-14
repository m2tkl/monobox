use serde::{Deserialize, Serialize};
use std::{env, fs};
use std::path::PathBuf;

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub database_path: String,
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

        let content = fs::read_to_string(file_path).map_err(|e| format!("Failed to read config file: {}", e))?;
        let mut config: serde_json::Value = serde_json::from_str(&content).map_err(|e| format!("Failed to parse JSON: {}", e))?;

        // Replace placeholder in `database_path`
        if let Some(db_path) = config["database_path"].as_str() {
            let replaced_path = Self::replace_placeholders(db_path, &config_dir);
            config["database_path"] = serde_json::Value::String(replaced_path);
        }

        serde_json::from_value(config).map_err(|e| format!("Failed to deserialize JSON: {}", e))
    }

    fn replace_placeholders(path: &str, config_dir: &PathBuf) -> String {
        if path.contains("${currentFilePathDir}") {
            let dir_str = config_dir.to_str().expect("Failed to convert config directory to string");
            path.replace("${currentFilePathDir}", dir_str)
        } else {
            path.to_string()
        }
    }
}
