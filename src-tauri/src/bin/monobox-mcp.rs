use std::fmt;
use std::io::{self, BufRead, BufReader, BufWriter, Write};

use serde_json::{json, Value};
use tauri_app_lib::mcp::{handle_json_rpc_request, RpcRequest};

#[derive(Debug)]
enum ServerError {
    Io(io::Error),
    Json(serde_json::Error),
    InvalidRequest(String),
}

impl fmt::Display for ServerError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ServerError::Io(err) => write!(f, "I/O error: {}", err),
            ServerError::Json(err) => write!(f, "JSON error: {}", err),
            ServerError::InvalidRequest(message) => write!(f, "Invalid request: {}", message),
        }
    }
}

impl std::error::Error for ServerError {}

impl From<io::Error> for ServerError {
    fn from(err: io::Error) -> Self {
        ServerError::Io(err)
    }
}

impl From<serde_json::Error> for ServerError {
    fn from(err: serde_json::Error) -> Self {
        ServerError::Json(err)
    }
}

fn main() {
    if let Err(err) = run() {
        let _ = writeln!(io::stderr(), "{}", err);
        std::process::exit(1);
    }
}

fn run() -> Result<(), ServerError> {
    let stdin = io::stdin();
    let stdout = io::stdout();
    let mut reader = BufReader::new(stdin.lock());
    let mut writer = BufWriter::new(stdout.lock());

    while let Some(message) = read_message(&mut reader)? {
        let request: RpcRequest = serde_json::from_slice(&message)?;
        let request_id = request.id.clone();

        match handle_json_rpc_request(request) {
            Ok(Some(response)) => {
                if let Some(id) = request_id {
                    let payload = json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": response,
                    });
                    write_message(&mut writer, &payload)?;
                }
            }
            Ok(None) => {}
            Err(message) => {
                if let Some(id) = request_id {
                    let payload = json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "error": {
                            "code": -32000,
                            "message": message,
                        }
                    });
                    write_message(&mut writer, &payload)?;
                }
            }
        }
    }

    writer.flush()?;
    Ok(())
}

fn read_message<R: BufRead>(reader: &mut R) -> Result<Option<Vec<u8>>, ServerError> {
    let mut content_length = None;

    loop {
        let mut line = String::new();
        let read = reader.read_line(&mut line)?;
        if read == 0 {
            if content_length.is_none() {
                return Ok(None);
            }
            return Err(ServerError::InvalidRequest(
                "Unexpected EOF while reading message headers.".to_string(),
            ));
        }

        if line == "\r\n" || line == "\n" {
            break;
        }

        let trimmed = line.trim_end_matches(['\r', '\n']);
        if let Some(value) = trimmed.strip_prefix("Content-Length:") {
            let parsed = value.trim().parse::<usize>().map_err(|_| {
                ServerError::InvalidRequest("Invalid Content-Length header.".to_string())
            })?;
            content_length = Some(parsed);
        }
    }

    let length = content_length
        .ok_or_else(|| ServerError::InvalidRequest("Missing Content-Length header.".to_string()))?;

    let mut body = vec![0; length];
    reader.read_exact(&mut body)?;
    Ok(Some(body))
}

fn write_message<W: Write>(writer: &mut W, payload: &Value) -> Result<(), ServerError> {
    let body = serde_json::to_vec(payload)?;
    writer.write_all(format!("Content-Length: {}\r\n\r\n", body.len()).as_bytes())?;
    writer.write_all(&body)?;
    writer.flush()?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::read_message;
    use std::io::Cursor;

    #[test]
    fn read_message_parses_content_length_payload() {
        let body = br#"{"jsonrpc":"2.0"}"#;
        let input = format!("Content-Length: {}\r\n\r\n", body.len()).into_bytes();
        let mut full = input;
        full.extend_from_slice(body);
        let mut cursor = Cursor::new(full);

        let message = read_message(&mut cursor)
            .expect("message should parse")
            .expect("message should exist");

        assert_eq!(message, body);
    }
}
