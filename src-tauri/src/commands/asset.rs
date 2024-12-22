use crate::config::Config;
use base64::{self, engine::general_purpose, Engine};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::{command, State};

#[derive(serde::Deserialize)]
pub struct SaveImageArgs {
    pub file_name: String,
    pub data: String, // Base64 encoded data
}

#[command]
pub fn save_image(args: SaveImageArgs, config: State<Config>) -> Result<String, String> {
    let save_dir = PathBuf::from(&config.asset_dir_path);
    if !save_dir.exists() {
        fs::create_dir_all(&save_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let file_path = save_dir.join(&args.file_name);

    let decoded_data = general_purpose::STANDARD
        .decode(&args.data)
        .map_err(|e| format!("Failed to decode file data: {}", e))?;
    let mut file = File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
    file.write_all(&decoded_data)
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok(format!("asset://localhost/monobox/{}", args.file_name))
}
