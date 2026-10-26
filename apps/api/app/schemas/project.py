"""Pydantic schemas and validators for project and file persistence."""

import re
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

VALID_LANGUAGES = ("c", "python", "javascript", "html-css")
FILENAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-\. ]+$")


def validate_filename_security(name: str) -> str:
    """Ensure filenames are safe, prevent path traversal and illegal characters."""
    clean = name.strip()
    if not clean:
        raise ValueError("Filename cannot be empty or purely whitespace.")
    if len(clean) > 255:
        raise ValueError("Filename exceeds maximum length of 255 characters.")
    if ".." in clean:
        raise ValueError("Path traversal sequences ('..') are strictly prohibited in filenames.")
    if "/" in clean or "\\" in clean:
        raise ValueError("Direct directory separators ('/' or '\\') are not permitted in filenames.")
    if "\x00" in clean:
        raise ValueError("Null bytes are forbidden in filenames.")
    if not FILENAME_REGEX.match(clean):
        raise ValueError("Filename contains prohibited characters. Use letters, numbers, hyphens, and periods.")
    return clean


class ProjectFile(BaseModel):
    """Domain model and schema for an individual file within a project."""

    id: str = Field(..., description="Unique file identifier.")
    name: str = Field(..., description="Filename including extension.")
    language: str = Field(..., description="Programming language.")
    content: str = Field(default="", description="Source code content (max 64 KB).")
    path: str = Field(default="", description="Relative file path.")
    is_entry: bool = Field(default=False, description="Whether this file is the main entry point.")
    created_at: str = Field(..., description="ISO creation timestamp.")
    updated_at: str = Field(..., description="ISO last-updated timestamp.")

    @field_validator("name", mode="after")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_filename_security(v)

    @field_validator("content", mode="after")
    @classmethod
    def validate_content_size(cls, v: str) -> str:
        size_bytes = len(v.encode("utf-8"))
        if size_bytes > 65536:
            raise ValueError(f"File content ({size_bytes} bytes) exceeds maximum limit of 65536 bytes (64 KB).")
        return v


class FileCreateRequest(BaseModel):
    """Payload to create a new file in a project."""

    name: str = Field(..., description="Name for the new file.")
    language: Optional[str] = Field(None, description="Language mode; auto-detected from extension if omitted.")
    content: Optional[str] = Field(default="", description="Initial file content.")
    is_entry: Optional[bool] = Field(default=False, description="Whether this is the entry point.")

    @field_validator("name", mode="after")
    @classmethod
    def validate_name(cls, v: str) -> str:
        return validate_filename_security(v)

    @field_validator("content", mode="after")
    @classmethod
    def validate_content(cls, v: Optional[str]) -> str:
        val = v or ""
        size_bytes = len(val.encode("utf-8"))
        if size_bytes > 65536:
            raise ValueError(f"File content ({size_bytes} bytes) exceeds maximum limit of 65536 bytes (64 KB).")
        return val


class FileUpdateRequest(BaseModel):
    """Payload to update an existing file."""

    name: Optional[str] = Field(None, description="Optional new name for the file.")
    content: Optional[str] = Field(None, description="Updated source code content.")

    @field_validator("name", mode="after")
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return validate_filename_security(v)
        return v

    @field_validator("content", mode="after")
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            size_bytes = len(v.encode("utf-8"))
            if size_bytes > 65536:
                raise ValueError(f"File content ({size_bytes} bytes) exceeds maximum limit of 65536 bytes (64 KB).")
        return v


class ProjectCreateRequest(BaseModel):
    """Payload for creating a new project."""

    name: str = Field(..., min_length=1, max_length=100, description="Project name.")
    language: str = Field(..., description="Primary language ('c' or 'python').")
    description: Optional[str] = Field(default="", max_length=500, description="Optional description.")
    files: Optional[List[FileCreateRequest]] = Field(default=None, description="Optional initial files.")

    @field_validator("name", mode="after")
    @classmethod
    def validate_project_name(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Project name cannot be empty or whitespace.")
        if any(ord(c) < 32 for c in clean):
            raise ValueError("Project name cannot contain control characters.")
        return clean

    @field_validator("language", mode="after")
    @classmethod
    def validate_language(cls, v: str) -> str:
        norm = v.strip().lower()
        if norm not in VALID_LANGUAGES:
            raise ValueError(f"Language '{v}' is not supported. Supported: {', '.join(VALID_LANGUAGES)}.")
        return norm

    @model_validator(mode="after")
    def validate_unique_filenames(self) -> "ProjectCreateRequest":
        if self.files:
            names = [f.name.lower() for f in self.files]
            if len(names) != len(set(names)):
                raise ValueError("Project cannot contain files with duplicate names.")
            if len(self.files) > 25:
                raise ValueError("Project exceeds maximum limit of 25 files.")
        return self


class ProjectUpdateRequest(BaseModel):
    """Payload for updating project metadata and/or full file set."""

    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated project name.")
    description: Optional[str] = Field(None, max_length=500, description="Updated description.")
    language: Optional[str] = Field(None, description="Updated primary language.")
    active_file_id: Optional[str] = Field(None, description="Active editor file ID.")
    open_file_ids: Optional[List[str]] = Field(None, description="Open tab file IDs.")
    files: Optional[List[ProjectFile]] = Field(None, description="Full file list for project sync.")

    @field_validator("name", mode="after")
    @classmethod
    def validate_project_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip()
            if not clean:
                raise ValueError("Project name cannot be empty or whitespace.")
            if any(ord(c) < 32 for c in clean):
                raise ValueError("Project name cannot contain control characters.")
            return clean
        return v

    @field_validator("language", mode="after")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            norm = v.strip().lower()
            if norm not in VALID_LANGUAGES:
                raise ValueError(f"Language '{v}' is not supported.")
            return norm
        return v

    @model_validator(mode="after")
    def validate_files_set(self) -> "ProjectUpdateRequest":
        if self.files is not None:
            names = [f.name.lower() for f in self.files]
            if len(names) != len(set(names)):
                raise ValueError("Project cannot contain files with duplicate names.")
            if len(self.files) > 25:
                raise ValueError("Project exceeds maximum limit of 25 files.")
        return self


class ProjectSummaryResponse(BaseModel):
    """Compact summary of a project for listing."""

    id: str
    name: str
    description: str
    language: str
    created_at: str
    updated_at: str
    file_count: int


class ProjectResponse(BaseModel):
    """Detailed response for a single project including all files."""

    id: str
    owner_id: str
    name: str
    description: str
    language: str
    created_at: str
    updated_at: str
    file_count: int
    files: List[ProjectFile]
    active_file_id: Optional[str] = None
    open_file_ids: List[str] = Field(default_factory=list)


class ProjectListResponse(BaseModel):
    """Paginated list of projects."""

    items: List[ProjectSummaryResponse]
    total: int
    limit: int
    offset: int
