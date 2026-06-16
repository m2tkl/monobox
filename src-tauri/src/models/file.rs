use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ManagedFileListItem {
    pub id: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub display_name: String,
    pub imported_at: String,
    pub related_memo_count: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MemoLinkedFileItem {
    pub id: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub display_name: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ManagedFileListPage {
    pub items: Vec<ManagedFileListItem>,
    pub total_count: i64,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RelatedMemoSummary {
    pub memo_id: i32,
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub title: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ManagedFileDetail {
    pub id: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub display_name: String,
    pub note: Option<String>,
    pub relative_path: Option<String>,
    pub url: Option<String>,
    pub imported_at: String,
    pub related_memos: Vec<RelatedMemoSummary>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InboxFileItem {
    pub path: String,
    pub display_name: String,
    pub kind: String,
    pub entry_type: String,
    pub acquired_at: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct InboxFilePage {
    pub items: Vec<InboxFileItem>,
    pub total_count: i64,
    pub limit: i64,
    pub offset: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ManagedFileRecord {
    pub id: String,
    #[serde(rename = "type")]
    pub file_type: String,
    pub display_name: String,
    pub note: Option<String>,
    pub relative_path: Option<String>,
    pub url: Option<String>,
    pub imported_at: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ResolvedFileOpenTarget {
    pub open_kind: String,
    pub value: String,
}
