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

#[cfg(test)]
mod tests {
    use super::{build_server_url, handle_json_rpc_request, tool_definitions, RpcRequest};
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
        assert!(names.contains(&"get_file_detail".to_string()));
    }
}
