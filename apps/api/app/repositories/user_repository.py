"""User persistence repository implementations (MongoDB & InMemory)."""

import copy
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database, is_mongodb_available

logger = logging.getLogger("codebasick.user_repository")


def utc_now_iso() -> str:
    """Return current UTC timestamp in ISO format."""
    return datetime.now(timezone.utc).isoformat()


class BaseUserRepository(ABC):
    """Abstract interface for user persistence."""

    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve user by unique user ID."""

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Retrieve user by normalized email."""

    @abstractmethod
    async def get_by_google_sub(self, google_sub: str) -> Optional[Dict[str, Any]]:
        """Retrieve user by stable Google subject identifier."""

    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create and persist a new user record."""

    @abstractmethod
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update existing user record."""


class MongoUserRepository(BaseUserRepository):
    """Production MongoDB Atlas implementation for user storage."""

    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.db = db
        self.collection = db["users"]

    def _clean_doc(self, doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        cleaned = copy.deepcopy(doc)
        cleaned.pop("_id", None)
        return cleaned

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"id": user_id})
        return self._clean_doc(doc)

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"email": email.strip().lower()})
        return self._clean_doc(doc)

    async def get_by_google_sub(self, google_sub: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"google_sub": str(google_sub)})
        return self._clean_doc(doc)

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        data = copy.deepcopy(user_data)
        now = utc_now_iso()
        data.setdefault("created_at", now)
        data.setdefault("updated_at", now)
        data["email"] = data["email"].strip().lower()

        insert_doc = copy.deepcopy(data)
        await self.collection.insert_one(insert_doc)
        return self._clean_doc(data) or data

    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        clean_updates = copy.deepcopy(updates)
        clean_updates["updated_at"] = utc_now_iso()

        result = await self.collection.find_one_and_update(
            {"id": user_id},
            {"$set": clean_updates},
            return_document=True,
        )
        return self._clean_doc(result)


class InMemoryUserRepository(BaseUserRepository):
    """In-memory user store for unit tests or offline fallback."""

    def __init__(self) -> None:
        self._users_by_id: Dict[str, Dict[str, Any]] = {}
        self._users_by_email: Dict[str, str] = {}
        self._users_by_google_sub: Dict[str, str] = {}

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        user = self._users_by_id.get(user_id)
        return copy.deepcopy(user) if user else None

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        uid = self._users_by_email.get(email.strip().lower())
        if not uid:
            return None
        return copy.deepcopy(self._users_by_id.get(uid))

    async def get_by_google_sub(self, google_sub: str) -> Optional[Dict[str, Any]]:
        uid = self._users_by_google_sub.get(str(google_sub))
        if not uid:
            return None
        return copy.deepcopy(self._users_by_id.get(uid))

    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        data = copy.deepcopy(user_data)
        now = utc_now_iso()
        data.setdefault("created_at", now)
        data.setdefault("updated_at", now)
        norm_email = data["email"].strip().lower()
        data["email"] = norm_email

        uid = data["id"]
        self._users_by_id[uid] = data
        self._users_by_email[norm_email] = uid
        if "google_sub" in data and data["google_sub"]:
            self._users_by_google_sub[str(data["google_sub"])] = uid

        return copy.deepcopy(data)

    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        user = self._users_by_id.get(user_id)
        if not user:
            return None
        user.update(copy.deepcopy(updates))
        user["updated_at"] = utc_now_iso()
        if "email" in updates:
            user["email"] = updates["email"].strip().lower()
            self._users_by_email[user["email"]] = user_id
        if "google_sub" in updates and updates["google_sub"]:
            self._users_by_google_sub[str(updates["google_sub"])] = user_id
        return copy.deepcopy(user)

    def clear(self) -> None:
        """Clear memory cache for test isolation."""
        self._users_by_id.clear()
        self._users_by_email.clear()
        self._users_by_google_sub.clear()


# Global in-memory fallback instance
in_memory_user_repo = InMemoryUserRepository()


def get_user_repository() -> BaseUserRepository:
    """Dependency provider for user repository."""
    if is_mongodb_available():
        db = get_database()
        if db is not None:
            return MongoUserRepository(db)
    return in_memory_user_repo
