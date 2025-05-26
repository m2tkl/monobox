use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Bookmark {
    pub id: i32,
    pub workspace_id: i32,
    pub memo_id: i32,
    pub created_at: String,
}
