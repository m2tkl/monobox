use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FocusMemo {
    pub id: i32,
    pub workspace_id: i32,
    pub memo_id: i32,
    pub order_index: i32,
    pub done_for_today_on: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
