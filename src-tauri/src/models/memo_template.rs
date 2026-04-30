use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct MemoTemplateDetail {
    pub id: i32,
    pub slug_name: String,
    pub name: String,
    pub content: String,
    pub is_default: bool,
    pub workspace_id: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct MemoTemplateIndexItem {
    pub id: i32,
    pub slug_name: String,
    pub name: String,
    pub is_default: bool,
    pub created_at: String,
    pub updated_at: String,
}
