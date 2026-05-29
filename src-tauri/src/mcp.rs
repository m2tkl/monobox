use std::fmt;
use std::io::{BufRead, BufReader, Read, Write};
use std::net::{Shutdown, TcpListener, TcpStream};
use std::thread;

use serde::Deserialize;
use serde_json::{json, Value};

use crate::config::{load_config, AppConfig};
use crate::database::get_conn;
use crate::repositories::{FileRepository, LinkRepository, MemoRepository, WorkspaceRepository};

pub const MCP_PROTOCOL_VERSION: &str = "2024-11-05";

#[derive(Debug, serde::Serialize, Clone)]
pub struct McpServerInfo {
    pub enabled: bool,
    pub port: u16,
    pub token: String,
    pub url: String,
    pub setup_complete: bool,
}

#[derive(Debug)]
pub enum McpServerError {
    Bind(String),
}

impl fmt::Display for McpServerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            McpServerError::Bind(message) => write!(f, "{}", message),
        }
    }
}

impl std::error::Error for McpServerError {}

#[derive(Debug, Deserialize)]
pub struct RpcRequest {
    #[allow(dead_code)]
    pub jsonrpc: String,
    pub id: Option<Value>,
    pub method: String,
    pub params: Option<Value>,
}

#[derive(Debug, Deserialize)]
struct ToolCallParams {
    name: String,
    arguments: Option<Value>,
}

pub fn build_server_info(config: &AppConfig) -> McpServerInfo {
    let token = config.mcp_token.clone();
    let port = config.mcp_port;
    McpServerInfo {
        enabled: true,
        port,
        token: token.clone(),
        url: build_server_url(port, &token),
        setup_complete: config.setup_complete,
    }
}

pub fn build_server_url(port: u16, token: &str) -> String {
    format!("http://127.0.0.1:{}/mcp/{}", port, token)
}

pub fn spawn_http_server(config: AppConfig) -> Result<(), McpServerError> {
    let info = build_server_info(&config);
    let listener = TcpListener::bind(("127.0.0.1", info.port)).map_err(|err| {
        McpServerError::Bind(format!(
            "Failed to bind monobox MCP server at {}: {}",
            info.url, err
        ))
    })?;

    thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(stream) => {
                    let token = info.token.clone();
                    thread::spawn(move || {
                        let _ = handle_http_connection(stream, &token);
                    });
                }
                Err(_) => continue,
            }
        }
    });

    Ok(())
}

pub fn handle_json_rpc_request(request: RpcRequest) -> Result<Option<Value>, String> {
    match request.method.as_str() {
        "initialize" => Ok(Some(json!({
            "protocolVersion": MCP_PROTOCOL_VERSION,
            "capabilities": {
                "tools": {
                    "listChanged": false
                }
            },
            "serverInfo": {
                "name": "monobox-mcp",
                "version": env!("CARGO_PKG_VERSION")
            }
        }))),
        "notifications/initialized" => Ok(None),
        "ping" => Ok(Some(json!({}))),
        "tools/list" => Ok(Some(json!({
            "tools": tool_definitions()
        }))),
        "tools/call" => {
            let params_value = request
                .params
                .ok_or_else(|| "Missing tools/call params.".to_string())?;
            let params: ToolCallParams =
                serde_json::from_value(params_value).map_err(|err| err.to_string())?;
            let arguments = params.arguments.unwrap_or_else(|| json!({}));
            let structured = call_tool(&params.name, &arguments)?;
            Ok(Some(json!({
                "content": [
                    {
                        "type": "text",
                        "text": serde_json::to_string_pretty(&structured)
                            .map_err(|err| err.to_string())?
                    }
                ],
                "structuredContent": structured,
                "isError": false
            })))
        }
        _ => Err(format!("Method not found: {}", request.method)),
    }
}

