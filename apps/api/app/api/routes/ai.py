"""API routes for Gemini AI educational tutoring (pseudocode & line-by-line explanations)."""

import logging
from fastapi import APIRouter, Depends, status

from app.schemas.ai import (
    ExplainRequest,
    ExplainResponse,
    PseudocodeRequest,
    PseudocodeResponse,
)
from app.services.gemini import GeminiService, get_gemini_service

logger = logging.getLogger("codebasick.routes.ai")

router = APIRouter(prefix="/ai", tags=["AI Tutor"])


@router.post(
    "/pseudocode",
    response_model=PseudocodeResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Beginner-Friendly Pseudocode",
    description=(
        "Translate active C or Python source code into clear, beginner-friendly pseudocode "
        "and discrete logical steps using Google Gemini. Untrusted user code is strictly analyzed "
        "as passive data and never executed."
    ),
)
async def generate_pseudocode(
    request: PseudocodeRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> PseudocodeResponse:
    """Generate pseudocode and logical steps from source code.

    Args:
        request: Validated pseudocode request containing language and source code.
        service: Injected GeminiService instance.

    Returns:
        PseudocodeResponse with high-level summary, formatted pseudocode, and ordered steps.
    """
    logger.info("Generating pseudocode for language: %s (code size: %d bytes)", request.language, len(request.code.encode("utf-8")))
    return await service.generate_pseudocode(request)


@router.post(
    "/explain",
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate Line-by-Line Code Explanation",
    description=(
        "Generate a structured line-by-line explanation of active C or Python source code "
        "using Google Gemini. Preserves exact line-number correspondence with the original code, "
        "identifies concepts, and clarifies runtime caveats."
    ),
)
async def explain_code(
    request: ExplainRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> ExplainResponse:
    """Generate line-by-line explanations and pedagogical caveats from source code.

    Args:
        request: Validated explanation request containing language and source code.
        service: Injected GeminiService instance.

    Returns:
        ExplainResponse with overall summary and structured line-by-line breakdown.
    """
    logger.info("Generating code explanation for language: %s (code size: %d bytes)", request.language, len(request.code.encode("utf-8")))
    return await service.generate_explanation(request)
