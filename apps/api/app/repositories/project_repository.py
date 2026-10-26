"""Project and file persistence repository implementations (MongoDB & InMemory)."""

import copy
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import DESCENDING

from app.db.mongodb import get_database, is_mongodb_available

logger = logging.getLogger("codebasick.repository")


def utc_now_iso() -> str:
    """Return current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


class BaseProjectRepository(ABC):
    """Abstract interface for project and file persistence."""

    @abstractmethod
    async def list_projects(
        self, owner_id: str, limit: int = 50, offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """List project summaries owned by owner_id with total count."""

    @abstractmethod
    async def get_project(self, owner_id: str, project_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve full project details and files for a specific owner."""

    @abstractmethod
    async def create_project(self, owner_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create and persist a new project."""

    @abstractmethod
    async def update_project(
        self, owner_id: str, project_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update project metadata or full files set."""

    @abstractmethod
    async def delete_project(self, owner_id: str, project_id: str) -> bool:
        """Delete a project and its associated files."""

    @abstractmethod
    async def add_file(
        self, owner_id: str, project_id: str, file_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Add a new file to an existing project."""

    @abstractmethod
    async def update_file(
        self, owner_id: str, project_id: str, file_id: str, file_updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update an individual file in a project."""

    @abstractmethod
    async def delete_file(self, owner_id: str, project_id: str, file_id: str) -> bool:
        """Remove a file from a project."""


class MongoProjectRepository(BaseProjectRepository):
    """Production MongoDB Atlas implementation using Motor async client."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.collection = db["projects"]

    def _clean_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Strip MongoDB internal _id before returning domain dict."""
        if not doc:
            return None
        cleaned = copy.deepcopy(doc)
        cleaned.pop("_id", None)
        return cleaned

    async def list_projects(
        self, owner_id: str, limit: int = 50, offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        filter_q = {"owner_id": owner_id}
        total = await self.collection.count_documents(filter_q)
        cursor = (
            self.collection.find(filter_q, {"files": 0, "_id": 0})
            .sort("updated_at", DESCENDING)
            .skip(offset)
            .limit(limit)
        )
        items = await cursor.to_list(length=limit)
        return items, total

    async def get_project(self, owner_id: str, project_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"id": project_id, "owner_id": owner_id})
        return self._clean_doc(doc)

    async def create_project(self, owner_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        data = copy.deepcopy(project_data)
        data["owner_id"] = owner_id
        if "created_at" not in data:
            data["created_at"] = utc_now_iso()
        data["updated_at"] = utc_now_iso()
        data["file_count"] = len(data.get("files", []))

        await self.collection.insert_one(data)
        return self._clean_doc(data) or data

    async def update_project(
        self, owner_id: str, project_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        updates = copy.deepcopy(update_data)
        updates["updated_at"] = utc_now_iso()
        if "files" in updates:
            updates["file_count"] = len(updates["files"])

        result = await self.collection.find_one_and_update(
            {"id": project_id, "owner_id": owner_id},
            {"$set": updates},
            return_document=True,
        )
        return self._clean_doc(result)

    async def delete_project(self, owner_id: str, project_id: str) -> bool:
        res = await self.collection.delete_one({"id": project_id, "owner_id": owner_id})
        return res.deleted_count > 0

    async def add_file(
        self, owner_id: str, project_id: str, file_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        proj = await self.get_project(owner_id, project_id)
        if not proj:
            return None

        files = proj.get("files", [])
        # Check duplicate
        if any(f["name"].lower() == file_data["name"].lower() for f in files):
            raise ValueError(f"A file named '{file_data['name']}' already exists in this project.")

        files.append(file_data)
        now = utc_now_iso()
        await self.collection.update_one(
            {"id": project_id, "owner_id": owner_id},
            {
                "$set": {
                    "files": files,
                    "file_count": len(files),
                    "updated_at": now,
                }
            },
        )
        return file_data

    async def update_file(
        self, owner_id: str, project_id: str, file_id: str, file_updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        proj = await self.get_project(owner_id, project_id)
        if not proj:
            return None

        files = proj.get("files", [])
        target_idx = next((i for i, f in enumerate(files) if f["id"] == file_id), None)
        if target_idx is None:
            return None

        target = copy.deepcopy(files[target_idx])
        if "name" in file_updates and file_updates["name"] is not None:
            new_name = file_updates["name"]
            if any(f["name"].lower() == new_name.lower() and f["id"] != file_id for f in files):
                raise ValueError(f"A file named '{new_name}' already exists in this project.")
            target["name"] = new_name
            target["path"] = new_name

        if "content" in file_updates and file_updates["content"] is not None:
            target["content"] = file_updates["content"]

        target["updated_at"] = utc_now_iso()
        files[target_idx] = target

        now = utc_now_iso()
        await self.collection.update_one(
            {"id": project_id, "owner_id": owner_id},
            {
                "$set": {
                    "files": files,
                    "updated_at": now,
                }
            },
        )
        return target

    async def delete_file(self, owner_id: str, project_id: str, file_id: str) -> bool:
        proj = await self.get_project(owner_id, project_id)
        if not proj:
            return False

        files = proj.get("files", [])
        remaining = [f for f in files if f["id"] != file_id]
        if len(remaining) == len(files):
            return False

        now = utc_now_iso()
        await self.collection.update_one(
            {"id": project_id, "owner_id": owner_id},
            {
                "$set": {
                    "files": remaining,
                    "file_count": len(remaining),
                    "updated_at": now,
                }
            },
        )
        return True


class InMemoryProjectRepository(BaseProjectRepository):
    """In-memory repository used for test isolation and unconfigured fallback."""

    def __init__(self) -> None:
        # Key: (owner_id, project_id) -> project dict
        self._storage: Dict[Tuple[str, str], Dict[str, Any]] = {}

    def clear(self) -> None:
        """Clear all in-memory data (for testing isolation)."""
        self._storage.clear()

    async def list_projects(
        self, owner_id: str, limit: int = 50, offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        owner_projects = [
            {
                "id": p["id"],
                "name": p["name"],
                "description": p.get("description", ""),
                "language": p["language"],
                "created_at": p["created_at"],
                "updated_at": p["updated_at"],
                "file_count": p.get("file_count", len(p.get("files", []))),
            }
            for (o, _), p in self._storage.items()
            if o == owner_id
        ]
        # Sort descending by updated_at
        owner_projects.sort(key=lambda x: x["updated_at"], reverse=True)
        total = len(owner_projects)
        paginated = owner_projects[offset : offset + limit]
        return copy.deepcopy(paginated), total

    async def get_project(self, owner_id: str, project_id: str) -> Optional[Dict[str, Any]]:
        proj = self._storage.get((owner_id, project_id))
        return copy.deepcopy(proj) if proj else None

    async def create_project(self, owner_id: str, project_data: Dict[str, Any]) -> Dict[str, Any]:
        data = copy.deepcopy(project_data)
        data["owner_id"] = owner_id
        if "created_at" not in data:
            data["created_at"] = utc_now_iso()
        data["updated_at"] = utc_now_iso()
        data["file_count"] = len(data.get("files", []))

        key = (owner_id, data["id"])
        self._storage[key] = data
        return copy.deepcopy(data)

    async def update_project(
        self, owner_id: str, project_id: str, update_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        key = (owner_id, project_id)
        proj = self._storage.get(key)
        if not proj:
            return None

        updated = copy.deepcopy(proj)
        for k, v in update_data.items():
            if v is not None:
                updated[k] = copy.deepcopy(v)

        updated["updated_at"] = utc_now_iso()
        if "files" in updated:
            updated["file_count"] = len(updated["files"])

        self._storage[key] = updated
        return copy.deepcopy(updated)

    async def delete_project(self, owner_id: str, project_id: str) -> bool:
        key = (owner_id, project_id)
        if key in self._storage:
            del self._storage[key]
            return True
        return False

    async def add_file(
        self, owner_id: str, project_id: str, file_data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        key = (owner_id, project_id)
        proj = self._storage.get(key)
        if not proj:
            return None

        files = proj.get("files", [])
        if any(f["name"].lower() == file_data["name"].lower() for f in files):
            raise ValueError(f"A file named '{file_data['name']}' already exists in this project.")

        files.append(copy.deepcopy(file_data))
        proj["file_count"] = len(files)
        proj["updated_at"] = utc_now_iso()
        return copy.deepcopy(file_data)

    async def update_file(
        self, owner_id: str, project_id: str, file_id: str, file_updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        key = (owner_id, project_id)
        proj = self._storage.get(key)
        if not proj:
            return None

        files = proj.get("files", [])
        target_idx = next((i for i, f in enumerate(files) if f["id"] == file_id), None)
        if target_idx is None:
            return None

        target = copy.deepcopy(files[target_idx])
        if "name" in file_updates and file_updates["name"] is not None:
            new_name = file_updates["name"]
            if any(f["name"].lower() == new_name.lower() and f["id"] != file_id for f in files):
                raise ValueError(f"A file named '{new_name}' already exists in this project.")
            target["name"] = new_name
            target["path"] = new_name

        if "content" in file_updates and file_updates["content"] is not None:
            target["content"] = file_updates["content"]

        target["updated_at"] = utc_now_iso()
        files[target_idx] = target
        proj["updated_at"] = utc_now_iso()
        return copy.deepcopy(target)

    async def delete_file(self, owner_id: str, project_id: str, file_id: str) -> bool:
        key = (owner_id, project_id)
        proj = self._storage.get(key)
        if not proj:
            return False

        files = proj.get("files", [])
        remaining = [f for f in files if f["id"] != file_id]
        if len(remaining) == len(files):
            return False

        proj["files"] = remaining
        proj["file_count"] = len(remaining)
        proj["updated_at"] = utc_now_iso()
        return True


# Global fallback in-memory repository instance
in_memory_repository = InMemoryProjectRepository()


def get_project_repository() -> BaseProjectRepository:
    """Dependency injector for active project repository."""
    if is_mongodb_available():
        db = get_database()
        if db is not None:
            return MongoProjectRepository(db)
    return in_memory_repository