pub fn tool_definitions() -> Value {
    json!([
        {
            "name": "get_setup_status",
            "description": "Return monobox setup state and storage paths.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "list_workspaces",
            "description": "List all workspaces in monobox.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "get_workspace",
            "description": "Fetch a single workspace by slug.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    }
                },
                "required": ["workspace_slug_name"]
            }
        },
        {
            "name": "list_memos",
            "description": "List memo index items for a workspace.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    }
                },
                "required": ["workspace_slug_name"]
            }
        },
        {
            "name": "get_memo",
            "description": "Fetch one memo including its full content JSON.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    },
                    "memo_slug_title": {
                        "type": "string",
                        "description": "Memo slug."
                    }
                },
                "required": ["workspace_slug_name", "memo_slug_title"]
            }
        },
        {
            "name": "get_memo_plain_text",
            "description": "Fetch one memo as a lightweight plain-text payload for summarization and quick reading.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    },
                    "memo_slug_title": {
                        "type": "string",
                        "description": "Memo slug."
                    }
                },
                "required": ["workspace_slug_name", "memo_slug_title"]
            }
        },
        {
            "name": "get_memo_context",
            "description": "Fetch one memo together with agent-friendly plain text, related memo summaries, attached files, and a combined context_text export.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    },
                    "memo_slug_title": {
                        "type": "string",
                        "description": "Memo slug."
                    },
                    "include_content_json": {
                        "type": "boolean",
                        "description": "When true, include memo.content JSON in the response. Defaults to false for this high-level tool."
                    },
                    "include_plain_text": {
                        "type": "boolean",
                        "description": "When true, include memo.plain_text for the target memo. Defaults to true."
                    },
                    "include_links": {
                        "type": "boolean",
                        "description": "When true, include grouped forward/backward/two-hop related memos. Defaults to true."
                    },
                    "include_files": {
                        "type": "boolean",
                        "description": "When true, include attached file summaries. Defaults to true."
                    },
                    "include_context_text": {
                        "type": "boolean",
                        "description": "When true, include a combined plain-text export in context_text. Defaults to true."
                    },
                    "include_related_memo_plain_text": {
                        "type": "boolean",
                        "description": "When true, include plain_text for related memos. Defaults to false."
                    },
                    "max_related_memos_per_group": {
                        "type": "integer",
                        "description": "Maximum number of related memos to include for each of forward/backward/two-hop groups. Defaults to 10."
                    }
                },
                "required": ["workspace_slug_name", "memo_slug_title"]
            }
        },
        {
            "name": "get_current_memo",
            "description": "Fetch the memo the user most recently viewed in the app.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "get_current_memo_plain_text",
            "description": "Fetch the currently viewed memo as a lightweight plain-text payload for summarization and quick reading.",
            "inputSchema": {
                "type": "object",
                "properties": {}
            }
        },
        {
            "name": "get_current_memo_context",
            "description": "Fetch the currently viewed memo together with agent-friendly plain text, related memo summaries, attached files, and a combined context_text export.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "include_content_json": {
                        "type": "boolean",
                        "description": "When true, include memo.content JSON in the response. Defaults to false for this high-level tool."
                    },
                    "include_plain_text": {
                        "type": "boolean",
                        "description": "When true, include memo.plain_text for the current memo. Defaults to true."
                    },
                    "include_links": {
                        "type": "boolean",
                        "description": "When true, include grouped forward/backward/two-hop related memos. Defaults to true."
                    },
                    "include_files": {
                        "type": "boolean",
                        "description": "When true, include attached file summaries. Defaults to true."
                    },
                    "include_context_text": {
                        "type": "boolean",
                        "description": "When true, include a combined plain-text export in context_text. Defaults to true."
                    },
                    "include_related_memo_plain_text": {
                        "type": "boolean",
                        "description": "When true, include plain_text for related memos. Defaults to true."
                    },
                    "max_related_memos_per_group": {
                        "type": "integer",
                        "description": "Maximum number of related memos to include for each of forward/backward/two-hop groups. Defaults to 10."
                    }
                }
            }
        },
        {
            "name": "search_memos",
            "description": "Full-text search memos inside one workspace.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    },
                    "query": {
                        "type": "string",
                        "description": "Search query used against memo_fts."
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results. Defaults to 20."
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Search result offset. Defaults to 0."
                    }
                },
                "required": ["workspace_slug_name", "query"]
            }
        },
        {
            "name": "list_files",
            "description": "List managed file records.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of files. Defaults to 20."
                    },
                    "offset": {
                        "type": "integer",
                        "description": "Pagination offset. Defaults to 0."
                    },
                    "unlinked_only": {
                        "type": "boolean",
                        "description": "When true, only return files that are not linked to any memo."
                    }
                }
            }
        },
        {
            "name": "get_file_detail",
            "description": "Fetch one managed file detail by file id.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "file_id": {
                        "type": "string",
                        "description": "Managed file id."
                    }
                },
                "required": ["file_id"]
            }
        },
        {
            "name": "list_memo_files",
            "description": "List files linked from a memo.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    },
                    "memo_slug_title": {
                        "type": "string",
                        "description": "Memo slug."
                    }
                },
                "required": ["workspace_slug_name", "memo_slug_title"]
            }
        },
        {
            "name": "get_memo_links",
            "description": "List forward, backward, and two-hop memo links for a memo.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "workspace_slug_name": {
                        "type": "string",
                        "description": "Workspace slug."
                    },
                    "memo_slug_title": {
                        "type": "string",
                        "description": "Memo slug."
                    }
                },
                "required": ["workspace_slug_name", "memo_slug_title"]
            }
        }
    ])
}

