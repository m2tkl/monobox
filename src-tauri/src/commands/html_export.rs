use std::fs;
use std::path::Path;
use tauri::command;

#[derive(serde::Deserialize)]
pub struct SaveHtmlExportArgs {
    pub path: String,
    pub html: String,
}

#[command]
pub fn save_html_export(args: SaveHtmlExportArgs) -> Result<(), String> {
    let path = Path::new(&args.path);
    fs::write(path, args.html).map_err(|e| format!("Failed to save HTML export: {}", e))
}
