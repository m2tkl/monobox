use crate::config::AppConfig;
use base64::{self, engine::general_purpose, Engine};
use mime_guess::get_mime_extensions;
use std::fs;
use std::path::Path;
use tauri::{command, State};
use uuid::Uuid;

#[derive(serde::Deserialize)]
pub struct SaveHtmlExportArgs {
    pub path: String,
    pub html: String,
}

#[derive(serde::Deserialize)]
pub struct SaveTextExportArgs {
    pub path: String,
    pub content: String,
}

#[derive(serde::Deserialize)]
pub struct SaveMarkdownExportArgs {
    pub directory_path: String,
    pub content: String,
}

#[derive(serde::Deserialize)]
pub struct SaveMarkdownAssetArgs {
    pub directory_path: String,
    pub src: String,
}

#[command]
pub fn save_html_export(args: SaveHtmlExportArgs) -> Result<(), String> {
    let path = Path::new(&args.path);
    fs::write(path, args.html).map_err(|e| format!("Failed to save HTML export: {}", e))
}

#[command]
pub fn save_text_export(args: SaveTextExportArgs) -> Result<(), String> {
    let path = Path::new(&args.path);
    fs::write(path, args.content).map_err(|e| format!("Failed to save text export: {}", e))
}

#[command]
pub fn save_markdown_export(args: SaveMarkdownExportArgs) -> Result<(), String> {
    let directory_path = Path::new(&args.directory_path);
    fs::create_dir_all(directory_path)
        .map_err(|e| format!("Failed to create markdown export directory: {}", e))?;
    let markdown_file_name = markdown_file_name_for_directory(directory_path);
    let markdown_path = directory_path.join(markdown_file_name);

    fs::write(markdown_path, args.content)
        .map_err(|e| format!("Failed to save markdown export: {}", e))
}

#[command]
pub fn save_markdown_asset(
    args: SaveMarkdownAssetArgs,
    config: State<AppConfig>,
) -> Result<String, String> {
    let directory_path = Path::new(&args.directory_path);
    let asset_dir_name = "assets";
    let asset_dir = directory_path.join(asset_dir_name);
    fs::create_dir_all(&asset_dir)
        .map_err(|e| format!("Failed to create markdown asset directory: {}", e))?;

    if let Some(file_name) = resolve_monobox_asset_file_name(&args.src) {
        let source = Path::new(&config.asset_dir_path).join(file_name);
        let target_file_name = sanitize_path_part(file_name);
        let target = asset_dir.join(&target_file_name);
        fs::copy(&source, &target).map_err(|e| format!("Failed to copy markdown asset: {}", e))?;
        return Ok(format!("{}/{}", asset_dir_name, target_file_name));
    }

    if let Some((mime_type, data)) = parse_data_url(&args.src)? {
        let extension = mime_type
            .parse()
            .ok()
            .and_then(|mime| get_mime_extensions(&mime).and_then(|exts| exts.first().cloned()))
            .unwrap_or("bin");
        let target_file_name = format!("{}.{}", Uuid::new_v4(), extension);
        let target = asset_dir.join(&target_file_name);
        fs::write(&target, data).map_err(|e| format!("Failed to write markdown asset: {}", e))?;
        return Ok(format!("{}/{}", asset_dir_name, target_file_name));
    }

    Ok(args.src)
}

fn markdown_file_name_for_directory(directory_path: &Path) -> String {
    let stem = directory_path
        .file_name()
        .and_then(|value| value.to_str())
        .map(sanitize_path_part)
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "README".to_string());

    format!("{}.md", stem)
}

fn resolve_monobox_asset_file_name(src: &str) -> Option<&str> {
    src.strip_prefix("asset://localhost/monobox/")
        .or_else(|| src.strip_prefix("http://asset.localhost/monobox/"))
        .filter(|file_name| {
            !file_name.is_empty() && !file_name.contains('/') && !file_name.contains('\\')
        })
}

fn parse_data_url(src: &str) -> Result<Option<(&str, Vec<u8>)>, String> {
    let Some(rest) = src.strip_prefix("data:") else {
        return Ok(None);
    };
    let Some((metadata, data)) = rest.split_once(',') else {
        return Err("Invalid data URL".to_string());
    };
    let Some(mime_type) = metadata.strip_suffix(";base64") else {
        return Ok(None);
    };
    let decoded = general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Failed to decode markdown asset data URL: {}", e))?;

    Ok(Some((mime_type, decoded)))
}

fn sanitize_path_part(value: &str) -> String {
    let sanitized: String = value
        .chars()
        .map(|ch| match ch {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            ch if ch.is_whitespace() => '-',
            ch => ch,
        })
        .collect();
    let trimmed = sanitized.trim_matches('-');

    if trimmed.is_empty() {
        "asset".to_string()
    } else {
        trimmed.to_string()
    }
}
