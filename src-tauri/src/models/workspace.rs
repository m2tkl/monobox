use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Workspace {
    pub id: i32,
    pub slug_name: String,
    pub name: String,
    pub created_at: String,
    pub updated_at: String,
}
