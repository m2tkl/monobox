use crate::models::link::{Link, LinkId, MemoLinkCount};
use rusqlite::{Connection, Result};

pub struct LinkRepository;

impl LinkRepository {
    pub fn list(conn: &Connection, memo_id: i32) -> Result<Vec<Link>, String> {
        let query = "
            WITH
              MemoId AS (SELECT ? AS id),
              ForwardLinks AS (
                SELECT id, to_memo_id
                FROM link
                WHERE from_memo_id = (SELECT id FROM MemoId)
              ),
              BackLinks AS (
                SELECT id, from_memo_id
                FROM link
                WHERE to_memo_id = (SELECT id FROM MemoId)
              ),
              TwoHopLinks AS (
                SELECT DISTINCT L1.id AS forward_linkid, L2.id AS twohop_linkid, L2.from_memo_id AS twohop_memoid
                FROM link L1
                JOIN link L2 ON L1.to_memo_id = L2.to_memo_id
                WHERE L1.from_memo_id = (SELECT id FROM MemoId)
                  AND L2.from_memo_id <> L1.from_memo_id
              )
            SELECT
              Memo.id,
              Memo.slug_title,
              Memo.title,
              Memo.description,
              thumbnail_image,
              'Forward' AS link_type,
              ForwardLinks.id AS link_id
            FROM memo
            JOIN ForwardLinks ON Memo.id = ForwardLinks.to_memo_id

            UNION ALL

            SELECT
              Memo.id,
              Memo.slug_title,
              Memo.title,
              Memo.description,
              thumbnail_image,
              'Backward' AS link_type,
              BackLinks.id AS link_id
            FROM memo
            JOIN BackLinks ON Memo.id = BackLinks.from_memo_id

            UNION ALL

            SELECT
              Memo.id,
              Memo.slug_title,
              Memo.title,
              Memo.description,
              thumbnail_image,
              'TwoHop' AS link_type,
              TwoHopLinks.forward_linkid AS link_id
            FROM memo
            JOIN TwoHopLinks ON Memo.id = TwoHopLinks.twohop_memoid;
        ";

        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

        let links = stmt
            .query_map([memo_id], |row| {
                Ok(Link {
                    id: row.get(0)?,
                    slug_title: row.get(1)?,
                    title: row.get(2)?,
                    description: row.get(3)?,
                    thumbnail_image: row.get(4)?,
                    link_type: row.get(5)?,
                    link_id: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(links)
    }

    pub fn create(conn: &Connection, memo_id: i32, to_memo_id: i32) -> Result<LinkId> {
        conn.execute(
            "INSERT INTO link (from_memo_id, to_memo_id)
            SELECT ?, id
            FROM memo
            WHERE id = ?",
            (memo_id, to_memo_id),
        )?;

        let link_id: i32 = conn.last_insert_rowid() as i32;

        let mut stmt = conn.prepare(
            "SELECT id, from_memo_id, to_memo_id
            FROM link
            WHERE id = ?",
        )?;
        let link = stmt.query_row([link_id], |row| {
            Ok(LinkId {
                id: row.get(0)?,
                from_memo_id: row.get(1)?,
                to_memo_id: row.get(2)?,
            })
        })?;

        Ok(link)
    }

    pub fn delete(conn: &Connection, from_memo_id: i32, to_memo_id: i32) -> Result<()> {
        let query = "DELETE FROM link WHERE from_memo_id = ? AND to_memo_id = ?";
        conn.execute(query, [from_memo_id, to_memo_id])?;
        Ok(())
    }

    pub fn list_counts_by_workspace(
        conn: &Connection,
        workspace_id: i32,
    ) -> Result<Vec<MemoLinkCount>, String> {
        let query = "
            WITH WorkspaceMemos AS (
                SELECT id
                FROM memo
                WHERE workspace_id = ?
            ),
            CountableLinks AS (
                SELECT link.from_memo_id AS memo_id, CAST(link.id AS TEXT) AS row_key
                FROM link
                JOIN WorkspaceMemos ON WorkspaceMemos.id = link.from_memo_id

                UNION ALL

                SELECT link.to_memo_id AS memo_id, CAST(link.id AS TEXT) AS row_key
                FROM link
                JOIN WorkspaceMemos ON WorkspaceMemos.id = link.to_memo_id

                UNION ALL

                SELECT
                    forward_link.from_memo_id AS memo_id,
                    printf('%d:%d', forward_link.id, sibling_link.id) AS row_key
                FROM link AS forward_link
                JOIN link AS sibling_link ON forward_link.to_memo_id = sibling_link.to_memo_id
                JOIN WorkspaceMemos ON WorkspaceMemos.id = forward_link.from_memo_id
                WHERE sibling_link.from_memo_id <> forward_link.from_memo_id
            )
            SELECT
                WorkspaceMemos.id,
                COUNT(CountableLinks.row_key) AS link_count
            FROM WorkspaceMemos
            LEFT JOIN CountableLinks ON CountableLinks.memo_id = WorkspaceMemos.id
            GROUP BY WorkspaceMemos.id
            ORDER BY WorkspaceMemos.id
        ";

        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

        let counts = stmt
            .query_map([workspace_id], |row| {
                Ok(MemoLinkCount {
                    memo_id: row.get(0)?,
                    link_count: row.get(1)?,
                })
            })
            .map_err(|e| e.to_string())?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())?;

        Ok(counts)
    }
}

#[cfg(test)]
mod tests {
    use super::LinkRepository;
    use rusqlite::Connection;

    #[test]
    fn list_counts_by_workspace_includes_zero_and_matches_link_categories() {
        let conn = Connection::open_in_memory().expect("in-memory db should open");
        conn.execute_batch(
            "
            CREATE TABLE memo (
                id INTEGER PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                slug_title TEXT NOT NULL,
                title TEXT
            );
            CREATE TABLE link (
                id INTEGER PRIMARY KEY,
                from_memo_id INTEGER NOT NULL,
                to_memo_id INTEGER NOT NULL
            );

            INSERT INTO memo (id, workspace_id, slug_title, title) VALUES
              (1, 10, 'inbox', 'Inbox'),
              (2, 10, 'next', 'Next'),
              (3, 10, 'later', 'Later'),
              (4, 10, 'archive', 'Archive'),
              (5, 20, 'other', 'Other');

            INSERT INTO link (id, from_memo_id, to_memo_id) VALUES
              (101, 1, 3),
              (102, 2, 3),
              (103, 3, 4),
              (104, 5, 1);
            ",
        )
        .expect("schema and fixtures should be created");

        let counts = LinkRepository::list_counts_by_workspace(&conn, 10)
            .expect("link counts should be returned");

        let pairs: Vec<(i32, i32)> = counts
            .into_iter()
            .map(|item| (item.memo_id, item.link_count))
            .collect();

        assert_eq!(pairs, vec![(1, 3), (2, 2), (3, 3), (4, 1)]);
    }
}
