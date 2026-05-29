use rusqlite::{params, Connection, OptionalExtension};

use crate::models::memo::{
    CurrentMemoContext, CurrentMemoDetail, CurrentMemoPlainText, MemoContextLinkGroup,
    MemoContextLinks, MemoContextRelatedMemo, MemoDetail,
};
use crate::repositories::{FileRepository, LinkRepository, MemoRepository};

pub struct MemoViewRepository;

impl MemoViewRepository {
    pub fn record_view(
        conn: &mut Connection,
        workspace_id: i32,
        memo_id: i32,
    ) -> Result<(), String> {
        let tx = conn.transaction().map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO memo_view_event (workspace_id, memo_id) VALUES (?, ?)",
            params![workspace_id, memo_id],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO memo_view_state (slot, workspace_id, memo_id, viewed_at)
             VALUES ('current', ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(slot) DO UPDATE SET
               workspace_id = excluded.workspace_id,
               memo_id = excluded.memo_id,
               viewed_at = CURRENT_TIMESTAMP",
            params![workspace_id, memo_id],
        )
        .map_err(|e| e.to_string())?;

        tx.commit().map_err(|e| e.to_string())
    }

    pub fn get_current_memo(conn: &Connection) -> Result<Option<CurrentMemoDetail>, String> {
        conn.query_row(
            "SELECT
                workspace.slug_name,
                memo.slug_title,
                strftime('%Y-%m-%dT%H:%M:%SZ', memo_view_state.viewed_at),
                strftime('%Y-%m-%dT%H:%M:%S', memo_view_state.viewed_at, 'localtime'),
                memo.id,
                memo.slug_title,
                memo.title,
                json(memo.content) AS content,
                memo.description,
                memo.thumbnail_image,
                memo.workspace_id,
                memo.created_at,
                memo.updated_at,
                memo.modified_at
             FROM memo_view_state
             JOIN workspace ON workspace.id = memo_view_state.workspace_id
             JOIN memo ON memo.id = memo_view_state.memo_id
            WHERE memo_view_state.slot = 'current'",
            [],
            |row| {
                let content: String = row.get(7)?;
                Ok(CurrentMemoDetail {
                    workspace_slug_name: row.get(0)?,
                    memo_slug_title: row.get(1)?,
                    viewed_at: row.get(2)?,
                    viewed_at_local: row.get(3)?,
                    memo: MemoDetail {
                        id: row.get(4)?,
                        slug_title: row.get(5)?,
                        title: row.get(6)?,
                        plain_text:
                            crate::repositories::memo_repository::extract_plain_text_from_json_str(
                                &content,
                            ),
                        content,
                        description: row.get(8)?,
                        thumbnail_image: row.get(9)?,
                        workspace_id: row.get(10)?,
                        created_at: row.get(11)?,
                        updated_at: row.get(12)?,
                        modified_at: row.get(13)?,
                    },
                })
            },
        )
        .optional()
        .map_err(|e| e.to_string())
    }

    pub fn get_current_memo_plain_text(
        conn: &Connection,
    ) -> Result<Option<CurrentMemoPlainText>, String> {
        let Some(current) = Self::get_current_memo(conn)? else {
            return Ok(None);
        };

        Ok(Some(CurrentMemoPlainText {
            workspace_slug_name: current.workspace_slug_name,
            memo_slug_title: current.memo_slug_title,
            viewed_at: current.viewed_at,
            viewed_at_local: current.viewed_at_local,
            title: current.memo.title,
            description: current.memo.description,
            plain_text: current.memo.plain_text,
        }))
    }

    pub fn get_current_memo_context(
        conn: &Connection,
        include_related_memo_plain_text: bool,
        max_related_memos_per_group: usize,
    ) -> Result<Option<CurrentMemoContext>, String> {
        let Some(current) = Self::get_current_memo(conn)? else {
            return Ok(None);
        };

        let files = FileRepository::list_files_for_memo(conn, current.memo.id)?;
        let links = LinkRepository::list(conn, current.memo.id)?;
        let max_related_memos_per_group = max_related_memos_per_group.max(1);

        let mut forward = Vec::new();
        let mut backward = Vec::new();
        let mut two_hop = Vec::new();
        let mut forward_total_count = 0usize;
        let mut backward_total_count = 0usize;
        let mut two_hop_total_count = 0usize;

        for link in links {
            let target = build_related_memo(
                conn,
                current.memo.workspace_id,
                link.id,
                include_related_memo_plain_text,
                link.slug_title,
                link.title,
                link.description,
                link.thumbnail_image,
            )?;

            match link.link_type.as_str() {
                "Forward" => {
                    forward_total_count += 1;
                    if forward.len() < max_related_memos_per_group {
                        forward.push(target);
                    }
                }
                "Backward" => {
                    backward_total_count += 1;
                    if backward.len() < max_related_memos_per_group {
                        backward.push(target);
                    }
                }
                "TwoHop" => {
                    two_hop_total_count += 1;
                    if two_hop.len() < max_related_memos_per_group {
                        two_hop.push(target);
                    }
                }
                _ => {}
            }
        }

        let context_text = build_context_text(&current.memo, &forward, &backward, &two_hop, &files);

        Ok(Some(CurrentMemoContext {
            workspace_slug_name: current.workspace_slug_name,
            memo_slug_title: current.memo_slug_title,
            viewed_at: current.viewed_at,
            viewed_at_local: current.viewed_at_local,
            memo: current.memo,
            files,
            links: MemoContextLinks {
                forward: MemoContextLinkGroup {
                    total_count: forward_total_count,
                    items: forward,
                },
                backward: MemoContextLinkGroup {
                    total_count: backward_total_count,
                    items: backward,
                },
                two_hop: MemoContextLinkGroup {
                    total_count: two_hop_total_count,
                    items: two_hop,
                },
            },
            context_text,
        }))
    }
}