fn call_tool(name: &str, args: &Value) -> Result<Value, String> {
    match name {
        "get_setup_status" => {
            let config = load_app_config()?;
            Ok(json!({
                "setup_complete": config.setup_complete,
                "database_path": config.database_path,
                "asset_dir_path": config.asset_dir_path,
                "files_storage_root": config.files_storage_root
            }))
        }
        "list_workspaces" => {
            ensure_setup_complete()?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspaces = WorkspaceRepository::list(&conn)?;
            Ok(json!(workspaces))
        }
        "get_workspace" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = WorkspaceRepository::find_by_slug(&conn, &workspace_slug_name)
                .map_err(|err| err.to_string())?
                .ok_or_else(|| format!("Workspace not found for slug: {}", workspace_slug_name))?;
            Ok(json!(workspace))
        }
        "list_memos" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memos = MemoRepository::list(&conn, workspace.id)?;
            Ok(json!(memos))
        }
        "get_memo" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let memo_slug_title = required_string(args, "memo_slug_title")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memo = MemoRepository::find_by_slug(&conn, workspace.id, &memo_slug_title)
                .map_err(|err| err.to_string())?
                .ok_or_else(|| format!("Memo not found for slug: {}", memo_slug_title))?;
            Ok(json!(memo))
        }
        "get_memo_plain_text" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let memo_slug_title = required_string(args, "memo_slug_title")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memo = MemoRepository::find_by_slug(&conn, workspace.id, &memo_slug_title)
                .map_err(|err| err.to_string())?
                .ok_or_else(|| format!("Memo not found for slug: {}", memo_slug_title))?;
            Ok(json!(build_memo_plain_text_value(
                &workspace_slug_name,
                &memo_slug_title,
                &memo
            )))
        }
        "get_memo_context" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let memo_slug_title = required_string(args, "memo_slug_title")?;
            let include_content_json = optional_bool(args, "include_content_json").unwrap_or(false);
            let include_plain_text = optional_bool(args, "include_plain_text").unwrap_or(true);
            let include_links = optional_bool(args, "include_links").unwrap_or(true);
            let include_files = optional_bool(args, "include_files").unwrap_or(true);
            let include_context_text = optional_bool(args, "include_context_text").unwrap_or(true);
            let include_related_memo_plain_text =
                optional_bool(args, "include_related_memo_plain_text").unwrap_or(false);
            let max_related_memos_per_group =
                optional_i64(args, "max_related_memos_per_group").unwrap_or(10);
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memo = MemoRepository::find_by_slug(&conn, workspace.id, &memo_slug_title)
                .map_err(|err| err.to_string())?
                .ok_or_else(|| format!("Memo not found for slug: {}", memo_slug_title))?;

            let context = build_memo_context_value(
                &conn,
                &workspace_slug_name,
                &memo_slug_title,
                &memo,
                include_related_memo_plain_text,
                max_related_memos_per_group.max(1) as usize,
            )?;
            Ok(shape_current_memo_context(
                context,
                include_content_json,
                include_plain_text,
                include_links,
                include_files,
                include_context_text,
            ))
        }
        "get_current_memo" => {
            ensure_setup_complete()?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let memo = crate::repositories::MemoViewRepository::get_current_memo(&conn)?;
            Ok(json!(memo))
        }
        "get_current_memo_plain_text" => {
            ensure_setup_complete()?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let memo = crate::repositories::MemoViewRepository::get_current_memo_plain_text(&conn)?;
            Ok(json!(memo))
        }
        "get_current_memo_context" => {
            ensure_setup_complete()?;
            let include_content_json = optional_bool(args, "include_content_json").unwrap_or(false);
            let include_plain_text = optional_bool(args, "include_plain_text").unwrap_or(true);
            let include_links = optional_bool(args, "include_links").unwrap_or(true);
            let include_files = optional_bool(args, "include_files").unwrap_or(true);
            let include_context_text = optional_bool(args, "include_context_text").unwrap_or(true);
            let include_related_memo_plain_text =
                optional_bool(args, "include_related_memo_plain_text").unwrap_or(false);
            let max_related_memos_per_group =
                optional_i64(args, "max_related_memos_per_group").unwrap_or(10);
            let conn = get_conn().map_err(|err| err.to_string())?;
            let context = crate::repositories::MemoViewRepository::get_current_memo_context(
                &conn,
                include_related_memo_plain_text,
                max_related_memos_per_group.max(1) as usize,
            )?;
            Ok(shape_current_memo_context(
                json!(context),
                include_content_json,
                include_plain_text,
                include_links,
                include_files,
                include_context_text,
            ))
        }
        "search_memos" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let query = required_string(args, "query")?;
            let limit = optional_i32(args, "limit").unwrap_or(20);
            let offset = optional_i32(args, "offset").unwrap_or(0);
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memos = MemoRepository::search(&conn, workspace.id, &query, limit, offset)?;
            Ok(json!(memos))
        }
        "list_files" => {
            ensure_setup_complete()?;
            let limit = optional_i64(args, "limit").unwrap_or(20);
            let offset = optional_i64(args, "offset").unwrap_or(0);
            let unlinked_only = optional_bool(args, "unlinked_only").unwrap_or(false);
            let conn = get_conn().map_err(|err| err.to_string())?;
            let files = FileRepository::list_files(&conn, limit, offset, unlinked_only)?;
            Ok(json!(files))
        }
        "get_file_detail" => {
            ensure_setup_complete()?;
            let file_id = required_string(args, "file_id")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let file = FileRepository::get_file_detail(&conn, &file_id)?
                .ok_or_else(|| "File record was not found.".to_string())?;
            Ok(json!(file))
        }
        "list_memo_files" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let memo_slug_title = required_string(args, "memo_slug_title")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memo = MemoRepository::find_by_slug(&conn, workspace.id, &memo_slug_title)
                .map_err(|err| err.to_string())?
                .ok_or_else(|| format!("Memo not found for slug: {}", memo_slug_title))?;
            let files = FileRepository::list_files_for_memo(&conn, memo.id)?;
            Ok(json!(files))
        }
        "get_memo_links" => {
            ensure_setup_complete()?;
            let workspace_slug_name = required_string(args, "workspace_slug_name")?;
            let memo_slug_title = required_string(args, "memo_slug_title")?;
            let conn = get_conn().map_err(|err| err.to_string())?;
            let workspace = resolve_workspace(&conn, &workspace_slug_name)?;
            let memo = MemoRepository::find_by_slug(&conn, workspace.id, &memo_slug_title)
                .map_err(|err| err.to_string())?
                .ok_or_else(|| format!("Memo not found for slug: {}", memo_slug_title))?;
            let links = LinkRepository::list(&conn, memo.id)?;
            Ok(json!(links))
        }
        _ => Err(format!("Unknown tool: {}", name)),
    }
}

