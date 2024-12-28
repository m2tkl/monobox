use crate::config::AppConfig;
use base64::{self, engine::general_purpose, Engine};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::{command, State};
use uuid::Uuid;
use mime_guess::get_mime_extensions;

#[derive(serde::Deserialize)]
pub struct SaveImageArgs {
    pub data: String, // Base64 encoded data
    pub mime_type: String,
}

#[command]
pub fn save_image(args: SaveImageArgs, config: State<AppConfig>) -> Result<String, String> {
    // Generate UUID
    let uuid = Uuid::new_v4();

    // Get ext from mime type
    let mime_type = &args.mime_type.parse().map_err(|_| "Invalid MIME type".to_string())?;
    let extension = get_mime_extensions(&mime_type)
        .and_then(|exts| exts.first().cloned())
        .unwrap_or("bin"); // default "bin"
    let file_name = format!("{}.{}", uuid, extension);

    let save_dir = PathBuf::from(&config.asset_dir_path);
    if !save_dir.exists() {
        fs::create_dir_all(&save_dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let file_path = save_dir.join(&file_name);

    let decoded_data = general_purpose::STANDARD
        .decode(&args.data)
        .map_err(|e| format!("Failed to decode file data: {}", e))?;
    let mut file = File::create(&file_path).map_err(|e| format!("Failed to create file: {}", e))?;
    file.write_all(&decoded_data)
        .map_err(|e| format!("Failed to write to file: {}", e))?;

    Ok(format!("asset://localhost/monobox/{}", file_name))
}
