"""Pydantic schemas for code execution requests and responses."""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, model_validator


class SourceFile(BaseModel):
    """Represents a source file in a project."""

    name: str = Field(..., min_length=1, max_length=255, description="Filename including extension")
    content: str = Field(..., description="Source code text content")


class ExecuteRequest(BaseModel):
    """Validated code execution request payload."""

    language: str = Field(
        ...,
        description="Programming language identifier. Supported: 'c', 'python'",
        examples=["c", "python"],
    )
    code: Optional[str] = Field(
        None,
        description="Source code string for single-file execution",
    )
    filename: Optional[str] = Field(
        None,
        description="Optional name of the entrypoint file (e.g. main.c or main.py)",
    )
    stdin: Optional[str] = Field(
        None,
        description="Standard input passed to the program during execution",
    )
    files: Optional[List[SourceFile]] = Field(
        None,
        description="List of project files for multi-file execution",
    )

    @model_validator(mode="after")
    def validate_request_payload(self) -> "ExecuteRequest":
        """Validate language, file contents, and total size constraints."""
        # 1. Normalize and validate language
        norm_lang = self.language.strip().lower()
        if norm_lang not in ("c", "python"):
            raise ValueError(
                f"Unsupported language: '{self.language}'. Only 'c' and 'python' are supported."
            )
        self.language = norm_lang

        # 2. Ensure either code or files is provided
        has_code = bool(self.code and self.code.strip())
        has_files = bool(self.files and any(f.content.strip() for f in self.files))

        if not has_code and not has_files:
            raise ValueError("Execution request must include non-empty 'code' or at least one non-empty file in 'files'.")

        # 3. Assemble and validate total file size (limit: 65,536 bytes)
        total_size = 0
        if self.code:
            total_size += len(self.code.encode("utf-8"))
        if self.files:
            for f in self.files:
                total_size += len(f.content.encode("utf-8"))

        max_size = 65536  # 64 KB safety limit
        if total_size > max_size:
            raise ValueError(
                f"Source code payload size ({total_size} bytes) exceeds maximum limit of {max_size} bytes (64 KB)."
            )

        return self


class ExecuteResponse(BaseModel):
    """Standardized response from code execution service."""

    stdout: Optional[str] = Field(None, description="Standard output from execution")
    stderr: Optional[str] = Field(None, description="Standard error / compiler output")
    exception: Optional[str] = Field(None, description="Runtime exception or timeout message")
    status: Literal["success", "failed", "error", "timeout", "unconfigured"] = Field(
        ...,
        description="Execution status outcome",
    )
    executionTime: Optional[int] = Field(None, description="Execution duration in milliseconds")
    compilationTime: Optional[int] = Field(None, description="Compilation duration in milliseconds (C only)")
    memoryUsed: Optional[int] = Field(None, description="Memory used in kilobytes")
    language: str = Field(..., description="Language executed")
    message: Optional[str] = Field(None, description="Human-readable informational message or status note")
