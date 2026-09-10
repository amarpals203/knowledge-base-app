from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from server.routes.lakebase import notes, assistant

app = FastAPI(title="Knowledge Base API")

# Allow Netlify and Localhost origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root health check endpoint
@app.get("/")
def read_root():
    return {"status": "online", "message": "Knowledge Base API is live and operational"}

# Mount the real route handlers
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])

# If lakebase todos router exists, include it as well
try:
    from server.routes.lakebase import todos
    app.include_router(todos.router, prefix="/api/lakebase/todos", tags=["todos"])
except (ImportError, AttributeError):
    pass
