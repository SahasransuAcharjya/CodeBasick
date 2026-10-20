"""Health and readiness response schemas."""

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Liveness check response confirming process execution."""

    status: str = Field(default="ok", description="Process liveness status")
    app: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Deployment environment")


class ReadinessResponse(BaseModel):
    """Readiness check response confirming required components are operational."""

    status: str = Field(default="ready", description="Readiness status")
    app: str = Field(..., description="Application name")
    version: str = Field(..., description="Application version")
    environment: str = Field(..., description="Deployment environment")
    components: Dict[str, str] = Field(
        default_factory=lambda: {"api": "operational"},
        description="Readiness status of required subsystems (external integrations like MongoDB, Gemini, Judge0 are not attached in this phase)",
    )


class ErrorResponse(BaseModel):
    """Standardized error response schema."""

    error: str = Field(..., description="High-level error classification")
    message: Optional[str] = Field(default=None, description="Safe descriptive message for clients")
    details: Optional[Any] = Field(default=None, description="Optional structured validation details")
