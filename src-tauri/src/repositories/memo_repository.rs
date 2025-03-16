use crate::models::memo::{MemoDetail, MemoIndexItem};
use rusqlite::{Connection, OptionalExtension, Result};
use serde_json::Value;

use rusqlite;
use serde_json;

#[derive(Debug)]
pub enum MemoError {
    Sqlite(rusqlite::Error),
    Json(serde_json::Error),
}

impl std::fmt::Display for MemoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MemoError::Sqlite(e) => write!(f, "SQLite error: {}", e),
            MemoError::Json(e) => write!(f, "JSON error: {}", e),
        }
    }
}

impl std::error::Error for MemoError {}

impl From<rusqlite::Error> for MemoError {
    fn from(e: rusqlite::Error) -> Self {
        MemoError::Sqlite(e)
    }
}

impl From<serde_json::Error> for MemoError {
    fn from(e: serde_json::Error) -> Self {
        MemoError::Json(e)
    }
}

pub struct MemoRepository;

impl MemoRepository {
    pub fn list(conn: &Connection, workspace_id: i32) -> Result<Vec<MemoIndexItem>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_title, title, description, thumbnail_image, created_at, updated_at, modified_at
                FROM memo
                WHERE workspace_id = ?
                ORDER BY modified_at DESC",
            )
            .map_err(|e| e.to_string())?;

        let memos = stmt
            .query_map([workspace_id], |row| {
                Ok(MemoIndexItem {
                    id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    thumbnail_image: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                    modified_at: row.get(7)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(memos)
    }

    pub fn find_by_slug(
        conn: &Connection,
        workspace_id: i32,
        memo_slug_title: &str,
    ) -> Result<Option<MemoDetail>> {
        let mut stmt = conn
            .prepare(
                "SELECT id, slug_title, title, json(content) AS content, description, thumbnail_image, workspace_id, created_at, updated_at, modified_at
                FROM memo
                WHERE
                  workspace_id = ?
                  AND slug_title = ?",
            )?;

        let memo: Option<MemoDetail> = stmt
            .query_row((workspace_id, memo_slug_title), |row| {
                Ok(MemoDetail {
                    id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    content: row.get(3)?,
                    description: row.get(4)?,
                    thumbnail_image: row.get(5)?,
                    workspace_id: row.get(6)?,
                    created_at: row.get(7)?,
                    updated_at: row.get(8)?,
                    modified_at: row.get(9)?,
                })
            })
            .optional()?;

        Ok(memo)
    }

    pub fn create(
        conn: &Connection,
        workspace_id: i32,
        slug_title: &str,
        title: &str,
        content: &str,
    ) -> Result<MemoDetail> {
        conn.execute(
            "INSERT INTO memo (workspace_id, slug_title, title, content, modified_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)",
            (workspace_id, slug_title, title, content),
        )?;

        let memo_id = conn.last_insert_rowid() as i32;

        let mut stmt = conn.prepare(
            "SELECT id, slug_title, title, json(content) AS content, description, thumbnail_image, workspace_id, created_at, updated_at, modified_at
            FROM memo
            WHERE id = ?",
        )?;

        let memo = stmt.query_row([memo_id], |row| {
            Ok(MemoDetail {
                id: row.get(0)?,
                slug_title: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                description: row.get(4)?,
                thumbnail_image: row.get(5)?,
                workspace_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
                modified_at: row.get(9)?,
            })
        })?;

        Ok(memo)
    }

    pub fn save(
        conn: &mut Connection,
        memo_id: i32,
        workspace_slug: &str,
        target_slug_title: &str,
        target_title: &str,
        slug_title: &str,
        title: &str,
        content: &str,
        description: &str,
        thumbnail_image: &str,
    ) -> Result<(), MemoError> {
        let tx = conn.transaction()?;

        tx.execute(
            "UPDATE memo
            SET slug_title = ?, title = ?, content = ?, description = ?, thumbnail_image = ?, modified_at = CURRENT_TIMESTAMP
            WHERE id = ?",
            (slug_title, title, content, description, thumbnail_image, memo_id),
        )?;

        {
            let mut stmt = tx.prepare(
                "SELECT id, content
                FROM memo
                WHERE id IN (
                    SELECT from_memo_id
                    FROM link
                    WHERE to_memo_id = ?
                )",
            )?;
            let memo_iter = stmt.query_map([memo_id], |row| {
                Ok((row.get::<_, i32>(0)?, row.get::<_, String>(1)?))
            })?;

            for memo in memo_iter {
                let (memo_id, content) = memo?;
                let updated_content = update_link_text(
                    &content,
                    workspace_slug,
                    target_slug_title,
                    target_title,
                    slug_title,
                    title,
                )?;

                tx.execute(
                    "UPDATE memo SET content = ? WHERE id = ?",
                    (&updated_content, memo_id),
                )?;
            }
        }

        tx.commit()?;
        Ok(())
    }

    pub fn delete(conn: &mut Connection, memo_id: i32) -> Result<()> {
        let tx = conn.transaction()?;

        tx.execute(
            "DELETE FROM link
            WHERE from_memo_id = ? OR to_memo_id = ?
            ",
            (memo_id, memo_id),
        )?;

        tx.execute("DELETE FROM memo WHERE id = ?", (memo_id,))?;

        tx.commit()?;
        Ok(())
    }
}

fn update_link_text(
    json_str: &str,
    workspace_slug: &str,
    target_link_slug: &str,
    unmodified_link_text: &str,
    new_link_slug: &str,
    new_link_text: &str,
) -> Result<String, MemoError> {
    let mut doc: Value = serde_json::from_str(json_str)?;
    update_nodes(
        &mut doc,
        workspace_slug,
        target_link_slug,
        unmodified_link_text,
        new_link_slug,
        new_link_text,
    );
    serde_json::to_string(&doc).map_err(MemoError::from)
}

fn update_nodes(
    node: &mut Value,
    workspace_slug: &str,
    target_link_slug: &str,
    unmodified_link_text: &str,
    new_link_slug: &str,
    new_link_text: &str,
) {
    let obj = match node.as_object_mut() {
        Some(o) => o,
        None => {
            if let Some(arr) = node.as_array_mut() {
                for child in arr {
                    update_nodes(
                        child,
                        workspace_slug,
                        target_link_slug,
                        unmodified_link_text,
                        new_link_slug,
                        new_link_text,
                    );
                }
            }
            return;
        }
    };

    // The target for updates is a "text" node that also contains a "link" node.
    // If this condition is not met, the process moves on to recursively handle child nodes.
    let is_text_node = obj.get("type").and_then(Value::as_str) == Some("text");
    let has_link_node = obj
        .get("marks")
        .and_then(Value::as_array)
        .map_or(false, |arr| {
            arr.iter()
                .any(|m| m.get("type").and_then(Value::as_str) == Some("link"))
        });
    if !is_text_node || !has_link_node {
        if let Some(content) = obj.get_mut("content").and_then(Value::as_array_mut) {
            for child in content {
                update_nodes(
                    child,
                    workspace_slug,
                    target_link_slug,
                    unmodified_link_text,
                    new_link_slug,
                    new_link_text,
                );
            }
        }
        return;
    }

    let target_href = format!("/{}/{}", workspace_slug, target_link_slug);

    // Find the node that contains the target href and perform the update.
    if let Some(marks) = obj.get_mut("marks").and_then(Value::as_array_mut) {
        if let Some(link_mark) = marks
            .iter_mut()
            .find(|m| m.get("type").and_then(Value::as_str) == Some("link"))
        {
            if let Some(attrs) = link_mark.get_mut("attrs").and_then(Value::as_object_mut) {
                if let Some(current_href) = attrs.get("href").and_then(Value::as_str) {
                    if current_href == target_href {
                        // If the link matches the target, update href value.
                        attrs.insert(
                            "href".to_string(),
                            Value::String(format!("/{}/{}", workspace_slug, new_link_slug)),
                        );

                        // If the text matches the pre-update value, meaning it has not changed since the link was created,
                        // the text will also be updated accordingly.
                        if let Some(current_text) = obj.get("text").and_then(Value::as_str) {
                            if current_text == unmodified_link_text {
                                obj.insert(
                                    "text".to_string(),
                                    Value::String(new_link_text.to_string()),
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    // If there are child nodes, process them recursively.
    if let Some(content) = obj.get_mut("content").and_then(Value::as_array_mut) {
        for child in content {
            update_nodes(
                child,
                workspace_slug,
                target_link_slug,
                unmodified_link_text,
                new_link_slug,
                new_link_text,
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Value;

    #[test]
    fn update_link_and_text_if_text_unchanged_since_link_was_created() {
        let input_json = r#"
        {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "link",
                                    "attrs": {
                                        "href": "/sample-workspace/test",
                                        "target": null,
                                        "rel": "noopener noreferrer nofollow",
                                        "class": null
                                    }
                                }
                            ],
                            "text": "test"
                        }
                    ]
                }
            ]
        }
        "#;

        let workspace_slug = "sample-workspace";

        let target_link_slug = "test";
        let new_link_slug = "test_updated";

        let unmodified_link_text: &str = "test";
        let new_link_text = "test updated";

        let updated_str = update_link_text(
            input_json,
            workspace_slug,
            target_link_slug,
            unmodified_link_text,
            new_link_slug,
            new_link_text,
        )
        .expect("update_link_text should succeed");

        let updated_json: Value =
            serde_json::from_str(&updated_str).expect("updated JSON should be valid");

        let target_node = updated_json["content"][0]["content"][0]
            .as_object()
            .unwrap();

        // The `attrs.href` of `marks` has been updated.
        let href: &str = target_node["marks"][0]["attrs"]["href"].as_str().unwrap();
        let expected_href = format!("/{}/{}", workspace_slug, new_link_slug);
        assert_eq!(href, expected_href);

        // Display text has been updated to `new_link_text`.
        assert_eq!(
            target_node.get("text").unwrap().as_str().unwrap(),
            new_link_text,
        );
    }

    #[test]
    fn update_link_only_if_text_has_changed_since_link_was_created() {
        let input_json = r#"
        {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "link",
                                    "attrs": {
                                        "href": "/sample-workspace/test",
                                        "target": null,
                                        "rel": "noopener noreferrer nofollow",
                                        "class": null
                                    }
                                }
                            ],
                            "text": "test edited"
                        }
                    ]
                }
            ]
        }
        "#;

        let workspace_slug = "sample-workspace";

        let target_link_slug = "test";
        let unmodified_link_text: &str = "test";

        let new_link_slug = "test_updated";
        let new_link_text = "test updated";

        let updated_str = update_link_text(
            input_json,
            workspace_slug,
            target_link_slug,
            unmodified_link_text,
            new_link_slug,
            new_link_text,
        )
        .expect("update_link_text should succeed");

        let updated_json: Value =
            serde_json::from_str(&updated_str).expect("updated JSON should be valid");

        let target_node = updated_json["content"][0]["content"][0]
            .as_object()
            .unwrap();

        // The `attrs.href` of `marks` has been updated.
        let href: &str = target_node["marks"][0]["attrs"]["href"].as_str().unwrap();
        let expected_href = format!("/{}/{}", workspace_slug, new_link_slug);
        assert_eq!(href, expected_href);

        // Display text has not been updated because text has been already edited .
        assert_eq!(
            target_node.get("text").unwrap().as_str().unwrap(),
            "test edited",
        );
    }

    #[test]
    fn update_nested_links() {
        let input_json = r#"
        {
            "type": "doc",
            "content": [
                {
                    "type": "bulletList",
                    "content": [
                        {
                            "type": "listItem",
                            "content": [
                                {
                                    "type": "paragraph",
                                    "content": [
                                        {
                                            "type": "text",
                                            "marks": [
                                                {
                                                    "type": "link",
                                                    "attrs": {
                                                        "href": "/sample-workspace/test",
                                                        "target": null,
                                                        "rel": "noopener noreferrer nofollow",
                                                        "class": null
                                                    }
                                                }
                                            ],
                                            "text": "test"
                                        }
                                    ]
                                },
                                {
                                    "type": "bulletList",
                                    "content": [
                                        {
                                            "type": "listItem",
                                            "content": [
                                                {
                                                    "type": "paragraph",
                                                    "content": [
                                                        {
                                                            "type": "text",
                                                            "text": "This is a raw text node."
                                                        }
                                                    ]
                                                },
                                                {
                                                    "type": "bulletList",
                                                    "content": [
                                                        {
                                                            "type": "listItem",
                                                            "content": [
                                                                {
                                                                    "type": "paragraph",
                                                                    "content": [
                                                                        {
                                                                            "type": "text",
                                                                            "marks": [
                                                                                {
                                                                                    "type": "link",
                                                                                    "attrs": {
                                                                                        "href": "/sample-workspace/test",
                                                                                        "target": null,
                                                                                        "rel": "noopener noreferrer nofollow",
                                                                                        "class": null
                                                                                    }
                                                                                }
                                                                            ],
                                                                            "text": "test"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "type": "listItem",
                                                            "content": [
                                                                {
                                                                    "type": "paragraph",
                                                                    "content": [
                                                                        {
                                                                            "type": "text",
                                                                            "marks": [
                                                                                {
                                                                                    "type": "link",
                                                                                    "attrs": {
                                                                                        "href": "/sample-workspace/test",
                                                                                        "target": null,
                                                                                        "rel": "noopener noreferrer nofollow",
                                                                                        "class": null
                                                                                    }
                                                                                }
                                                                            ],
                                                                            "text": "test edited"
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        "#;

        // Target link: Update the link with `href` set to "/sample-workspace/test"
        // The link is updated, and if the text is "test", it is also updated to "new test".
        let workspace_slug = "sample-workspace";
        let target_link_slug = "test";
        let new_link_slug = "new-test";
        let unmodified_link_text = "test";
        let new_link_text = "new test";

        let updated_json_str = update_link_text(
            input_json,
            workspace_slug,
            target_link_slug,
            unmodified_link_text,
            new_link_slug,
            new_link_text,
        )
        .expect("update_link_text should succeed");

        let updated_value: Value =
            serde_json::from_str(&updated_json_str).expect("updated JSON should be valid");

        // Recursively collect "text" nodes that contain a link mark.
        let mut link_text_nodes = Vec::new();
        fn collect_link_text_nodes<'a>(node: &'a Value, collection: &mut Vec<&'a Value>) {
            if let Some(obj) = node.as_object() {
                if obj.get("type").and_then(Value::as_str) == Some("text") {
                    if let Some(marks) = obj.get("marks").and_then(Value::as_array) {
                        if marks
                            .iter()
                            .any(|m| m.get("type").and_then(Value::as_str) == Some("link"))
                        {
                            collection.push(node);
                        }
                    }
                }
                if let Some(content) = obj.get("content").and_then(Value::as_array) {
                    for child in content {
                        collect_link_text_nodes(child, collection);
                    }
                }
            } else if let Some(arr) = node.as_array() {
                for child in arr {
                    collect_link_text_nodes(child, collection);
                }
            }
        }
        collect_link_text_nodes(&updated_value, &mut link_text_nodes);

        // Check each target node
        // * Ensure that all link marks have their `href` updated to "/sample-workspace/new-test"
        // * If the text was "test", it should be updated to "new test"
        // * If the text was "test edited", it should remain unchanged
        for node in link_text_nodes {
            let obj = node.as_object().expect("node must be an object");
            let text = obj
                .get("text")
                .and_then(Value::as_str)
                .expect("text field must exist");

            // Check href in the marks.link
            if let Some(marks) = obj.get("marks").and_then(Value::as_array) {
                for mark in marks {
                    if mark.get("type").and_then(Value::as_str) == Some("link") {
                        let href = mark
                            .get("attrs")
                            .and_then(|attrs| attrs.get("href"))
                            .and_then(Value::as_str)
                            .expect("href must exist");
                        assert_eq!(
                            href, "/sample-workspace/new-test",
                            "Link href should be updated"
                        );
                    }
                }
            }

            // If the original text is "test", it should be updated to "new test"
            // Otherwise, it should remain as "test edited"
            if text == "new test" {
                assert_eq!(text, "new test", "Text has been incorrectly updated");
            } else {
                assert_eq!(
                    text, "test edited",
                    "Text not matching update condition should remain unchanged"
                );
            }
        }
    }
}
