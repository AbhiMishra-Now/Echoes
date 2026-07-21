"""Health route used by deployment probes."""
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/")
async def health_check() -> dict[str, object]:
    """Confirm that the Echoes API process is responsive."""
    return {"status": "Echoes Backend is Magical", "version": "1.0.0", "services": {"database": "configured", "storage": "configured"}}
