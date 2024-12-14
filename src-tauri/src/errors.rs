use rusqlite::Error as SqliteError;

#[derive(Debug)]
pub enum AppError {
    ConfigLoadError(String),
    DatabaseError(SqliteError),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::ConfigLoadError(msg) => write!(f, "Config Load Error: {}", msg),
            AppError::DatabaseError(err) => write!(f, "Database Error: {}", err),
        }
    }
}

impl std::error::Error for AppError {}

impl From<SqliteError> for AppError {
    fn from(err: SqliteError) -> Self {
        AppError::DatabaseError(err)
    }
}
