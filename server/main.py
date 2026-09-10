from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.db import init_db
from server.routes.lakebase import notes, assistant

app = FastAPI(title="Knowledge Base API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

@app.get("/")
def read_root():
    return {"status": "online", "message": "Knowledge Base API is live and operational"}

app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
