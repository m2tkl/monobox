use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Memo {
    pub id: i32,
    pub slug: String,
    pub title: String,
    pub description: String,
    pub updated_at: String,
}
