"""API routes for remote code compilation and execution."""

import logging
from fastapi import APIRouter, Depends, status

from app.schemas.execution import ExecuteRequest, ExecuteResponse
from app.services.onecompiler import OneCompilerService, get_onecompiler_service

logger = logging.getLogger("codebasick.routes.execution")

router = APIRouter(prefix="/execute", tags=["Code Execution"])


@router.post(
    "",
    response_model=ExecuteResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Code via OneCompiler",
    description=(
        "Compile and execute source code in an isolated OneCompiler cloud sandbox. "
        "Supports C ('c') and Python ('python'). Code is never executed directly on the host API server."
    ),
)
async def execute_code(
    request: ExecuteRequest,
    service: OneCompilerService = Depends(get_onecompiler_service),
) -> ExecuteResponse:
    """Submit source code for compilation and execution.

    Args:
        request: Validated execution request containing language and code or files.
        service: Injected OneCompilerService client.

    Returns:
        ExecuteResponse containing stdout, stderr, exception, and performance metrics.
    """
    return await service.execute_code(request)
