use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct KanbanAssignmentItem {
    pub memo_id: i32,
    pub slug_title: String,
    pub title: String,
    pub description: Option<String>,
    pub kanban_status_id: Option<i32>,
    pub position: Option<i64>,
    pub modified_at: String,
    pub kanban_id: i32,
}

#[derive(Serialize, Deserialize)]
pub struct KanbanAssignmentEntry {
    pub kanban_id: i32,
    pub kanban_name: String,
    pub kanban_status_id: Option<i32>,
    pub kanban_status_name: Option<String>,
    pub kanban_status_color: Option<String>,
    pub position: Option<i64>,
}