fn handle_http_connection(mut stream: TcpStream, token: &str) -> std::io::Result<()> {
    let mut reader = BufReader::new(stream.try_clone()?);
    let mut request_line = String::new();
    if reader.read_line(&mut request_line)? == 0 {
        return Ok(());
    }

    let request_line = request_line.trim_end_matches(['\r', '\n']);
    let mut parts = request_line.split_whitespace();
    let method = parts.next().unwrap_or_default();
    let path = parts.next().unwrap_or_default();

    let mut content_length = 0usize;
    loop {
        let mut line = String::new();
        if reader.read_line(&mut line)? == 0 {
            break;
        }
        if line == "\r\n" || line == "\n" {
            break;
        }
        let trimmed = line.trim_end_matches(['\r', '\n']);
        if let Some((name, value)) = trimmed.split_once(':') {
            if name.trim().eq_ignore_ascii_case("content-length") {
                content_length = value.trim().parse::<usize>().unwrap_or(0);
            }
        }
    }

    if path == format!("/mcp/{}/health", token) && method == "GET" {
        write_http_json(
            &mut stream,
            200,
            &json!({"ok": true, "protocolVersion": MCP_PROTOCOL_VERSION}),
        )?;
        return Ok(());
    }

    if path != format!("/mcp/{}", token) {
        write_http_text(&mut stream, 404, "Not Found")?;
        return Ok(());
    }

    if method != "POST" {
        write_http_text(&mut stream, 405, "Method Not Allowed")?;
        return Ok(());
    }

    let mut body = vec![0u8; content_length];
    reader.read_exact(&mut body)?;

    let request: RpcRequest = match serde_json::from_slice(&body) {
        Ok(request) => request,
        Err(err) => {
            write_http_json(
                &mut stream,
                400,
                &json!({"error": format!("Invalid JSON-RPC payload: {}", err)}),
            )?;
            return Ok(());
        }
    };

    let request_id = request.id.clone();
    match handle_json_rpc_request(request) {
        Ok(Some(response)) => {
            if let Some(id) = request_id {
                write_http_json(
                    &mut stream,
                    200,
                    &json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": response,
                    }),
                )?;
            } else {
                write_http_json(&mut stream, 202, &json!({"accepted": true}))?;
            }
        }
        Ok(None) => {
            write_http_text(&mut stream, 202, "")?;
        }
        Err(message) => {
            let payload = match request_id {
                Some(id) => json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": {
                        "code": -32000,
                        "message": message,
                    }
                }),
                None => json!({
                    "error": {
                        "code": -32000,
                        "message": message,
                    }
                }),
            };
            write_http_json(&mut stream, 200, &payload)?;
        }
    }

    let _ = stream.shutdown(Shutdown::Both);
    Ok(())
}

