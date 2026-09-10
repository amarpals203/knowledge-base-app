from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from server.db import get_connection

router = APIRouter(prefix="/notes", tags=["notes"])

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = "++COOL++"
    priority: Optional[str] = "Lowest"
    tags: Optional[List[str]] = []

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    archived: Optional[bool] = None
    time_spent_seconds: Optional[int] = None
    tags: Optional[List[str]] = None

class TagCreate(BaseModel):
    name: str

@router.get("/tags/list")
def get_all_tags():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.name, COUNT(nt.note_id) as count
        FROM tags t
        LEFT JOIN note_tags nt ON t.id = nt.tag_id
        GROUP BY t.id, t.name
        ORDER BY t.name ASC
    """)
    rows = cursor.fetchall()
    tags = [{"id": row["id"], "name": row["name"], "count": row["count"]} for row in rows]
    conn.close()
    return tags

@router.post("/tags")
def create_tag(payload: TagCreate):
    name = payload.name.strip().replace("#", "")
    if not name:
        return {"status": "error", "message": "Tag name empty"}
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()
    return {"status": "created", "name": name}

@router.delete("/tags/{name}")
def delete_tag(name: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM tags WHERE name = ?", (name,))
    row = cursor.fetchone()
    if row:
        tag_id = row["id"]
        cursor.execute("DELETE FROM note_tags WHERE tag_id = ?", (tag_id,))
        cursor.execute("DELETE FROM tags WHERE id = ?", (tag_id,))
        conn.commit()
    conn.close()
    return {"status": "deleted"}

@router.get("/")
def list_notes(
    search: Optional[str] = None,
    tag: Optional[str] = None,
    priority: Optional[str] = None,
    archived: bool = False
):
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        SELECT DISTINCT n.* FROM notes n
        LEFT JOIN note_tags nt ON n.id = nt.note_id
        LEFT JOIN tags t ON nt.tag_id = t.id
        WHERE n.archived = ?
    """
    params = [1 if archived else 0]

    if search:
        query += " AND (n.title LIKE ? OR n.content LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])

    if priority and priority != "All priorities":
        query += " AND n.priority = ?"
        params.append(priority)

    if tag and tag != "All tags":
        clean_tag = tag.replace("#", "")
        query += " AND t.name = ?"
        params.append(clean_tag)

    query += " ORDER BY n.id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    results = []
    for row in rows:
        note = dict(row)
        cursor.execute("""
            SELECT t.name FROM tags t 
            JOIN note_tags nt ON t.id = nt.tag_id 
            WHERE nt.note_id = ?
        """, (note["id"],))
        note["tags"] = [t["name"] for t in cursor.fetchall()]
        results.append(note)

    conn.close()
    return results

@router.post("/")
def create_note(payload: NoteCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO notes (title, content, priority) VALUES (?, ?, ?)",
        (payload.title, payload.content or "++COOL++", payload.priority or "Lowest")
    )
    note_id = cursor.lastrowid

    for tag_name in (payload.tags or []):
        cleaned = tag_name.strip().replace("#", "")
        if not cleaned:
            continue
        cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (cleaned,))
        cursor.execute("SELECT id FROM tags WHERE name = ?", (cleaned,))
        tag_id = cursor.fetchone()["id"]
        cursor.execute("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)", (note_id, tag_id))

    conn.commit()
    conn.close()
    return {"id": note_id, "status": "created"}

@router.put("/{note_id}")
def update_note(note_id: int, payload: NoteUpdate):
    conn = get_connection()
    cursor = conn.cursor()
    fields = []
    values = []

    if payload.title is not None:
        fields.append("title = ?")
        values.append(payload.title)
    if payload.content is not None:
        fields.append("content = ?")
        values.append(payload.content)
    if payload.priority is not None:
        fields.append("priority = ?")
        values.append(payload.priority)
    if payload.archived is not None:
        fields.append("archived = ?")
        values.append(1 if payload.archived else 0)
    if payload.time_spent_seconds is not None:
        fields.append("time_spent_seconds = ?")
        values.append(payload.time_spent_seconds)

    if fields:
        values.append(note_id)
        cursor.execute(f"UPDATE notes SET {', '.join(fields)} WHERE id = ?", tuple(values))

    conn.commit()
    conn.close()
    return {"status": "updated"}

@router.delete("/{note_id}")
def delete_note(note_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    cursor.execute("DELETE FROM note_tags WHERE note_id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}
