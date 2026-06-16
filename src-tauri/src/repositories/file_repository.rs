use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

use rusqlite::{params, Connection, OptionalExtension};
use serde_json::{json, Value};
use uuid::Uuid;

use crate::models::file::{
    InboxFileItem, InboxFilePage, ManagedFileDetail, ManagedFileListItem, ManagedFileListPage,
    ManagedFileRecord, MemoLinkedFileItem, RelatedMemoSummary, ResolvedFileOpenTarget,
};

pub struct FileRepository;

impl FileRepository {
    pub fn list_inbox_files(
        downloads_dir: &Path,
        limit: i64,
        offset: i64,
        ignored_file_names: &[String],
    ) -> Result<InboxFilePage, String> {
        if !downloads_dir.exists() {
            return Ok(InboxFilePage {
                items: Vec::new(),
                total_count: 0,
                limit: limit.max(1),
                offset: offset.max(0),
            });
        }

        let mut items = Vec::new();

        for entry in fs::read_dir(downloads_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if !path.is_file() && !path.is_dir() {
                continue;
            }
            if should_ignore_inbox_file(&path, ignored_file_names) {
                continue;
            }

            let metadata = entry.metadata().map_err(|e| e.to_string())?;
            let acquired_at = metadata
                .created()
                .or_else(|_| metadata.modified())
                .ok()
                .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
                .map(|duration| duration.as_millis() as i64)
                .unwrap_or(0);

            let display_name = path
                .file_name()
                .map(|name| name.to_string_lossy().to_string())
                .unwrap_or_else(|| path.to_string_lossy().to_string());
            let entry_type = if path.is_dir() { "directory" } else { "file" }.to_string();
            let kind = if path.is_dir() {
                "folder".to_string()
            } else {
                path.extension()
                    .and_then(|ext| ext.to_str())
                    .map(|ext| ext.to_lowercase())
                    .filter(|ext| !ext.is_empty())
                    .unwrap_or_else(|| "file".to_string())
            };

            items.push(InboxFileItem {
                path: path.to_string_lossy().to_string(),
                display_name,
                kind,
                entry_type,
                acquired_at,
            });
        }

        items.sort_by(|a, b| {
            b.acquired_at
                .cmp(&a.acquired_at)
                .then_with(|| a.display_name.cmp(&b.display_name))
        });
        let limit = limit.max(1) as usize;
        let offset = offset.max(0) as usize;
        let total_count = items.len() as i64;
        let paged_items = items.into_iter().skip(offset).take(limit).collect();

        Ok(InboxFilePage {
            items: paged_items,
            total_count,
            limit: limit as i64,
            offset: offset as i64,
        })
    }

