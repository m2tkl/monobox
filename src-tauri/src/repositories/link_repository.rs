use rusqlite::{Connection, OptionalExtension, Result};
use crate::models::link::{Link, LinkId};

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
              'TwoHop' AS link_type,
              TwoHopLinks.forward_linkid AS link_id
            FROM memo
            JOIN TwoHopLinks ON Memo.id = TwoHopLinks.twohop_memoid;
        ";

        let mut stmt = conn.prepare(query).map_err(|e| e.to_string())?;

        let links = stmt.query_map([memo_id], |row| {
            Ok(Link {
                id: row.get(0)?,
                slug_title: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                link_type: row.get(4)?,
                link_id: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;


        Ok(links)
    }

    pub fn create(conn: &Connection, memo_id: i32, to_memo_slug_title: &str) -> Result<LinkId> {
        conn.execute(
            "INSERT INTO link (from_memo_id, to_memo_id)
            SELECT ?, id
            FROM memo
            WHERE slug_title = ?",
            (memo_id, to_memo_slug_title)
        )?;

        let link_id: i32 = conn.last_insert_rowid() as i32;

        let mut stmt = conn.prepare(
            "SELECT id, from_memo_id, to_memo_id
            FROM link
            WHERE id = ?"
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
}
