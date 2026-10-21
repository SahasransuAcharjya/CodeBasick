"""Pydantic schemas for Gemini AI tutoring endpoints."""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class PseudocodeRequest(BaseModel):
    """Request payload for generating beginner-friendly pseudocode."""

    language: Literal["c", "python"] = Field(
        ...,
        description="Programming language of the source code ('c' or 'python').",
    )
    code: str = Field(
        ...,
        description="Source code to translate into pseudocode (max 64 KB).",
    )
    filename: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional source filename (e.g. 'main.py' or 'main.c').",
    )

    @model_validator(mode="after")
    def validate_code_payload(self) -> "PseudocodeRequest":
        """Validate non-empty code and enforce maximum payload size."""
        trimmed = self.code.strip()
        if not trimmed:
            raise ValueError("Source code must not be empty or purely whitespace.")

        code_bytes = len(self.code.encode("utf-8"))
        max_size = 65536  # 64 KB limit
        if code_bytes > max_size:
            raise ValueError(
                f"Source code payload size ({code_bytes} bytes) exceeds maximum limit of {max_size} bytes (64 KB)."
            )

        return self


class PseudocodeStep(BaseModel):
    """A discrete logical step in the generated pseudocode."""

    step_number: int = Field(..., description="1-indexed sequence number of this logical step.")
    label: str = Field(..., description="Short category or action title (e.g. 'Variable Initialization', 'Loop', 'Output').")
    description: str = Field(..., description="Plain, beginner-friendly description of what happens in this step.")
    line_reference: Optional[str] = Field(None, description="Corresponding source line or line range, e.g. 'Line 3' or 'Lines 5-8'.")


class PseudocodeResponse(BaseModel):
    """Structured response containing beginner-friendly pseudocode."""

    language: str = Field(..., description="Programming language analyzed.")
    summary: str = Field(..., description="Concise 1-2 sentence overview of what the program accomplishes.")
    pseudocode: str = Field(..., description="Clean, indented, plain-English pseudocode representation.")
    steps: List[PseudocodeStep] = Field(default_factory=list, description="Ordered breakdown of logical steps.")
    limitations: Optional[str] = Field(None, description="Notes on incomplete constructs, syntax issues, or assumptions.")
    is_incomplete: bool = Field(False, description="True if the submitted code was partial or contains syntax errors.")
    model: str = Field(..., description="Gemini model identifier used for generation.")


class ExplainRequest(BaseModel):
    """Request payload for generating line-by-line program explanations."""

    language: Literal["c", "python"] = Field(
        ...,
        description="Programming language of the source code ('c' or 'python').",
    )
    code: str = Field(
        ...,
        description="Source code to explain line-by-line (max 64 KB).",
    )
    filename: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional source filename (e.g. 'main.py' or 'main.c').",
    )

    @model_validator(mode="after")
    def validate_code_payload(self) -> "ExplainRequest":
        """Validate non-empty code and enforce maximum payload size."""
        trimmed = self.code.strip()
        if not trimmed:
            raise ValueError("Source code must not be empty or purely whitespace.")

        code_bytes = len(self.code.encode("utf-8"))
        max_size = 65536  # 64 KB limit
        if code_bytes > max_size:
            raise ValueError(
                f"Source code payload size ({code_bytes} bytes) exceeds maximum limit of {max_size} bytes (64 KB)."
            )

        return self


class LineExplanationItem(BaseModel):
    """Structured explanation for a single line or statement in the source code."""

    line_number: int = Field(..., description="1-indexed line number corresponding to original source.")
    code: str = Field(..., description="Original line of code as submitted.")
    explanation: str = Field(..., description="Clear, beginner-friendly explanation of the statement's purpose and behavior.")
    concepts: List[str] = Field(default_factory=list, description="Key concepts introduced or used (e.g. 'Function Declaration', 'Condition').")
    caveats: Optional[str] = Field(None, description="Runtime caveats, edge cases, or potential pitfalls for this line.")


class ExplainResponse(BaseModel):
    """Structured response containing line-by-line code explanations."""

    language: str = Field(..., description="Programming language analyzed.")
    overview: str = Field(..., description="Concise overview of the program's purpose and structure.")
    explanations: List[LineExplanationItem] = Field(..., description="Structured line-by-line explanation entries.")
    caveats: Optional[str] = Field(None, description="Program-wide caveats, input requirements, or runtime edge cases.")
    disclaimer: str = Field(
        default="AI-generated explanations are educational guides and may contain inaccuracies. Always verify against compiler diagnostics.",
        description="Clear distinction between AI interpretation and compiler-verified facts.",
    )
    is_incomplete: bool = Field(False, description="True if the submitted code was partial or contains syntax errors.")
    model: str = Field(..., description="Gemini model identifier used for generation.")
