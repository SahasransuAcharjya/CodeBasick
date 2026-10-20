"""Health check router endpoints."""

from fastapi import APIRouter, Depends
from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return application health status and environment details."""
    return HealthResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )
