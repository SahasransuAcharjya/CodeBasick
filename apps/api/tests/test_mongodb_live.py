"""Live integration tests against local MongoDB development instance.

Verifies real database connectivity, index creation, project lifecycle,
and persistence across backend restart.
"""

import pytest
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import Settings
from app.db.mongodb import MongoManager
from app.repositories.project_repository import MongoProjectRepository


@pytest.fixture
async def live_mongo_manager():
    """Fixture providing a connected MongoManager to local MongoDB."""
    # Probe local MongoDB availability
    client = AsyncIOMotorClient("mongodb://127.0.0.1:27017", serverSelectionTimeoutMS=2000)
    try:
        await client.admin.command("ping")
    except Exception:
        pytest.skip("Local MongoDB server is not running or unreachable on 127.0.0.1:27017")
    finally:
        client.close()

    settings = Settings(
        ENVIRONMENT="development",
        DEBUG=True,
        MONGODB_URI="mongodb://127.0.0.1:27017",
        MONGODB_DB_NAME="codebasick_dev_test",
        MONGODB_CONNECT_TIMEOUT_MS=3000,
    )
    manager = MongoManager()
    await manager.connect(settings)
    assert manager.is_connected is True
    yield manager
    # Clean up test database collection and close pool
    if manager.db is not None:
        await manager.db.client.drop_database("codebasick_dev_test")
    await manager.close()


@pytest.mark.anyio
async def test_live_mongodb_indexes_and_collections(live_mongo_manager: MongoManager):
    """Verify that collection and indexes are properly created on live MongoDB."""
    db = live_mongo_manager.db
    assert db is not None

    indexes = await db["projects"].index_information()
    assert "idx_owner_id" in indexes
    assert "idx_owner_project_unique" in indexes
    assert indexes["idx_owner_project_unique"].get("unique") is True
    assert "idx_updated_at" in indexes

    user_indexes = await db["users"].index_information()
    assert "idx_user_id" in user_indexes
    assert "idx_user_email" in user_indexes
    assert user_indexes["idx_user_email"].get("unique") is True
    assert "idx_user_google_sub" in user_indexes


@pytest.mark.anyio
async def test_live_mongodb_project_lifecycle_and_persistence_restart(live_mongo_manager: MongoManager):
    """Test full CRUD cycle and persistence across simulated backend connection restart."""
    db = live_mongo_manager.db
    assert db is not None
    repo = MongoProjectRepository(db)
    owner_id = "live_owner_test_7b1"

    # 1. Create project
    created = await repo.create_project(
        owner_id,
        {
            "id": "proj_live_test_001",
            "name": "Live Database Test Project",
            "description": "Integration test project",
            "language": "python",
            "files": [
                {
                    "id": "file_live_01",
                    "name": "main.py",
                    "path": "main.py",
                    "language": "python",
                    "content": "print('Initial code')\n",
                    "is_entry": True,
                    "created_at": "2026-10-27T00:00:00Z",
                    "updated_at": "2026-10-27T00:00:00Z",
                }
            ],
            "active_file_id": "file_live_01",
            "open_file_ids": ["file_live_01"],
        },
    )
    assert created["id"] == "proj_live_test_001"
    assert created["owner_id"] == owner_id

    # 2. Retrieve project
    retrieved = await repo.get_project(owner_id, "proj_live_test_001")
    assert retrieved is not None
    assert retrieved["name"] == "Live Database Test Project"
    assert len(retrieved["files"]) == 1

    # 3. Update project code & metadata
    updated = await repo.update_project(
        owner_id,
        "proj_live_test_001",
        {
            "name": "Updated Live Project",
            "files": [
                {
                    "id": "file_live_01",
                    "name": "main.py",
                    "path": "main.py",
                    "language": "python",
                    "content": "print('Updated code persisted to real MongoDB')\n",
                    "is_entry": True,
                    "created_at": "2026-10-27T00:00:00Z",
                    "updated_at": "2026-10-27T00:05:00Z",
                }
            ],
        },
    )
    assert updated is not None
    assert updated["name"] == "Updated Live Project"
    assert "Updated code persisted" in updated["files"][0]["content"]

    # 4. Add a new file
    added_file = await repo.add_file(
        owner_id,
        "proj_live_test_001",
        {
            "id": "file_live_02",
            "name": "helper.py",
            "path": "helper.py",
            "language": "python",
            "content": "SECRET_KEY = 42\n",
            "is_entry": False,
            "created_at": "2026-10-27T00:06:00Z",
            "updated_at": "2026-10-27T00:06:00Z",
        },
    )
    assert added_file["name"] == "helper.py"

    # 5. SIMULATE BACKEND RESTART: Close pool and re-open new client connection
    await live_mongo_manager.close()
    assert live_mongo_manager.is_connected is False

    restarted_settings = Settings(
        ENVIRONMENT="development",
        DEBUG=True,
        MONGODB_URI="mongodb://127.0.0.1:27017",
        MONGODB_DB_NAME="codebasick_dev_test",
        MONGODB_CONNECT_TIMEOUT_MS=3000,
    )
    restarted_manager = MongoManager()
    await restarted_manager.connect(restarted_settings)
    assert restarted_manager.is_connected is True

    # 6. Verify persistence after backend restart
    restarted_repo = MongoProjectRepository(restarted_manager.db)
    persisted = await restarted_repo.get_project(owner_id, "proj_live_test_001")
    assert persisted is not None
    assert persisted["name"] == "Updated Live Project"
    assert len(persisted["files"]) == 2
    assert any(f["name"] == "helper.py" for f in persisted["files"])
    assert "Updated code persisted" in persisted["files"][0]["content"]

    # 7. Delete project
    deleted = await restarted_repo.delete_project(owner_id, "proj_live_test_001")
    assert deleted is True

    # Confirm deletion
    post_delete = await restarted_repo.get_project(owner_id, "proj_live_test_001")
    assert post_delete is None

    await restarted_manager.close()