fn write_http_json(stream: &mut TcpStream, status: u16, body: &Value) -> std::io::Result<()> {
    let payload = serde_json::to_vec(body).unwrap_or_else(|_| b"{}".to_vec());
    write_http_response(stream, status, "application/json", &payload)
}

fn write_http_text(stream: &mut TcpStream, status: u16, body: &str) -> std::io::Result<()> {
    write_http_response(stream, status, "text/plain; charset=utf-8", body.as_bytes())
}

fn write_http_response(
    stream: &mut TcpStream,
    status: u16,
    content_type: &str,
    body: &[u8],
) -> std::io::Result<()> {
    let reason = match status {
        200 => "OK",
        202 => "Accepted",
        400 => "Bad Request",
        404 => "Not Found",
        405 => "Method Not Allowed",
        _ => "Internal Server Error",
    };

    write!(
        stream,
        "HTTP/1.1 {} {}\r\nContent-Type: {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        status,
        reason,
        content_type,
        body.len()
    )?;
    stream.write_all(body)?;
    stream.flush()?;
    Ok(())
}

fn load_app_config() -> Result<AppConfig, String> {
    let proj_dirs = directories::ProjectDirs::from("com", "m2tkl", "monobox")
        .ok_or_else(|| "Failed to determine project directories".to_string())?;
    load_config(proj_dirs.config_dir(), proj_dirs.data_dir())
}

fn ensure_setup_complete() -> Result<(), String> {
    let config = load_app_config()?;
    if config.setup_complete {
        Ok(())
    } else {
        Err("monobox setup is not complete yet.".to_string())
    }
}

fn resolve_workspace(
    conn: &rusqlite::Connection,
    workspace_slug_name: &str,
) -> Result<crate::models::Workspace, String> {
    WorkspaceRepository::find_by_slug(conn, workspace_slug_name)
        .map_err(|err| err.to_string())?
        .ok_or_else(|| format!("Workspace not found for slug: {}", workspace_slug_name))
}

fn required_string(args: &Value, key: &str) -> Result<String, String> {
    args.get(key)
        .and_then(Value::as_str)
        .map(ToOwned::to_owned)
        .ok_or_else(|| format!("Missing required string argument: {}", key))
}