fn build_related_memo(
    conn: &Connection,
    workspace_id: i32,
    memo_id: i32,
    include_plain_text: bool,
    slug_title: String,
    title: String,
    description: Option<String>,
    thumbnail_image: Option<String>,
) -> Result<MemoContextRelatedMemo, String> {
    let plain_text = if include_plain_text {
        MemoRepository::find_by_id(conn, workspace_id, memo_id)
            .map_err(|e| e.to_string())?
            .map(|memo| memo.plain_text)
    } else {
        None
    };

    Ok(MemoContextRelatedMemo {
        id: memo_id,
        slug_title,
        title,
        description,
        thumbnail_image,
        plain_text,
    })
}

fn build_context_text(
    memo: &MemoDetail,
    forward: &[MemoContextRelatedMemo],
    backward: &[MemoContextRelatedMemo],
    two_hop: &[MemoContextRelatedMemo],
    files: &[crate::models::file::MemoLinkedFileItem],
) -> String {
    let mut lines = vec![
        format!("# {}", memo.title),
        String::new(),
        "## Current Memo".to_string(),
        String::new(),
    ];

    if !memo.plain_text.trim().is_empty() {
        lines.push(memo.plain_text.clone());
        lines.push(String::new());
    }

    append_related_group(&mut lines, "Forward Links", forward);
    append_related_group(&mut lines, "Backward Links", backward);
    append_related_group(&mut lines, "Two-Hop Links", two_hop);

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

fn append_related_group(lines: &mut Vec<String>, heading: &str, memos: &[MemoContextRelatedMemo]) {
    if memos.is_empty() {
        return;
    }

    lines.push(format!("## {}", heading));
    lines.push(String::new());

    for memo in memos {
        lines.push(format!("### {}", memo.title));
        lines.push(String::new());

        if let Some(plain_text) = memo
            .plain_text
            .as_ref()
            .filter(|text| !text.trim().is_empty())
        {
            lines.push(plain_text.clone());
        } else if let Some(description) = memo
            .description
            .as_ref()
            .filter(|text| !text.trim().is_empty())
        {
            lines.push(description.clone());
        }

        lines.push(String::new());
    }
}

#[cfg(test)]
mod tests {
    use super::MemoViewRepository;
    use rusqlite::Connection;

    #[test]
    fn record_view_updates_current_slot() {
        let mut conn = Connection::open_in_memory().expect("in-memory db should open");
        conn.execute_batch(
            "
            CREATE TABLE workspace (
                id INTEGER PRIMARY KEY,
                slug_name TEXT NOT NULL,
                name TEXT
            );
            CREATE TABLE memo (
                id INTEGER PRIMARY KEY,
                slug_title TEXT NOT NULL,
                title TEXT,
                content TEXT,
                description TEXT,
                thumbnail_image TEXT,
                workspace_id INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                modified_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_event (
                id INTEGER PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_state (
                slot TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO workspace (id, slug_name, name) VALUES (1, 'default', 'Default');
            INSERT INTO memo (id, slug_title, title, content, workspace_id) VALUES
              (11, 'alpha', 'Alpha', '{\"type\":\"doc\",\"content\":[]}', 1),
              (12, 'beta', 'Beta', '{\"type\":\"doc\",\"content\":[]}', 1);
            ",
        )
        .expect("schema and fixtures should be created");

        MemoViewRepository::record_view(&mut conn, 1, 11).expect("first view should record");
        MemoViewRepository::record_view(&mut conn, 1, 12).expect("second view should record");

        let current = MemoViewRepository::get_current_memo(&conn)
            .expect("current memo should load")
            .expect("current memo should exist");
        assert_eq!(current.memo_slug_title, "beta");
        assert!(current.viewed_at.ends_with('Z'));
        assert!(!current.viewed_at_local.is_empty());

        let event_count: i32 = conn
            .query_row("SELECT COUNT(*) FROM memo_view_event", [], |row| row.get(0))
            .expect("event count should be readable");
        assert_eq!(event_count, 2);
    }

    #[test]
    fn get_current_memo_plain_text_returns_lightweight_summary_fields() {
        let mut conn = Connection::open_in_memory().expect("in-memory db should open");
        conn.execute_batch(
            r#"
            CREATE TABLE workspace (
                id INTEGER PRIMARY KEY,
                slug_name TEXT NOT NULL,
                name TEXT
            );
            CREATE TABLE memo (
                id INTEGER PRIMARY KEY,
                slug_title TEXT NOT NULL,
                title TEXT,
                content TEXT,
                description TEXT,
                thumbnail_image TEXT,
                workspace_id INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                modified_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_event (
                id INTEGER PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_state (
                slot TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            INSERT INTO workspace (id, slug_name, name) VALUES (1, 'default', 'Default');
            INSERT INTO memo (id, slug_title, title, content, description, workspace_id) VALUES
              (11, 'alpha', 'Alpha', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Current memo body"}]}]}', 'Current summary', 1);
            "#,
        )
        .expect("schema and fixtures should be created");

        MemoViewRepository::record_view(&mut conn, 1, 11).expect("view should record");

        let current = MemoViewRepository::get_current_memo_plain_text(&conn)
            .expect("current memo plain text should load")
            .expect("current memo plain text should exist");

        assert_eq!(current.title, "Alpha");
        assert_eq!(current.description.as_deref(), Some("Current summary"));
        assert_eq!(current.plain_text, "Current memo body");
        assert!(current.viewed_at.ends_with('Z'));
        assert!(!current.viewed_at_local.is_empty());
    }

    #[test]
    fn get_current_memo_context_includes_plain_text_links_files_and_context_text() {
        let mut conn = Connection::open_in_memory().expect("in-memory db should open");
        conn.execute_batch(
            r#"
            CREATE TABLE workspace (
                id INTEGER PRIMARY KEY,
                slug_name TEXT NOT NULL,
                name TEXT
            );
            CREATE TABLE memo (
                id INTEGER PRIMARY KEY,
                slug_title TEXT NOT NULL,
                title TEXT,
                content TEXT,
                description TEXT,
                thumbnail_image TEXT,
                workspace_id INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                modified_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE link (
                id INTEGER PRIMARY KEY,
                from_memo_id INTEGER NOT NULL,
                to_memo_id INTEGER NOT NULL
            );
            CREATE TABLE memo_view_event (
                id INTEGER PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE memo_view_state (
                slot TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                memo_id INTEGER NOT NULL,
                viewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE files (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                display_name TEXT NOT NULL,
                note TEXT,
                relative_path TEXT,
                url TEXT,
                imported_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE note_files (
                note_id INTEGER NOT NULL,
                file_id TEXT NOT NULL
            );

            INSERT INTO workspace (id, slug_name, name) VALUES (1, 'default', 'Default');
            INSERT INTO memo (id, slug_title, title, content, description, workspace_id) VALUES
              (11, 'alpha', 'Alpha', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Current memo body"}]}]}', 'Current summary', 1),
              (12, 'beta', 'Beta', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Forward body"}]}]}', 'Forward summary', 1),
              (13, 'gamma', 'Gamma', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Backward body"}]}]}', 'Backward summary', 1),
              (14, 'delta', 'Delta', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Two hop body"}]}]}', 'Two hop summary', 1),
              (15, 'epsilon', 'Epsilon', '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Shared target"}]}]}', 'Shared target summary', 1);
            INSERT INTO link (id, from_memo_id, to_memo_id) VALUES
              (101, 11, 12),
              (102, 13, 11),
              (103, 11, 15),
              (104, 14, 15);
            INSERT INTO files (id, type, display_name) VALUES
              ('FILE123', 'local_file', 'proposal.pdf');
            INSERT INTO note_files (note_id, file_id) VALUES
              (11, 'FILE123');
            "#,
        )
        .expect("schema and fixtures should be created");

        MemoViewRepository::record_view(&mut conn, 1, 11).expect("view should record");

        let context = MemoViewRepository::get_current_memo_context(&conn, true, 10)
            .expect("context should load")
            .expect("context should exist");

        assert_eq!(context.memo.title, "Alpha");
        assert_eq!(context.memo.plain_text, "Current memo body");
        assert_eq!(context.links.forward.total_count, 2);
        assert_eq!(
            context.links.forward.items[0].plain_text.as_deref(),
            Some("Forward body")
        );
        assert_eq!(context.links.backward.total_count, 1);
        assert_eq!(
            context.links.backward.items[0].plain_text.as_deref(),
            Some("Backward body")
        );
        assert_eq!(context.links.two_hop.total_count, 1);
        assert_eq!(context.files.len(), 1);
        assert!(context.context_text.contains("# Alpha"));
        assert!(context.context_text.contains("## Current Memo"));
        assert!(context.context_text.contains("Current memo body"));
        assert!(context.context_text.contains("## Forward Links"));
        assert!(context.context_text.contains("proposal.pdf"));
    }
}
