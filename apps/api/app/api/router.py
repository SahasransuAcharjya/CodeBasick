"""Central API router assembling all versioned sub-routers."""

from fastapi import APIRouter
from app.api.routes.ai import router as ai_router
from app.api.routes.execution import router as execution_router
from app.api.routes.health import router as health_router
from app.api.routes.projects import router as projects_router

api_router = APIRouter()

# Register health & readiness routes under /health prefix
api_router.include_router(health_router)

# Register remote code execution routes under /execute prefix
api_router.include_router(execution_router)

# Register Gemini AI tutoring routes under /ai prefix
api_router.include_router(ai_router)

# Register project & file storage routes under /projects prefix
api_router.include_router(projects_router)


