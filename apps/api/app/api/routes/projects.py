"""Project and file management REST API endpoints."""

import time
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_owner_id
from app.core.exceptions import NotFoundException, ValidationException
from app.repositories.project_repository import (
    BaseProjectRepository,
    get_project_repository,
    utc_now_iso,
)
from app.schemas.project import (
    FileCreateRequest,
    FileUpdateRequest,
    ProjectCreateRequest,
    ProjectFile,
    ProjectListResponse,
    ProjectResponse,
    ProjectSummaryResponse,
    ProjectUpdateRequest,
)

router = APIRouter(prefix="/projects", tags=["Projects"])

DEFAULT_STARTER_FILES = {
    "python": {
        "filename": "main.py",
        "code": (
            "# CodeBasick - Python Workspace\n"
            "# Beginner-friendly programming environment\n\n"
            "def greet(name: str) -> str:\n"
            '    return f"Hello, {name}! Welcome to CodeBasick."\n\n'
            "def main():\n"
            '    message = greet("Learner")\n'
            "    print(message)\n"
            '    print("Ready to explore algorithms, data structures, and AI assistance.")\n\n'
            'if __name__ == "__main__":\n'
            "    main()\n"
        ),
    },
    "c": {
        "filename": "main.c",
        "code": (
            "// CodeBasick - C Workspace\n"
            "// Beginner-friendly programming environment\n\n"
            "#include <stdio.h>\n\n"
            "int main(void) {\n"
            '    char name[] = "Learner";\n'
            '    printf("Hello, %s! Welcome to CodeBasick.\\n", name);\n'
            '    printf("Ready to explore structured logic and system programming.\\n");\n'
            "    return 0;\n"
            "}\n"
        ),
    },
    "javascript": {
        "filename": "index.js",
        "code": (
            "// CodeBasick - JavaScript Workspace\n"
            "function greet(name) {\n"
            "    return `Hello, ${name}! Welcome to CodeBasick.`;\n"
            "}\n"
            'console.log(greet("Learner"));\n'
        ),
    },
    "html-css": {
        "filename": "index.html",
        "code": (
            "<!DOCTYPE html>\n<html>\n<head>\n"
            "  <title>CodeBasick</title>\n"
            "</head>\n<body>\n  <h1>Hello CodeBasick</h1>\n</body>\n</html>\n"
        ),
    },
}


def generate_unique_id(prefix: str) -> str:
    """Generate a clean URL-friendly unique identifier."""
    ts = hex(int(time.time() * 1000))[2:]
    rand = uuid.uuid4().hex[:6]
    return f"{prefix}_{ts}_{rand}"


