use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Workspace {
    pub id: i32,
    pub slug: String,
    pub name: String,
}