    pub fn import_local_file(
        conn: &mut Connection,
        source_path: &Path,
        storage_root: &Path,
    ) -> Result<ManagedFileRecord, String> {
        if !source_path.exists() {
            return Err("Source file does not exist.".to_string());
        }
        if !source_path.is_file() {
            return Err("Source path is not a file.".to_string());
        }
        if !storage_root.exists() {
            return Err("Files storage folder does not exist.".to_string());
        }
        if !storage_root.is_dir() {
            return Err("Files storage folder is not a directory.".to_string());
        }

        let display_name = source_path
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .ok_or_else(|| "Failed to resolve source file name.".to_string())?;
        let file_id = generate_file_id();
        let physical_name = build_physical_file_name(&display_name, &file_id);
        let destination_path = storage_root.join(&physical_name);
        let relative_path = destination_path
            .strip_prefix(storage_root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();

        fs::rename(source_path, &destination_path)
            .map_err(|e| format!("Failed to move file into storage: {}", e))?;

        let tx = conn.transaction().map_err(|e| e.to_string())?;
        let insert_result = tx.execute(
            "INSERT INTO files (id, type, display_name, note, relative_path, url, imported_at)
             VALUES (?, 'local_file', ?, NULL, ?, NULL, CURRENT_TIMESTAMP)",
            params![&file_id, &display_name, &relative_path],
        );

        if let Err(err) = insert_result {
            let _ = fs::rename(&destination_path, source_path);
            return Err(err.to_string());
        }

        let record = tx
            .query_row(
                "SELECT id, type, display_name, note, relative_path, url, imported_at
                 FROM files
                 WHERE id = ?",
                [&file_id],
                |row| {
                    Ok(ManagedFileRecord {
                        id: row.get(0)?,
                        file_type: row.get(1)?,
                        display_name: row.get(2)?,
                        note: row.get(3)?,
                        relative_path: row.get(4)?,
                        url: row.get(5)?,
                        imported_at: row.get(6)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(record)
    }

    pub fn import_local_entry(
        conn: &mut Connection,
        source_path: &Path,
        storage_root: &Path,
    ) -> Result<ManagedFileRecord, String> {
        if source_path.is_file() {
            return Self::import_local_file(conn, source_path, storage_root);
        }
        if !source_path.exists() {
            return Err("Source path does not exist.".to_string());
        }
        if !source_path.is_dir() {
            return Err("Source path is not a file or directory.".to_string());
        }
        if !storage_root.exists() {
            return Err("Files storage folder does not exist.".to_string());
        }
        if !storage_root.is_dir() {
            return Err("Files storage folder is not a directory.".to_string());
        }

        let source_display_name = source_path
            .file_name()
            .map(|name| name.to_string_lossy().to_string())
            .ok_or_else(|| "Failed to resolve source folder name.".to_string())?;
        let file_id = generate_file_id();
        let physical_name = build_physical_file_name(&source_display_name, &file_id);
        let destination_path = storage_root.join(&physical_name);
        let relative_path = destination_path
            .strip_prefix(storage_root)
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();

        fs::rename(source_path, &destination_path)
            .map_err(|e| format!("Failed to move folder into storage: {}", e))?;

        let tx = conn.transaction().map_err(|e| e.to_string())?;
        let insert_result = tx.execute(
            "INSERT INTO files (id, type, display_name, note, relative_path, url, imported_at)
             VALUES (?, 'local_directory', ?, NULL, ?, NULL, CURRENT_TIMESTAMP)",
            params![&file_id, &source_display_name, &relative_path],
        );

        if let Err(err) = insert_result {
            let _ = fs::rename(&destination_path, source_path);
            return Err(err.to_string());
        }

        let record = tx
            .query_row(
                "SELECT id, type, display_name, note, relative_path, url, imported_at
                 FROM files
                 WHERE id = ?",
                [&file_id],
                |row| {
                    Ok(ManagedFileRecord {
                        id: row.get(0)?,
                        file_type: row.get(1)?,
                        display_name: row.get(2)?,
                        note: row.get(3)?,
                        relative_path: row.get(4)?,
                        url: row.get(5)?,
                        imported_at: row.get(6)?,
                    })
                },
            )
            .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())?;
        Ok(record)
    }

    pub fn create_external_link(
        conn: &Connection,
        display_name: &str,
        url: &str,
    ) -> Result<ManagedFileRecord, String> {
        let file_id = generate_file_id();
        conn.execute(
            "INSERT INTO files (id, type, display_name, note, relative_path, url, imported_at)
             VALUES (?, 'external_link', ?, NULL, NULL, ?, CURRENT_TIMESTAMP)",
            params![&file_id, display_name, url],
        )
        .map_err(|e| e.to_string())?;

        conn.query_row(
            "SELECT id, type, display_name, note, relative_path, url, imported_at
             FROM files
             WHERE id = ?",
            [&file_id],
            |row| {
                Ok(ManagedFileRecord {
                    id: row.get(0)?,
                    file_type: row.get(1)?,
                    display_name: row.get(2)?,
                    note: row.get(3)?,
                    relative_path: row.get(4)?,
                    url: row.get(5)?,
                    imported_at: row.get(6)?,
                })
            },
        )
        .map_err(|e| e.to_string())
    }

    pub fn list_files(
        conn: &Connection,
        limit: i64,
        offset: i64,
        unlinked_only: bool,
    ) -> Result<ManagedFileListPage, String> {
        let limit = limit.max(1);
        let offset = offset.max(0);
        let total_count_sql = if unlinked_only {
            "SELECT COUNT(*) FROM files
             WHERE NOT EXISTS (
               SELECT 1 FROM memo_files WHERE memo_files.file_id = files.id
             )"
        } else {
            "SELECT COUNT(*) FROM files"
        };
        let total_count: i64 = conn
            .query_row(total_count_sql, [], |row| row.get(0))
            .map_err(|e| e.to_string())?;

        let list_sql = if unlinked_only {
            "SELECT
                    files.id,
                    files.type,
                    files.display_name,
                    files.imported_at,
                    COUNT(memo_files.memo_id) AS related_memo_count
                 FROM files
                 LEFT JOIN memo_files ON memo_files.file_id = files.id
                 WHERE NOT EXISTS (
                   SELECT 1 FROM memo_files AS memo_files_filter WHERE memo_files_filter.file_id = files.id
                 )
                 GROUP BY files.id, files.type, files.display_name, files.imported_at
                 ORDER BY files.imported_at DESC, files.display_name ASC
                 LIMIT ? OFFSET ?"
        } else {
            "SELECT
                    files.id,
                    files.type,
                    files.display_name,
                    files.imported_at,
                    COUNT(memo_files.memo_id) AS related_memo_count
                 FROM files
                 LEFT JOIN memo_files ON memo_files.file_id = files.id
                 GROUP BY files.id, files.type, files.display_name, files.imported_at
                 ORDER BY files.imported_at DESC, files.display_name ASC
                 LIMIT ? OFFSET ?"
        };

        let mut stmt = conn.prepare(list_sql).map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map(params![limit, offset], |row| {
                Ok(ManagedFileListItem {
                    id: row.get(0)?,
                    file_type: row.get(1)?,
                    display_name: row.get(2)?,
                    imported_at: row.get(3)?,
                    related_memo_count: row.get(4)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let items = rows
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(ManagedFileListPage {
            items,
            total_count,
            limit,
            offset,
        })
    }

    pub fn find_record(
        conn: &Connection,
        file_id: &str,
    ) -> Result<Option<ManagedFileRecord>, String> {
        conn.query_row(
            "SELECT id, type, display_name, note, relative_path, url, imported_at
             FROM files
             WHERE id = ?",
            [file_id],
            |row| {
                Ok(ManagedFileRecord {
                    id: row.get(0)?,
                    file_type: row.get(1)?,
                    display_name: row.get(2)?,
                    note: row.get(3)?,
                    relative_path: row.get(4)?,
                    url: row.get(5)?,
                    imported_at: row.get(6)?,
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())
    }

    pub fn list_files_for_memo(
        conn: &Connection,
        memo_id: i32,
    ) -> Result<Vec<MemoLinkedFileItem>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT files.id, files.type, files.display_name
                 FROM memo_files
                 JOIN files ON files.id = memo_files.file_id
                 WHERE memo_files.memo_id = ?
                 ORDER BY files.imported_at DESC, files.display_name ASC",
            )
            .map_err(|e| e.to_string())?;

        let rows = stmt
            .query_map([memo_id], |row| {
                Ok(MemoLinkedFileItem {
                    id: row.get(0)?,
                    file_type: row.get(1)?,
                    display_name: row.get(2)?,
                })
            })
            .map_err(|e| e.to_string())?;

        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    pub fn update_display_name(
        conn: &Connection,
        file_id: &str,
        display_name: &str,
    ) -> Result<ManagedFileRecord, String> {
        let normalized_display_name = display_name.trim();
        if normalized_display_name.is_empty() {
            return Err("Display name is required.".to_string());
        }

        let updated = conn
            .execute(
                "UPDATE files
                 SET display_name = ?
                 WHERE id = ?",
                params![normalized_display_name, file_id],
            )
            .map_err(|e| e.to_string())?;

        if updated == 0 {
            return Err("File record was not found.".to_string());
        }

        Self::find_record(conn, file_id)?.ok_or_else(|| "File record was not found.".to_string())
    }

    pub fn update_external_link(
        conn: &Connection,
        file_id: &str,
        display_name: &str,
        url: &str,
    ) -> Result<ManagedFileRecord, String> {
        let normalized_display_name = display_name.trim();
        if normalized_display_name.is_empty() {
            return Err("Display name is required.".to_string());
        }

        let normalized_url = url.trim();
        if normalized_url.is_empty() {
            return Err("URL is required.".to_string());
        }

        let updated = conn
            .execute(
                "UPDATE files
                 SET display_name = ?, url = ?
                 WHERE id = ? AND type = 'external_link'",
                params![normalized_display_name, normalized_url, file_id],
            )
            .map_err(|e| e.to_string())?;

        if updated == 0 {
            return Err("External link record was not found.".to_string());
        }

        Self::find_record(conn, file_id)?.ok_or_else(|| "File record was not found.".to_string())
    }

    pub fn update_note(
        conn: &Connection,
        file_id: &str,
        note: &str,
    ) -> Result<ManagedFileRecord, String> {
        let normalized_note = note.trim();
        let stored_note = if normalized_note.is_empty() {
            None
        } else {
            Some(normalized_note)
        };

        let updated = conn
            .execute(
                "UPDATE files
                 SET note = ?
                 WHERE id = ?",
                params![stored_note, file_id],
            )
            .map_err(|e| e.to_string())?;

        if updated == 0 {
            return Err("File record was not found.".to_string());
        }

        Self::find_record(conn, file_id)?.ok_or_else(|| "File record was not found.".to_string())
    }

    pub fn get_file_detail(
        conn: &Connection,
        file_id: &str,
    ) -> Result<Option<ManagedFileDetail>, String> {
        let Some(record) = Self::find_record(conn, file_id)? else {
            return Ok(None);
        };

        let mut stmt = conn
            .prepare(
                "SELECT memo.id, workspace.slug_name, memo.slug_title, memo.title
                 FROM memo_files
                 JOIN memo ON memo.id = memo_files.memo_id
                 JOIN workspace ON workspace.id = memo.workspace_id
                 WHERE memo_files.file_id = ?
                 ORDER BY memo.modified_at DESC, memo.id DESC",
            )
            .map_err(|e| e.to_string())?;

        let related_memos = stmt
            .query_map([file_id], |row| {
                Ok(RelatedMemoSummary {
                    memo_id: row.get(0)?,
                    workspace_slug_name: row.get(1)?,
                    memo_slug_title: row.get(2)?,
                    title: row.get(3)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(Some(ManagedFileDetail {
            id: record.id,
            file_type: record.file_type,
            display_name: record.display_name,
            note: record.note,
            relative_path: record.relative_path,
            url: record.url,
            imported_at: record.imported_at,
            related_memos,
        }))
    }

    pub fn resolve_open_target(
        conn: &Connection,
        storage_root: &Path,
        file_id: &str,
    ) -> Result<ResolvedFileOpenTarget, String> {
        let record = Self::find_record(conn, file_id)?
            .ok_or_else(|| "File record was not found.".to_string())?;

        match record.file_type.as_str() {
            "external_link" => {
                let url = record
                    .url
                    .ok_or_else(|| "External link URL is missing.".to_string())?;
                Ok(ResolvedFileOpenTarget {
                    open_kind: "url".to_string(),
                    value: url,
                })
            }
            "local_file" | "local_directory" => {
                let relative_path = record
                    .relative_path
                    .clone()
                    .ok_or_else(|| "Local file path is missing.".to_string())?;
                let direct_path = storage_root.join(&relative_path);
                if direct_path.exists() {
                    return Ok(ResolvedFileOpenTarget {
                        open_kind: "path".to_string(),
                        value: direct_path.to_string_lossy().to_string(),
                    });
                }

                let matches = find_files_by_file_id(storage_root, file_id)?;
                if matches.is_empty() {
                    return Err("The file could not be found in storage.".to_string());
                }
                if matches.len() > 1 {
                    return Err("Multiple matching files were found in storage.".to_string());
                }

                let resolved_path = matches[0].clone();
                let updated_relative_path = resolved_path
                    .strip_prefix(storage_root)
                    .map_err(|e| e.to_string())?
                    .to_string_lossy()
                    .to_string();
                conn.execute(
                    "UPDATE files SET relative_path = ? WHERE id = ?",
                    params![&updated_relative_path, file_id],
                )
                .map_err(|e| e.to_string())?;

                Ok(ResolvedFileOpenTarget {
                    open_kind: "path".to_string(),
                    value: resolved_path.to_string_lossy().to_string(),
                })
            }
            _ => Err("Unsupported file type.".to_string()),
        }
    }

    pub fn delete_file_record(conn: &Connection, file_id: &str) -> Result<(), String> {
        let related_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM memo_files WHERE file_id = ?",
                [file_id],
                |row| row.get(0),
            )
            .map_err(|e| e.to_string())?;
        if related_count > 0 {
            return Err("Cannot delete a file record that is still linked from memos.".to_string());
        }

        let deleted = conn
            .execute("DELETE FROM files WHERE id = ?", [file_id])
            .map_err(|e| e.to_string())?;
        if deleted == 0 {
            return Err("File record was not found.".to_string());
        }
        Ok(())
    }

    pub fn append_file_link_to_memo(
        conn: &mut Connection,
        memo_id: i32,
        file_id: &str,
        display_name: &str,
    ) -> Result<(), String> {
        let tx = conn.transaction().map_err(|e| e.to_string())?;
        let current_content: String = tx
            .query_row("SELECT content FROM memo WHERE id = ?", [memo_id], |row| {
                row.get(0)
            })
            .map_err(|e| e.to_string())?;

        let updated_content = append_file_link_block(&current_content, file_id, display_name)?;
        let body_text = extract_plain_text_from_value_str(&updated_content);

        tx.execute(
            "UPDATE memo
             SET content = ?, body_text = ?, modified_at = CURRENT_TIMESTAMP
             WHERE id = ?",
            params![&updated_content, &body_text, memo_id],
        )
        .map_err(|e| e.to_string())?;

        tx.execute("DELETE FROM memo_fts WHERE memo_id = ?", [memo_id])
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO memo_fts (title, description, body_text, memo_id, workspace_id, slug_title)
             SELECT title, description, body_text, id, workspace_id, slug_title
             FROM memo
             WHERE id = ?",
            [memo_id],
        )
        .map_err(|e| e.to_string())?;

        sync_memo_files_in_tx(&tx, memo_id, &updated_content)?;
        tx.commit().map_err(|e| e.to_string())
    }

    pub fn sync_memo_files(conn: &Connection, memo_id: i32, content: &str) -> Result<(), String> {
        sync_memo_files_in_tx(conn, memo_id, content)
    }
}

fn sync_memo_files_in_tx(conn: &Connection, memo_id: i32, content: &str) -> Result<(), String> {
    let file_ids = collect_file_ids_from_content(content);
    conn.execute("DELETE FROM memo_files WHERE memo_id = ?", [memo_id])
        .map_err(|e| e.to_string())?;

    for file_id in file_ids {
        conn.execute(
            "INSERT INTO memo_files (memo_id, file_id) VALUES (?, ?)",
            params![memo_id, file_id],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn collect_file_ids_from_content(content: &str) -> Vec<String> {
    let Ok(doc) = serde_json::from_str::<Value>(content) else {
        return Vec::new();
    };

    let mut ids = BTreeSet::new();
    collect_file_ids(&doc, &mut ids);
    ids.into_iter().collect()
}

fn collect_file_ids(node: &Value, out: &mut BTreeSet<String>) {
    if let Some(marks) = node.get("marks").and_then(Value::as_array) {
        for mark in marks {
            if mark.get("type").and_then(Value::as_str) == Some("fileLink") {
                if let Some(file_id) = mark
                    .get("attrs")
                    .and_then(Value::as_object)
                    .and_then(|attrs| attrs.get("fileId"))
                    .and_then(Value::as_str)
                {
                    out.insert(file_id.to_string());
                }
            }
        }
    }

    if let Some(children) = node.get("content").and_then(Value::as_array) {
        for child in children {
            collect_file_ids(child, out);
        }
    }
}

fn append_file_link_block(
    content: &str,
    file_id: &str,
    display_name: &str,
) -> Result<String, String> {
    let mut doc = match serde_json::from_str::<Value>(content) {
        Ok(Value::Object(mut object)) => {
            if object.get("type").and_then(Value::as_str) != Some("doc") {
                object.insert("type".to_string(), Value::String("doc".to_string()));
            }
            if !object.get("content").is_some_and(Value::is_array) {
                object.insert("content".to_string(), Value::Array(Vec::new()));
            }
            Value::Object(object)
        }
        _ => json!({
            "type": "doc",
            "content": [],
        }),
    };

    let content_array = doc
        .get_mut("content")
        .and_then(Value::as_array_mut)
        .ok_or_else(|| "Memo content does not have a valid content array.".to_string())?;

    content_array.push(json!({
        "type": "paragraph",
        "content": [
            {
                "type": "text",
                "text": display_name,
                "marks": [
                    {
                        "type": "fileLink",
                        "attrs": {
                            "fileId": file_id,
                            "label": display_name
                        }
                    }
                ]
            }
        ]
    }));

    serde_json::to_string(&doc).map_err(|e| e.to_string())
}

fn extract_plain_text_from_value_str(content: &str) -> String {
    let Ok(doc) = serde_json::from_str::<Value>(content) else {
        return String::new();
    };
    let mut texts = Vec::new();
    collect_plain_text(&doc, &mut texts);
    texts.join(" ")
}

fn collect_plain_text(node: &Value, out: &mut Vec<String>) {
    if let Some(text) = node.get("text").and_then(Value::as_str) {
        if !text.is_empty() {
            out.push(text.to_string());
        }
    }

    if let Some(children) = node.get("content").and_then(Value::as_array) {
        for child in children {
            collect_plain_text(child, out);
        }
    }
}

fn find_files_by_file_id(root: &Path, file_id: &str) -> Result<Vec<PathBuf>, String> {
    let mut matches = Vec::new();
    walk_storage(root, file_id, &mut matches)?;
    Ok(matches)
}

fn walk_storage(dir: &Path, file_id: &str, matches: &mut Vec<PathBuf>) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            walk_storage(&path, file_id, matches)?;
            continue;
        }

        let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
            continue;
        };
        if name.contains(file_id) {
            matches.push(path);
        }
    }

    Ok(())
}

fn generate_file_id() -> String {
    Uuid::new_v4().simple().to_string().to_uppercase()
}

fn build_physical_file_name(original_name: &str, file_id: &str) -> String {
    let path = Path::new(original_name);
    let stem = path
        .file_stem()
        .and_then(|value| value.to_str())
        .filter(|value| !value.is_empty())
        .unwrap_or("file");
    let ext = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("");
    if ext.is_empty() {
        format!("{}__mb_{}", stem, file_id)
    } else {
        format!("{}__mb_{}.{}", stem, file_id, ext)
    }
}

fn should_ignore_inbox_file(path: &Path, ignored_file_names: &[String]) -> bool {
    let Some(name) = path.file_name().and_then(|value| value.to_str()) else {
        return false;
    };

    if name.starts_with('.') {
        return true;
    }

    ignored_file_names
        .iter()
        .any(|ignored_name| name.eq_ignore_ascii_case(ignored_name.trim()))
}

#[cfg(test)]
mod tests {
    use std::fs;

    use rusqlite::{params, Connection};

    use super::{
        append_file_link_block, build_physical_file_name, collect_file_ids_from_content,
        generate_file_id, should_ignore_inbox_file, FileRepository,
    };
    use crate::migrations::apply_migrations;

    fn setup_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory DB should open");
        conn.execute(
            "CREATE TABLE schema_migrations (version TEXT PRIMARY KEY)",
            [],
        )
        .expect("schema_migrations should be creatable");
        apply_migrations(&conn).expect("migrations should apply");
        conn
    }

    #[test]
    fn build_physical_name_preserves_extension() {
        let file_name = build_physical_file_name("proposal.pdf", "FILE123");
        assert_eq!(file_name, "proposal__mb_FILE123.pdf");
    }

    #[test]
    fn should_ignore_inbox_file_ignores_dotfiles() {
        assert!(should_ignore_inbox_file(
            std::path::Path::new(".DS_Store"),
            &[]
        ));
    }

    #[test]
    fn should_ignore_inbox_file_matches_configured_names_case_insensitively() {
        assert!(should_ignore_inbox_file(
            std::path::Path::new("Desktop.ini"),
            &["desktop.ini".to_string()]
        ));
    }

    #[test]
    fn should_ignore_inbox_file_keeps_unlisted_files() {
        assert!(!should_ignore_inbox_file(
            std::path::Path::new("proposal.pdf"),
            &["desktop.ini".to_string()]
        ));
    }

    #[test]
    fn collect_file_ids_deduplicates_entries() {
        let content = r#"{
          "type":"doc",
          "content":[
            {"type":"paragraph","content":[
              {"type":"text","text":"proposal","marks":[{"type":"fileLink","attrs":{"fileId":"FILE123","label":"proposal.pdf"}}]},
              {"type":"text","text":"proposal","marks":[{"type":"fileLink","attrs":{"fileId":"FILE123","label":"proposal.pdf"}}]}
            ]}
          ]
        }"#;

        assert_eq!(
            collect_file_ids_from_content(content),
            vec!["FILE123".to_string()]
        );
    }

    #[test]
    fn append_file_link_block_adds_file_link_paragraph() {
        let updated =
            append_file_link_block(r#"{"type":"doc","content":[]}"#, "FILE123", "proposal.pdf")
                .expect("content should update");
        assert!(updated.contains("\"fileId\":\"FILE123\""));
        assert!(updated.contains("\"label\":\"proposal.pdf\""));
    }

    #[test]
    fn append_file_link_block_handles_legacy_empty_string_json() {
        let updated = append_file_link_block(r#""""#, "FILE123", "proposal.pdf")
            .expect("legacy empty-string content should be normalized");
        assert!(updated.contains("\"type\":\"doc\""));
        assert!(updated.contains("\"fileId\":\"FILE123\""));
    }

    #[test]
    fn append_file_link_block_handles_doc_without_content_array() {
        let updated = append_file_link_block(r#"{"type":"doc"}"#, "FILE123", "proposal.pdf")
            .expect("missing content array should be added");
        assert!(updated.contains("\"content\":["));
        assert!(updated.contains("\"fileId\":\"FILE123\""));
    }

    #[test]
    fn update_note_persists_trimmed_text_and_detail_exposes_it() {
        let conn = setup_conn();
        conn.execute(
            "INSERT INTO files (id, type, display_name, note, relative_path, url, imported_at)
             VALUES (?, 'local_file', ?, NULL, ?, NULL, CURRENT_TIMESTAMP)",
            params!["FILE123", "proposal.pdf", "proposal__mb_FILE123.pdf"],
        )
        .expect("file should insert");

        let updated = FileRepository::update_note(&conn, "FILE123", "  quick memo  ")
            .expect("note should update");
        assert_eq!(updated.note.as_deref(), Some("quick memo"));

        let detail = FileRepository::get_file_detail(&conn, "FILE123")
            .expect("detail should load")
            .expect("detail should exist");
        assert_eq!(detail.note.as_deref(), Some("quick memo"));
    }

    #[test]
    fn update_note_clears_value_when_blank() {
        let conn = setup_conn();
        conn.execute(
            "INSERT INTO files (id, type, display_name, note, relative_path, url, imported_at)
             VALUES (?, 'local_file', ?, ?, ?, NULL, CURRENT_TIMESTAMP)",
            params![
                "FILE123",
                "proposal.pdf",
                "existing memo",
                "proposal__mb_FILE123.pdf"
            ],
        )
        .expect("file should insert");

        let updated =
            FileRepository::update_note(&conn, "FILE123", "   ").expect("note should clear");
        assert_eq!(updated.note, None);
    }

    #[test]
    fn import_local_entry_moves_directory_as_single_record() {
        let mut conn = setup_conn();
        let temp_root =
            std::env::temp_dir().join(format!("monobox-file-test-{}", generate_file_id()));
        let source_dir = temp_root.join("Downloads").join("Project");
        let nested_dir = source_dir.join("notes");
        let storage_root = temp_root.join("Storage");
        fs::create_dir_all(&nested_dir).expect("source folders should be created");
        fs::create_dir_all(&storage_root).expect("storage folder should be created");
        fs::write(nested_dir.join("plan.md"), "# Plan").expect("nested file should be written");

        let record = FileRepository::import_local_entry(&mut conn, &source_dir, &storage_root)
            .expect("directory should import");

        assert_eq!(record.file_type, "local_directory");
        assert_eq!(record.display_name, "Project");
        assert!(!source_dir.exists());

        let stored_path =
            storage_root.join(record.relative_path.expect("relative path should exist"));
        assert!(stored_path.is_dir());
        assert!(stored_path.join("notes").join("plan.md").is_file());

        fs::remove_dir_all(temp_root).expect("temp folders should be removed");
    }
}
