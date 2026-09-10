import re
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from server.db import get_connection

router = APIRouter(prefix="/assistant", tags=["assistant"])

class AssistantQuery(BaseModel):
    query: str

@router.post("/chat")
def chat_with_rag(payload: AssistantQuery):
    q = payload.query.strip().lower()

    if any(w in q for w in ["time", "date", "clock"]):
        now = datetime.now().strftime("%A, %B %d, %Y at %I:%M %p")
        return {"reply": f"The current system time is {now}.", "context": None}

    conn = get_connection()
    cursor = conn.cursor()

    if any(phrase in q for phrase in ["all notes", "my notes", "list notes", "show notes", "what notes"]):
        cursor.execute("SELECT id, title, content, priority FROM notes ORDER BY id DESC LIMIT 10")
        notes = cursor.fetchall()
        conn.close()
        if not notes:
            return {"reply": "You don't have any notes saved yet.", "context": None}
        note_list_text = "\n".join([f"- **{n['title']}** (Priority: {n['priority']}): {n['content']}" for n in notes])
        return {
            "reply": f"Here are your notes:\n\n{note_list_text}",
            "context": "\n".join([f"[{n['title']}]: {n['content']}" for n in notes])
        }

    words = [re.sub(r'[^a-zA-Z0-9]', '', w) for w in q.split()]
    stop_words = {"what", "is", "the", "a", "an", "give", "me", "my", "about", "show", "tell", "in", "to", "for", "of"}
    search_terms = [w for w in words if w and w not in stop_words]
    if not search_terms:
        search_terms = [w for w in words if w]

    if not search_terms:
        conn.close()
        return {"reply": "Please ask a specific question or specify a search term about your notes.", "context": None}

    where_clauses = " OR ".join(["LOWER(title) LIKE ? OR LOWER(content) LIKE ?" for _ in search_terms])
    params = []
    for term in search_terms:
        params.extend([f"%{term}%", f"%{term}%"])

    cursor.execute(f"SELECT id, title, content, priority FROM notes WHERE {where_clauses} LIMIT 5", params)
    retrieved = cursor.fetchall()
    conn.close()

    if not retrieved:
        return {
            "reply": f"I couldn't find any notes matching '{payload.query}'. Try creating a note with relevant keywords or ask 'give me my notes'.",
            "context": None
        }

    found_titles = ", ".join([f"'{doc['title']}'" for doc in retrieved])
    context_docs = "\n\n".join([f"Note [{doc['title']}] (Priority: {doc['priority']}):\n{doc['content']}" for doc in retrieved])

    return {
        "reply": f"Found {len(retrieved)} relevant note(s): {found_titles}.",
        "context": context_docs
    }
