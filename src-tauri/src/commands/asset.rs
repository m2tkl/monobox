use crate::config::AppConfig;
use base64::{self, engine::general_purpose, Engine};
use mime_guess::{from_path, get_mime_extensions};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use tauri::{command, State};
use uuid::Uuid;

#[derive(serde::Deserialize)]
pub struct SaveImageArgs {
    pub data: String, // Base64 encoded data
    pub mime_type: String,
}

#[derive(serde::Deserialize)]
pub struct ReadImageArgs {
    pub src: String,
}

#[command]
pub fn save_image(args: SaveImageArgs, config: State<AppConfig>) -> Result<String, String> {
    // Generate UUID
    let uuid = Uuid::new_v4();

    // Get ext from mime type
    let mime_type = &args
        .mime_type
        .parse()
        .map_err(|_| "Invalid MIME type".to_string())?;
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

#[command]
pub fn read_image_as_data_url(
    args: ReadImageArgs,
    config: State<AppConfig>,
) -> Result<String, String> {
    let file_name = resolve_asset_file_name(&args.src)?;
    let file_path = PathBuf::from(&config.asset_dir_path).join(file_name);
    let content = fs::read(&file_path).map_err(|e| format!("Failed to read image: {}", e))?;
    let mime = from_path(&file_path).first_or_octet_stream();
    let data = general_purpose::STANDARD.encode(content);

    Ok(format!("data:{};base64,{}", mime.as_ref(), data))
}

fn resolve_asset_file_name(src: &str) -> Result<&str, String> {
    let file_name = src
        .strip_prefix("asset://localhost/monobox/")
        .or_else(|| src.strip_prefix("http://asset.localhost/monobox/"))
        .ok_or_else(|| "Unsupported asset URL".to_string())?;

    if file_name.is_empty() || file_name.contains('/') || file_name.contains('\\') {
        return Err("Invalid asset file name".to_string());
    }

    Ok(file_name)
}
