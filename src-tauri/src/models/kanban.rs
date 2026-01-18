use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Kanban {
    pub id: i32,
    pub workspace_id: i32,
    pub name: String,
    pub order_index: i32,
    pub created_at: String,
    pub updated_at: String,
}
