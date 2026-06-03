use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CalendarDayMemo {
    pub id: i32,
    pub slug_title: String,
    pub title: String,
}

#[derive(Serialize, Deserialize)]
pub struct CalendarDay {
    pub id: i32,
    pub date: String,
    pub note: Option<String>,
    pub is_non_working: bool,
    pub memos: Vec<CalendarDayMemo>,
}
