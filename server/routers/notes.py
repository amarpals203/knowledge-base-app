from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_notes():
    return {"status": "ok", "service": "notes"}
