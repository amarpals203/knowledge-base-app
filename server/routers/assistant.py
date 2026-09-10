from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_assistant():
    return {"status": "ok", "service": "assistant"}
