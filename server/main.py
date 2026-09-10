from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.db import init_db
from server.routes.lakebase.notes import router as notes_router
from server.routes.lakebase.assistant import router as assistant_router

init_db()

app = FastAPI(title="Knowledge Base Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notes_router, prefix="/api")
app.include_router(assistant_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running successfully"}
