use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct FocusDailyState {
    pub id: i32,
    pub workspace_id: i32,
    pub memo_id: i32,
    pub done_on: String,
    pub created_at: String,
    pub updated_at: String,
}
