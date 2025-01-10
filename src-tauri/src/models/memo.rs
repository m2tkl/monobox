use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct MemoDetail {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub content: String,
    pub description: Option<String>,
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
    pub created_at: String,
    pub updated_at: String,
    pub modified_at: String,
}
