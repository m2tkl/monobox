use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct MemoDetail {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub content: String,
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
pub struct CurrentMemoDetail {
    pub workspace_slug_name: String,
    pub memo_slug_title: String,
    pub viewed_at: String,
    pub memo: MemoDetail,
}
