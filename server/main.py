from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.database import init_db
from server.routers import notes, tags, timer, assistant

app = FastAPI(title="Knowledge Base API")

# Allow Netlify and Localhost origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database tables
init_db()

# Root health check endpoint
@app.get("/")
def read_root():
    return {"status": "online", "message": "Knowledge Base API is live and operational"}

# Include routers
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(timer.router, prefix="/api/timer", tags=["timer"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])