fn optional_i64(args: &Value, key: &str) -> Option<i64> {
    args.get(key).and_then(Value::as_i64)
}

fn optional_i32(args: &Value, key: &str) -> Option<i32> {
    optional_i64(args, key).and_then(|value| i32::try_from(value).ok())
}

fn optional_bool(args: &Value, key: &str) -> Option<bool> {
    args.get(key).and_then(Value::as_bool)
}

fn build_memo_plain_text_value(
    workspace_slug_name: &str,
    memo_slug_title: &str,
    memo: &crate::models::memo::MemoDetail,
) -> Value {
    json!({
        "workspace_slug_name": workspace_slug_name,
        "memo_slug_title": memo_slug_title,
        "title": memo.title,
        "description": memo.description,
        "plain_text": memo.plain_text,
        "created_at": memo.created_at,
        "updated_at": memo.updated_at,
        "modified_at": memo.modified_at,
    })
}

fn build_memo_context_value(
    conn: &rusqlite::Connection,
    workspace_slug_name: &str,
    memo_slug_title: &str,
    memo: &crate::models::memo::MemoDetail,
    include_related_memo_plain_text: bool,
    max_related_memos_per_group: usize,
) -> Result<Value, String> {
    let files = FileRepository::list_files_for_memo(conn, memo.id)?;
    let links = LinkRepository::list(conn, memo.id)?;
    let max_related_memos_per_group = max_related_memos_per_group.max(1);

    let mut forward = Vec::new();
    let mut backward = Vec::new();
    let mut two_hop = Vec::new();
    let mut forward_total_count = 0usize;
    let mut backward_total_count = 0usize;
    let mut two_hop_total_count = 0usize;

    for link in links {
        let plain_text = if include_related_memo_plain_text {
            MemoRepository::find_by_id(conn, memo.workspace_id, link.id)
                .map_err(|e| e.to_string())?
                .map(|related_memo| related_memo.plain_text)
        } else {
            None
        };

        let related = json!({
            "id": link.id,
            "slug_title": link.slug_title,
            "title": link.title,
            "description": link.description,
            "thumbnail_image": link.thumbnail_image,
            "plain_text": plain_text,
        });

        match link.link_type.as_str() {
            "Forward" => {
                forward_total_count += 1;
                if forward.len() < max_related_memos_per_group {
                    forward.push(related);
                }
            }
            "Backward" => {
                backward_total_count += 1;
                if backward.len() < max_related_memos_per_group {
                    backward.push(related);
                }
            }
            "TwoHop" => {
                two_hop_total_count += 1;
                if two_hop.len() < max_related_memos_per_group {
                    two_hop.push(related);
                }
            }
            _ => {}
        }
    }

    let context_text = build_context_text_from_values(
        &memo.title,
        &memo.plain_text,
        &forward,
        &backward,
        &two_hop,
        &files,
    );

    Ok(json!({
        "workspace_slug_name": workspace_slug_name,
        "memo_slug_title": memo_slug_title,
        "memo": memo,
        "files": files,
        "links": {
            "forward": {
                "total_count": forward_total_count,
                "items": forward,
            },
            "backward": {
                "total_count": backward_total_count,
                "items": backward,
            },
            "two_hop": {
                "total_count": two_hop_total_count,
                "items": two_hop,
            }
        },
        "context_text": context_text,
    }))
}

fn build_context_text_from_values(
    title: &str,
    plain_text: &str,
    forward: &[Value],
    backward: &[Value],
    two_hop: &[Value],
    files: &[crate::models::file::MemoLinkedFileItem],
) -> String {
    let mut lines = vec![
        format!("# {}", title),
        String::new(),
        "## Current Memo".to_string(),
        String::new(),
    ];

    if !plain_text.trim().is_empty() {
        lines.push(plain_text.to_string());
        lines.push(String::new());
    }

    append_related_group_values(&mut lines, "Forward Links", forward);
    append_related_group_values(&mut lines, "Backward Links", backward);
    append_related_group_values(&mut lines, "Two-Hop Links", two_hop);

    if !files.is_empty() {
        lines.push("## Attached Files".to_string());
        lines.push(String::new());
        for file in files {
            lines.push(format!("- {}", file.display_name));
        }
        lines.push(String::new());
    }

    while lines.last().is_some_and(|line| line.is_empty()) {
        lines.pop();
    }

    lines.join("\n")
}

