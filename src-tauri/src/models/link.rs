use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Link {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
    pub description: Option<String>,
    pub thumbnail_image: Option<String>,
    pub link_id: i32,
    pub link_type: String,
}

#[derive(Serialize, Deserialize)]
pub struct LinkId {
    pub id: i32,
    pub from_memo_id: i32,
    pub to_memo_id: i32,
}
