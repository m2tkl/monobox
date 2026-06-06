use serde::{Deserialize, Serialize};

use crate::models::file::MemoLinkedFileItem;

#[derive(Serialize, Deserialize)]
pub struct MemoDetail {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub content: String,
    pub plain_text: String,
    pub description: Option<String>,
    pub thumbnail_image: Option<String>,
    pub workspace_id: i32,
    pub created_at: String,
    pub updated_at: String,
    pub modified_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct MemoIndexItem {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub description: Option<String>,
    pub thumbnail_image: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub modified_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct MemoSearchItem {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub description: Option<String>,
    pub modified_at: String,
    pub snippet: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct ModifiedMemoItem {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub description: Option<String>,
    pub plain_text: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub modified_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct CurrentMemoDetail {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub viewed_at: String,
    pub viewed_at_local: String,
    pub memo: MemoDetail,
}

#[derive(Serialize, Deserialize)]
pub struct CurrentMemoPlainText {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub viewed_at: String,
    pub viewed_at_local: String,
    pub title: String,
    pub description: Option<String>,
    pub plain_text: String,
}

#[derive(Serialize, Deserialize)]
pub struct MemoContextRelatedMemo {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub description: Option<String>,
    pub thumbnail_image: Option<String>,
    pub plain_text: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct MemoContextLinkGroup {
    pub total_count: usize,
    pub items: Vec<MemoContextRelatedMemo>,
}

#[derive(Serialize, Deserialize)]
pub struct MemoContextLinks {
    pub forward: MemoContextLinkGroup,
    pub backward: MemoContextLinkGroup,
    pub two_hop: MemoContextLinkGroup,
}

#[derive(Serialize, Deserialize)]
pub struct CurrentMemoContext {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub viewed_at: String,
    pub viewed_at_local: String,
    pub memo: MemoDetail,
    pub files: Vec<MemoLinkedFileItem>,
    pub links: MemoContextLinks,
    pub context_text: String,
}