def test_live_mongodb_http_api_endpoints():
    """Verify live HTTP endpoints communicate with MongoDB and return X-Storage-Backend: mongodb."""
    from fastapi.testclient import TestClient
    from app.main import create_app

    settings = Settings(
        ENVIRONMENT="development",
        DEBUG=True,
        MONGODB_URI="mongodb://127.0.0.1:27017",
        MONGODB_DB_NAME="codebasick_dev_test",
        MONGODB_CONNECT_TIMEOUT_MS=3000,
    )
    app = create_app(settings)

    with TestClient(app) as client:
        # Register authenticated user
        reg_res = client.post(
            "/api/v1/auth/register",
            json={"email": "mongo_live_user@test.com", "name": "Mongo Live User", "password": "Password123!"},
        )
        assert reg_res.status_code == 201
        token = reg_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create project via HTTP POST
        res_create = client.post(
            "/api/v1/projects",
            json={"name": "Live HTTP Mongo Project", "language": "python"},
            headers=headers,
        )
        assert res_create.status_code == 201
        data = res_create.json()
        assert data["name"] == "Live HTTP Mongo Project"
        assert data["storage"] == "mongodb"
        assert res_create.headers.get("x-storage-backend") == "mongodb"
        project_id = data["id"]

        # 2. Retrieve project via HTTP GET
        res_get = client.get(f"/api/v1/projects/{project_id}", headers=headers)
        assert res_get.status_code == 200
        get_data = res_get.json()
        assert get_data["id"] == project_id
        assert get_data["storage"] == "mongodb"
        assert res_get.headers.get("x-storage-backend") == "mongodb"

        # 3. Update project via HTTP PUT
        res_put = client.put(
            f"/api/v1/projects/{project_id}",
            json={"name": "Renamed HTTP Mongo Project"},
            headers=headers,
        )
        assert res_put.status_code == 200
        assert res_put.json()["name"] == "Renamed HTTP Mongo Project"
        assert res_put.headers.get("x-storage-backend") == "mongodb"

        # 4. List projects via HTTP GET
        res_list = client.get("/api/v1/projects", headers=headers)
        assert res_list.status_code == 200
        list_data = res_list.json()
        assert list_data["total"] >= 1
        assert list_data["storage"] == "mongodb"
        assert res_list.headers.get("x-storage-backend") == "mongodb"

        # 5. Delete project via HTTP DELETE
        res_del = client.delete(f"/api/v1/projects/{project_id}", headers=headers)
        assert res_del.status_code == 200
        assert res_del.json()["status"] == "deleted"
        assert res_del.headers.get("x-storage-backend") == "mongodb"