def detect_file_language(filename: str, project_language: str) -> str:
    """Infer file language from extension with fallback to project language."""
    lower = filename.lower()
    if lower.endswith(".c") or lower.endswith(".h"):
        return "c"
    if lower.endswith(".py"):
        return "python"
    if lower.endswith(".js") or lower.endswith(".ts"):
        return "javascript"
    if lower.endswith(".html") or lower.endswith(".css"):
        return "html-css"
    return project_language


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create New Project",
    description="Create a persistent project with initial files under the client's ownership scope.",
)
async def create_project(
    payload: ProjectCreateRequest,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> ProjectResponse:
    """Create a new project and initialize starter files."""
    now = utc_now_iso()
    proj_id = generate_unique_id("ws")

    files_list = []
    if payload.files and len(payload.files) > 0:
        for idx, f in enumerate(payload.files):
            file_id = generate_unique_id("file")
            lang = f.language or detect_file_language(f.name, payload.language)
            files_list.append(
                {
                    "id": file_id,
                    "name": f.name,
                    "path": f.name,
                    "language": lang,
                    "content": f.content or "",
                    "is_entry": f.is_entry if f.is_entry is not None else (idx == 0),
                    "created_at": now,
                    "updated_at": now,
                }
            )
    else:
        # Generate default starter file matching project language
        starter = DEFAULT_STARTER_FILES.get(payload.language, DEFAULT_STARTER_FILES["python"])
        file_id = generate_unique_id("file")
        files_list.append(
            {
                "id": file_id,
                "name": starter["filename"],
                "path": starter["filename"],
                "language": payload.language,
                "content": starter["code"],
                "is_entry": True,
                "created_at": now,
                "updated_at": now,
            }
        )

    active_id = files_list[0]["id"]
    project_doc = {
        "id": proj_id,
        "owner_id": owner_id,
        "name": payload.name,
        "description": payload.description or "",
        "language": payload.language,
        "created_at": now,
        "updated_at": now,
        "file_count": len(files_list),
        "files": files_list,
        "active_file_id": active_id,
        "open_file_ids": [active_id],
    }

    created = await repo.create_project(owner_id, project_doc)
    return ProjectResponse(**created)


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List Projects",
    description="Retrieve a paginated list of projects owned by the requesting client.",
)
async def list_projects(
    limit: int = Query(50, ge=1, le=100, description="Page limit."),
    offset: int = Query(0, ge=0, description="Offset index."),
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> ProjectListResponse:
    """List project summaries owned by the current owner."""
    items, total = await repo.list_projects(owner_id, limit=limit, offset=offset)
    summaries = [ProjectSummaryResponse(**item) for item in items]
    return ProjectListResponse(items=summaries, total=total, limit=limit, offset=offset)


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Retrieve Project",
    description="Fetch full project metadata and source files for a specific project.",
)
async def get_project(
    project_id: str,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> ProjectResponse:
    """Retrieve an existing project by ID."""
    proj = await repo.get_project(owner_id, project_id)
    if not proj:
        raise NotFoundException(message=f"Project '{project_id}' not found.")
    return ProjectResponse(**proj)


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update Project",
    description="Update project metadata, active file, or sync the complete files buffer list.",
)
async def update_project(
    project_id: str,
    payload: ProjectUpdateRequest,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> ProjectResponse:
    """Update project details or save file buffers."""
    updates = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.description is not None:
        updates["description"] = payload.description
    if payload.language is not None:
        updates["language"] = payload.language
    if payload.active_file_id is not None:
        updates["active_file_id"] = payload.active_file_id
    if payload.open_file_ids is not None:
        updates["open_file_ids"] = payload.open_file_ids
    if payload.files is not None:
        now = utc_now_iso()
        clean_files = []
        for f in payload.files:
            clean_files.append(
                {
                    "id": f.id,
                    "name": f.name,
                    "path": f.path or f.name,
                    "language": f.language,
                    "content": f.content,
                    "is_entry": f.is_entry,
                    "created_at": f.created_at or now,
                    "updated_at": now,
                }
            )
        updates["files"] = clean_files
        updates["file_count"] = len(clean_files)

    updated = await repo.update_project(owner_id, project_id, updates)
    if not updated:
        raise NotFoundException(message=f"Project '{project_id}' not found.")
    return ProjectResponse(**updated)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Project",
    description="Delete a project and all associated files permanently.",
)
async def delete_project(
    project_id: str,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> dict:
    """Delete a project owned by the current owner."""
    deleted = await repo.delete_project(owner_id, project_id)
    if not deleted:
        raise NotFoundException(message=f"Project '{project_id}' not found.")
    return {"status": "deleted", "id": project_id}


@router.post(
    "/{project_id}/files",
    response_model=ProjectFile,
    status_code=status.HTTP_201_CREATED,
    summary="Add File to Project",
    description="Add a new file to an existing project.",
)
async def add_project_file(
    project_id: str,
    payload: FileCreateRequest,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> ProjectFile:
    """Create a new file inside an existing project."""
    proj = await repo.get_project(owner_id, project_id)
    if not proj:
        raise NotFoundException(message=f"Project '{project_id}' not found.")

    if len(proj.get("files", [])) >= 25:
        raise ValidationException(message="Project exceeds maximum file limit of 25 files.")

    now = utc_now_iso()
    file_id = generate_unique_id("file")
    lang = payload.language or detect_file_language(payload.name, proj["language"])

    new_file_data = {
        "id": file_id,
        "name": payload.name,
        "path": payload.name,
        "language": lang,
        "content": payload.content or "",
        "is_entry": bool(payload.is_entry),
        "created_at": now,
        "updated_at": now,
    }

    try:
        created = await repo.add_file(owner_id, project_id, new_file_data)
        if not created:
            raise NotFoundException(message=f"Project '{project_id}' not found.")
        return ProjectFile(**created)
    except ValueError as ve:
        raise ValidationException(message=str(ve))


@router.put(
    "/{project_id}/files/{file_id}",
    response_model=ProjectFile,
    summary="Update Project File",
    description="Update a specific file's content or rename it.",
)
async def update_project_file(
    project_id: str,
    file_id: str,
    payload: FileUpdateRequest,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> ProjectFile:
    """Update content or name of a single file in a project."""
    updates = {}
    if payload.name is not None:
        updates["name"] = payload.name
    if payload.content is not None:
        updates["content"] = payload.content

    try:
        updated = await repo.update_file(owner_id, project_id, file_id, updates)
        if not updated:
            raise NotFoundException(message=f"File '{file_id}' not found in project '{project_id}'.")
        return ProjectFile(**updated)
    except ValueError as ve:
        raise ValidationException(message=str(ve))


@router.delete(
    "/{project_id}/files/{file_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete Project File",
    description="Delete a file from a project. Projects must maintain at least one file.",
)
async def delete_project_file(
    project_id: str,
    file_id: str,
    owner_id: str = Depends(get_current_owner_id),
    repo: BaseProjectRepository = Depends(get_project_repository),
) -> dict:
    """Delete a file from a project."""
    proj = await repo.get_project(owner_id, project_id)
    if not proj:
        raise NotFoundException(message=f"Project '{project_id}' not found.")

    if len(proj.get("files", [])) <= 1:
        raise ValidationException(message="Cannot delete the only file in a project. At least one file is required.")

    deleted = await repo.delete_file(owner_id, project_id, file_id)
    if not deleted:
        raise NotFoundException(message=f"File '{file_id}' not found in project '{project_id}'.")
    return {"status": "deleted", "file_id": file_id}
