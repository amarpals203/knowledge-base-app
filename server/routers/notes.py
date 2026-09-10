from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sqlite3

router = APIRouter()
DB_PATH = "lakebase.db"

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""
    tags: Optional[str] = ""
    priority: Optional[str] = "Medium"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/")
def list_notes():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, content, tags, priority, created_at FROM notes ORDER BY id DESC")
    notes = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notes

@router.post("/")
def create_note(note: NoteCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO notes (title, content, tags, priority) VALUES (?, ?, ?, ?)",
        (note.title, note.content, note.tags, note.priority)
    )
    conn.commit()
    note_id = cursor.lastrowid
    conn.close()
    return {"id": note_id, **note.model_dump()}

@router.delete("/{note_id}")
def delete_note(note_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
    return {"message": "Note deleted"}
