from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def get_timer():
    return {"status": "ok", "service": "timer"}
