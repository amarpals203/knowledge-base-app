from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_tags():
    return {"status": "ok", "service": "tags"}
