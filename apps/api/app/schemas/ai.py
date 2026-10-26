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


class DiagnosticItemInput(BaseModel):
    """Structured diagnostic item passed from compiler or linter output."""

    line: Optional[int] = Field(None, description="1-indexed line number if identified")
    column: Optional[int] = Field(None, description="Column number if identified")
    severity: Literal["error", "warning", "info"] = Field("error", description="Severity level")
    message: str = Field(..., description="Compiler or linter diagnostic message")
    source: Optional[str] = Field(None, description="Source filename or compiler tool")


class DiagnoseErrorRequest(BaseModel):
    """Request payload for diagnosing compiler errors and runtime exceptions."""

    language: Literal["c", "python"] = Field(
        ...,
        description="Programming language of the source code ('c' or 'python').",
    )
    code: str = Field(
        ...,
        description="Source code containing the error (max 64 KB).",
    )
    error_message: Optional[str] = Field(
        None,
        description="Raw compiler stderr, traceback, or runtime exception output (max 32 KB).",
    )
    error_output: Optional[str] = Field(
        None,
        description="Alternative field name for error_message.",
    )
    filename: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional source filename (e.g. 'main.c' or 'main.py').",
    )
    line_number: Optional[int] = Field(
        None,
        description="Primary line number identified in compiler or runtime error, if known.",
    )
    diagnostics: Optional[List[DiagnosticItemInput]] = Field(
        default=None,
        description="Optional structured compiler diagnostics parsed by frontend.",
    )
    stdin: Optional[str] = Field(
        None,
        description="Optional standard input provided to the program during execution.",
    )

    @model_validator(mode="after")
    def validate_diagnose_payload(self) -> "DiagnoseErrorRequest":
        """Validate non-empty code and error message, and enforce payload size limits."""
        if not self.code or not self.code.strip():
            raise ValueError("Source code must not be empty or purely whitespace.")

        effective_error = self.error_message or self.error_output
        if not effective_error or not effective_error.strip():
            raise ValueError("Error message / compiler output must not be empty.")
        self.error_message = effective_error

        code_bytes = len(self.code.encode("utf-8"))
        if code_bytes > 65536:
            raise ValueError(
                f"Source code payload size ({code_bytes} bytes) exceeds maximum limit of 65536 bytes (64 KB)."
            )

        err_bytes = len(self.error_message.encode("utf-8"))
        if err_bytes > 32768:
            raise ValueError(
                f"Error message payload size ({err_bytes} bytes) exceeds maximum limit of 32768 bytes (32 KB)."
            )

        if self.stdin is not None and len(self.stdin.encode("utf-8")) > 16384:
            raise ValueError("Standard input context exceeds maximum limit of 16384 bytes (16 KB).")

        return self


class DiagnoseErrorResponse(BaseModel):
    """Structured response from Gemini AI Error Doctor."""

    language: str = Field(..., description="Programming language analyzed.")
    error_type: str = Field(
        ...,
        description="Classification (e.g. 'Syntax Error', 'Compilation Error', 'Runtime Exception', 'Type Mismatch').",
    )
    summary: str = Field(..., description="Beginner-friendly explanation of the error in plain English.")
    why_it_happened: str = Field(..., description="Clear explanation of the underlying cause and programming concept.")
    suggested_fix: str = Field(..., description="Concise explanation of the necessary correction.")
    corrected_code: Optional[str] = Field(
        None,
        description="Complete corrected source code ready to be applied to editor, or None if no safe auto-fix is available.",
    )
    changes_summary: List[str] = Field(
        default_factory=list,
        description="Bulleted list of discrete changes made in the corrected code.",
    )
    affected_lines: List[int] = Field(
        default_factory=list,
        description="1-indexed line numbers modified or affected by the correction.",
    )
    confidence: Literal["high", "medium", "low"] = Field(
        "high",
        description="Model confidence indicator based on evidence sufficiency.",
    )
    can_auto_fix: bool = Field(
        True,
        description="Whether a concrete automated code correction is safely available to apply.",
    )
    disclaimer: str = Field(
        default="AI-generated suggestions are educational guides and have not been executed. Always review before applying.",
        description="Safety and educational disclaimer.",
    )
    caveats: Optional[str] = Field(None, description="Any assumptions made or remaining considerations for the student.")
    model: str = Field(..., description="Gemini model identifier used for diagnosis.")


