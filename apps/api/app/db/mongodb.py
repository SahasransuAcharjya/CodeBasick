"""MongoDB connection manager and lifecycle handlers using Motor."""

import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, PyMongoError

from app.core.config import Settings, get_settings

logger = logging.getLogger("codebasick.db")


class MongoManager:
    """Manages the application's shared AsyncIOMotorClient instance."""

    def __init__(self) -> None:
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.is_connected: bool = False

    async def connect(self, settings: Settings) -> None:
        """Establish connection to MongoDB and ensure collection indexes."""
        if not settings.MONGODB_URI or not settings.MONGODB_URI.strip():
            logger.info("MONGODB_URI is not configured. Database will run in offline/in-memory mode.")
            self.is_connected = False
            return

        try:
            logger.info("Connecting to MongoDB Atlas...")
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=settings.MONGODB_CONNECT_TIMEOUT_MS,
                appname="CodeBasickIDE",
            )
            # Verify connectivity via ping probe
            await self.client.admin.command("ping")
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB database '%s'.", settings.MONGODB_DB_NAME)

            # Ensure indexes on projects collection
            await self._ensure_indexes()
        except ConnectionFailure as conn_err:
            logger.warning(
                "MongoDB connection failed (server unreachable / timeout): %s. Application will fallback gracefully.",
                conn_err,
            )
            self.is_connected = False
            self.client = None
            self.db = None
        except PyMongoError as mongo_err:
            logger.warning("MongoDB initialization error: %s. Continuing with fallback mode.", mongo_err)
            self.is_connected = False
            self.client = None
            self.db = None
        except Exception as exc:
            logger.error("Unexpected error during MongoDB connection: %s", exc)
            self.is_connected = False
            self.client = None
            self.db = None

    async def _ensure_indexes(self) -> None:
        """Create necessary indexes for high-frequency queries and uniqueness."""
        if self.db is None:
            return
        try:
            projects_col = self.db["projects"]
            # Fast lookups by owner
            await projects_col.create_index([("owner_id", ASCENDING)], name="idx_owner_id")
            # Enforce unique project ID per owner
            await projects_col.create_index(
                [("owner_id", ASCENDING), ("id", ASCENDING)],
                unique=True,
                name="idx_owner_project_unique",
            )
            # Sorting by last updated timestamp
            await projects_col.create_index([("updated_at", DESCENDING)], name="idx_updated_at")
            logger.info("MongoDB indexes verified on 'projects' collection.")
        except Exception as exc:
            logger.warning("Failed to create MongoDB indexes: %s", exc)

    async def close(self) -> None:
        """Close MongoDB connection pool cleanly."""
        if self.client:
            logger.info("Closing MongoDB connection pool.")
            self.client.close()
            self.client = None
            self.db = None
            self.is_connected = False


# Shared singleton instance
mongo_manager = MongoManager()


def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Dependency / accessor for the active MongoDB database."""
    return mongo_manager.db if mongo_manager.is_connected else None


def is_mongodb_available() -> bool:
    """Return whether MongoDB is actively connected and reachable."""
    return mongo_manager.is_connected