fn append_related_group_values(lines: &mut Vec<String>, heading: &str, memos: &[Value]) {
    if memos.is_empty() {
        return;
    }

    lines.push(format!("## {}", heading));
    lines.push(String::new());

    for memo in memos {
        let title = memo
            .get("title")
            .and_then(Value::as_str)
            .unwrap_or("Untitled");
        lines.push(format!("### {}", title));
        lines.push(String::new());

        let plain_text = memo
            .get("plain_text")
            .and_then(Value::as_str)
            .filter(|text| !text.trim().is_empty());
        let description = memo
            .get("description")
            .and_then(Value::as_str)
            .filter(|text| !text.trim().is_empty());

        if let Some(text) = plain_text.or(description) {
            lines.push(text.to_string());
        }

        lines.push(String::new());
    }
}

fn shape_current_memo_context(
    mut context: Value,
    include_content_json: bool,
    include_plain_text: bool,
    include_links: bool,
    include_files: bool,
    include_context_text: bool,
) -> Value {
    let Some(context_obj) = context.as_object_mut() else {
        return context;
    };

    if let Some(memo_obj) = context_obj.get_mut("memo").and_then(Value::as_object_mut) {
        if !include_content_json {
            memo_obj.remove("content");
        }
        if !include_plain_text {
            memo_obj.remove("plain_text");
        }
    }

    if !include_links {
        context_obj.remove("links");
    }

    if !include_files {
        context_obj.remove("files");
    }

    if !include_context_text {
        context_obj.remove("context_text");
    }

    context
}

#[cfg(test)]
mod tests {
    use super::{
        build_server_url, handle_json_rpc_request, shape_current_memo_context, tool_definitions,
        RpcRequest,
    };
    use serde_json::json;

    #[test]
    fn build_server_url_uses_tokenized_path() {
        assert_eq!(
            build_server_url(38453, "abc123"),
            "http://127.0.0.1:38453/mcp/abc123"
        );
    }

    #[test]
    fn initialize_returns_server_info() {
        let response = handle_json_rpc_request(RpcRequest {
            jsonrpc: "2.0".to_string(),
            id: Some(json!(1)),
            method: "initialize".to_string(),
            params: Some(json!({})),
        })
        .expect("initialize should succeed")
        .expect("initialize should return a result");

        assert_eq!(response["protocolVersion"], "2024-11-05");
        assert_eq!(response["serverInfo"]["name"], "monobox-mcp");
    }

    #[test]
    fn tool_definitions_include_core_tools() {
        let tools = tool_definitions();
        let names: Vec<String> = tools
            .as_array()
            .expect("tools should be an array")
            .iter()
            .filter_map(|item| item.get("name").and_then(|value| value.as_str()))
            .map(ToOwned::to_owned)
            .collect();

        assert!(names.contains(&"list_workspaces".to_string()));
        assert!(names.contains(&"get_memo".to_string()));
        assert!(names.contains(&"get_memo_plain_text".to_string()));
        assert!(names.contains(&"get_memo_context".to_string()));
        assert!(names.contains(&"get_current_memo_plain_text".to_string()));
        assert!(names.contains(&"get_file_detail".to_string()));
    }

    #[test]
    fn shape_current_memo_context_drops_optional_sections() {
        let shaped = shape_current_memo_context(
            json!({
                "memo": {
                    "title": "Memo",
                    "content": "{\"type\":\"doc\"}",
                    "plain_text": "Body"
                },
                "links": {
                    "forward": {"total_count": 1, "items": []},
                    "backward": {"total_count": 0, "items": []},
                    "two_hop": {"total_count": 0, "items": []}
                },
                "files": [{"display_name": "proposal.pdf"}],
                "context_text": "# Memo\n\nBody"
            }),
            false,
            true,
            false,
            false,
            false,
        );

        assert!(shaped["memo"].get("content").is_none());
        assert_eq!(shaped["memo"]["plain_text"], "Body");
        assert!(shaped.get("links").is_none());
        assert!(shaped.get("files").is_none());
        assert!(shaped.get("context_text").is_none());
    }
}
