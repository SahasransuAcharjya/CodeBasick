"""Central API router assembling all versioned sub-routers."""

from fastapi import APIRouter
from app.api.routes.health import router as health_router

api_router = APIRouter()

# Register health & readiness routes under /health prefix
api_router.include_router(health_router)
