"""Health and readiness router endpoints."""

from fastapi import APIRouter, Depends
from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse, ReadinessResponse

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=HealthResponse, summary="Process Health Check")
async def health_check(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return application process status confirming API server is running."""
    return HealthResponse(
        status="ok",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
    )


@router.get("/ready", response_model=ReadinessResponse, summary="Subsystem Readiness Check")
async def readiness_check(settings: Settings = Depends(get_settings)) -> ReadinessResponse:
    """Return whether currently required application components are ready.

    In Phase 2, external services (MongoDB, Gemini, Judge0) are not connected.
    Only internal API subsystems are evaluated.
    """
    return ReadinessResponse(
        status="ready",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        components={"api": "operational"},
    )
