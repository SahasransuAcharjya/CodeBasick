"""Main application factory and entry point for CodeBasick FastAPI service."""

from typing import Optional
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.api.routes.health import health_check
from app.core.config import Settings, get_settings
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.logging import setup_logging
from app.schemas.health import HealthResponse


def create_app(settings: Optional[Settings] = None) -> FastAPI:
    """Create and configure the FastAPI application instance.

    Args:
        settings: Optional custom Settings instance; defaults to get_settings().

    Returns:
        Configured FastAPI application instance.
    """
    if settings is None:
        settings = get_settings()

    # Configure application logging
    setup_logging(settings)

    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Backend API service for CodeBasick IDE",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Configure restricted CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=settings.ALLOWED_METHODS,
        allow_headers=settings.ALLOWED_HEADERS,
    )

    # Centralized exception handlers
    application.add_exception_handler(AppException, app_exception_handler)
    application.add_exception_handler(
        RequestValidationError, validation_exception_handler
    )
    application.add_exception_handler(Exception, unhandled_exception_handler)

    # Root health probe endpoint (e.g. for external load balancers)
    application.add_api_route(
        "/health",
        health_check,
        methods=["GET"],
        response_model=HealthResponse,
        tags=["Health"],
        summary="Service Liveness Probe",
    )

    # Mount versioned API router under configured prefix (/api/v1)
    application.include_router(api_router, prefix=settings.API_V1_STR)

    # Root metadata endpoint
    @application.get("/", tags=["Root"], summary="API Root Metadata")
    async def root_metadata():
        """Return basic metadata confirming API operational status."""
        return {
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "api_v1": settings.API_V1_STR,
            "status": "running",
            "docs": "/docs",
        }

    return application


app = create_app()
