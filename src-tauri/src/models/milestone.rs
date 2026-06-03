use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct MilestoneMemo {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
}

#[derive(Serialize, Deserialize)]
pub struct Milestone {
    pub id: i32,
    pub workspace_id: i32,
    pub date: String,
    pub title: String,
    pub memos: Vec<MilestoneMemo>,
    pub completed_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
