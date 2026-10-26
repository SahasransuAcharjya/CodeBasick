"""Automated unit and integration tests for persistent project storage APIs."""

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from app.repositories.project_repository import in_memory_repository


from app.repositories.user_repository import in_memory_user_repo


@pytest.fixture(autouse=True)
def clear_storage() -> None:
    """Ensure in-memory repository is reset cleanly before every test."""
    in_memory_repository.clear()
    in_memory_user_repo.clear()


@pytest.fixture
def client() -> TestClient:
    """Fixture providing authenticated TestClient with test settings."""
    settings = Settings(
        ENVIRONMENT="test",
        DEBUG=False,
        MONGODB_URI=None,  # Tests run against isolated repository
    )
    app = create_app(settings)
    test_client = TestClient(app)
    # Register default authenticated test user
    reg = test_client.post(
        "/api/v1/auth/register",
        json={"email": "alpha_tester@codebasick.com", "name": "Alpha Tester", "password": "Password123!"},
    ).json()
    token = reg["access_token"]
    test_client.headers["Authorization"] = f"Bearer {token}"
    setattr(test_client, "test_user_id", reg["user"]["id"])
    return test_client


def test_create_python_project_default_starter(client: TestClient) -> None:
    """Test creating a Python project without initial files initializes starter code."""
    payload = {
        "name": "My Python Project",
        "language": "python",
        "description": "A beginner Python program.",
    }
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    res = client.post("/api/v1/projects", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "My Python Project"
    assert data["language"] == "python"
    assert data["owner_id"] == getattr(client, "test_user_id", data["owner_id"])
    assert data["file_count"] == 1
    assert len(data["files"]) == 1
    assert data["files"][0]["name"] == "main.py"
    assert "def main():" in data["files"][0]["content"]
    assert data["active_file_id"] == data["files"][0]["id"]


def test_create_c_project_default_starter(client: TestClient) -> None:
    """Test creating a C project initializes main.c starter code."""
    payload = {
        "name": "My C System App",
        "language": "c",
    }
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    res = client.post("/api/v1/projects", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["language"] == "c"
    assert data["files"][0]["name"] == "main.c"
    assert "#include <stdio.h>" in data["files"][0]["content"]


def test_create_project_with_custom_files(client: TestClient) -> None:
    """Test creating a project with multiple custom files."""
    payload = {
        "name": "Multi-file C Project",
        "language": "c",
        "files": [
            {"name": "main.c", "content": "#include <stdio.h>\nint main() { return 0; }"},
            {"name": "utils.h", "content": "#ifndef UTILS_H\n#define UTILS_H\n#endif"},
        ],
    }
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    res = client.post("/api/v1/projects", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["file_count"] == 2
    assert len(data["files"]) == 2
    filenames = [f["name"] for f in data["files"]]
    assert "main.c" in filenames
    assert "utils.h" in filenames


def test_list_projects_and_pagination(client: TestClient) -> None:
    """Test listing projects with pagination and sorting."""
    headers = {"X-Client-Owner-ID": "test-owner-list"}
    for i in range(5):
        client.post(
            "/api/v1/projects",
            json={"name": f"Project {i}", "language": "python"},
            headers=headers,
        )

    # Fetch page 1 (limit 3)
    res1 = client.get("/api/v1/projects?limit=3&offset=0", headers=headers)
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["total"] == 5
    assert len(data1["items"]) == 3
    assert data1["limit"] == 3
    assert data1["offset"] == 0

    # Fetch page 2 (limit 3, offset 3)
    res2 = client.get("/api/v1/projects?limit=3&offset=3", headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert len(data2["items"]) == 2


def test_retrieve_project_by_id(client: TestClient) -> None:
    """Test retrieving an existing project by unique ID."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "Retrieve Target", "language": "python"},
        headers=headers,
    ).json()

    proj_id = created["id"]
    res = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == proj_id
    assert data["name"] == "Retrieve Target"
    assert len(data["files"]) >= 1


def test_update_project_metadata(client: TestClient) -> None:
    """Test updating project name, description, and active file ID."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "Initial Name", "language": "python"},
        headers=headers,
    ).json()

    proj_id = created["id"]
    update_payload = {
        "name": "Renamed Project",
        "description": "Updated project description.",
    }
    res = client.put(f"/api/v1/projects/{proj_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Renamed Project"
    assert data["description"] == "Updated project description."


def test_save_source_code_buffers(client: TestClient) -> None:
    """Test updating all file buffers in a project (autosave simulation)."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "Autosave Project", "language": "python"},
        headers=headers,
    ).json()

    proj_id = created["id"]
    updated_files = created["files"]
    updated_files[0]["content"] = "x = 42\nprint(x)\n"

    sync_payload = {
        "files": updated_files,
        "active_file_id": updated_files[0]["id"],
    }
    res = client.put(f"/api/v1/projects/{proj_id}", json=sync_payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["files"][0]["content"] == "x = 42\nprint(x)\n"


def test_add_and_delete_file_in_project(client: TestClient) -> None:
    """Test adding a secondary file and subsequently deleting it."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "File Test Project", "language": "c"},
        headers=headers,
    ).json()

    proj_id = created["id"]

    # 1. Add file
    add_payload = {
        "name": "math_helper.c",
        "content": "int add(int a, int b) { return a + b; }",
    }
    add_res = client.post(f"/api/v1/projects/{proj_id}/files", json=add_payload, headers=headers)
    assert add_res.status_code == 201
    new_file = add_res.json()
    assert new_file["name"] == "math_helper.c"
    file_id = new_file["id"]

    # Verify project has 2 files
    proj_res = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert proj_res.json()["file_count"] == 2

    # 2. Update the new file
    up_res = client.put(
        f"/api/v1/projects/{proj_id}/files/{file_id}",
        json={"content": "int add(int a, int b) { return a + b + 1; }"},
        headers=headers,
    )
    assert up_res.status_code == 200
    assert "a + b + 1" in up_res.json()["content"]

    # 3. Delete the secondary file
    del_res = client.delete(f"/api/v1/projects/{proj_id}/files/{file_id}", headers=headers)
    assert del_res.status_code == 200

    # Verify project has 1 file remaining
    proj_res_after = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert proj_res_after.json()["file_count"] == 1


def test_cannot_delete_only_remaining_file(client: TestClient) -> None:
    """Test rejection when trying to delete the sole remaining file in a project."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "Sole File Project", "language": "python"},
        headers=headers,
    ).json()

    proj_id = created["id"]
    sole_file_id = created["files"][0]["id"]

    del_res = client.delete(f"/api/v1/projects/{proj_id}/files/{sole_file_id}", headers=headers)
    assert del_res.status_code == 422
    assert "at least one file is required" in del_res.json()["error"].lower()


def test_delete_project(client: TestClient) -> None:
    """Test deleting an entire project."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "To Be Deleted", "language": "python"},
        headers=headers,
    ).json()

    proj_id = created["id"]
    del_res = client.delete(f"/api/v1/projects/{proj_id}", headers=headers)
    assert del_res.status_code == 200

    # Ensure 404 on subsequent get
    get_res = client.get(f"/api/v1/projects/{proj_id}", headers=headers)
    assert get_res.status_code == 404


def test_owner_isolation_security(client: TestClient) -> None:
    """Security Test: Owner B cannot read, update, or delete Owner A's project."""
    # Register Owner B
    res_b = client.post(
        "/api/v1/auth/register",
        json={"email": "owner_b@test.com", "name": "Owner B", "password": "Password123!"},
    ).json()
    owner_b_headers = {"Authorization": f"Bearer {res_b['access_token']}"}

    # Owner A creates project (client uses Owner A's token by default)
    created = client.post(
        "/api/v1/projects",
        json={"name": "Secret Project A", "language": "python"},
    ).json()
    proj_id = created["id"]

    # Owner B attempts to list projects -> must not see Project A
    b_list = client.get("/api/v1/projects", headers=owner_b_headers).json()
    assert b_list["total"] == 0
    assert len(b_list["items"]) == 0

    # Owner B attempts to GET Project A -> 404
    get_res = client.get(f"/api/v1/projects/{proj_id}", headers=owner_b_headers)
    assert get_res.status_code == 404

    # Owner B attempts to UPDATE Project A -> 404
    up_res = client.put(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Hacked Title"},
        headers=owner_b_headers,
    )
    assert up_res.status_code == 404

    # Owner B attempts to DELETE Project A -> 404
    del_res = client.delete(f"/api/v1/projects/{proj_id}", headers=owner_b_headers)
    assert del_res.status_code == 404

    # Verify Owner A's project was not affected
    a_proj = client.get(f"/api/v1/projects/{proj_id}").json()
    assert a_proj["name"] == "Secret Project A"


def test_validation_path_traversal_rejection(client: TestClient) -> None:
    """Security Test: Reject path traversal sequences and invalid filenames."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    created = client.post(
        "/api/v1/projects",
        json={"name": "Path Test", "language": "c"},
        headers=headers,
    ).json()
    proj_id = created["id"]

    malicious_names = [
        "../../etc/passwd",
        "..\\windows\\system32",
        "sub/dir/test.c",
        "file\x00name.c",
        "",
        "   ",
        "file<invalid>.c",
    ]

    for bad_name in malicious_names:
        resp = client.post(
            f"/api/v1/projects/{proj_id}/files",
            json={"name": bad_name, "content": "test"},
            headers=headers,
        )
        assert resp.status_code == 422


def test_validation_unsupported_language_rejection(client: TestClient) -> None:
    """Test rejection when creating project with unsupported language."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    resp = client.post(
        "/api/v1/projects",
        json={"name": "Invalid Lang Project", "language": "cobol"},
        headers=headers,
    )
    assert resp.status_code == 422
    assert "not supported" in resp.json()["details"][0]["message"].lower()


def test_validation_oversized_file_content_rejection(client: TestClient) -> None:
    """Test rejection of source code files exceeding 64 KB limit."""
    headers = {"X-Client-Owner-ID": "test-owner-alpha"}
    huge_content = "# " + ("x" * 66000)
    resp = client.post(
        "/api/v1/projects",
        json={
            "name": "Huge Project",
            "language": "python",
            "files": [{"name": "huge.py", "content": huge_content}],
        },
        headers=headers,
    )
    assert resp.status_code == 422
    assert "exceeds maximum limit" in resp.json()["details"][0]["message"]


def test_unauthenticated_request_rejected_without_token(client: TestClient) -> None:
    """Test that requests without authentication token or cookie are rejected with 401."""
    client.cookies.clear()
    res = client.get("/api/v1/projects", headers={"Authorization": ""})
    assert res.status_code == 401


def test_invalid_owner_id_header_format_rejected(client: TestClient) -> None:
    """Test rejection of forged or invalid authentication tokens."""
    invalid_headers = [
        {"Authorization": "Bearer not-a-valid-token"},
        {"Authorization": "Bearer abc"},
        {"Authorization": "Basic dXNlcjpwYXNz"},
    ]
    for h in invalid_headers:
        res = client.get("/api/v1/projects", headers=h)
        assert res.status_code == 401


@pytest.mark.anyio
async def test_mongodb_manager_graceful_unreachable_handling() -> None:
    """Test that MongoManager handles unreachable connection strings gracefully without throwing."""
    from app.db.mongodb import MongoManager
    mgr = MongoManager()
    dummy_settings = Settings(
        MONGODB_URI="mongodb://invalid-host-that-does-not-exist:27017",
        MONGODB_CONNECT_TIMEOUT_MS=200,
    )
    # Must complete without crashing
    await mgr.connect(dummy_settings)
    assert mgr.is_connected is False
    assert mgr.db is None
    await mgr.close()


def test_owner_isolation_all_subfile_operations(client: TestClient) -> None:
    """Verify that an unauthorized owner cannot add, update, or delete files in another project."""
    # Register intruder
    res_intruder = client.post(
        "/api/v1/auth/register",
        json={"email": "intruder1@test.com", "name": "Intruder One", "password": "Password123!"},
    ).json()
    intruder_headers = {"Authorization": f"Bearer {res_intruder['access_token']}"}

    # Owner Alpha creates project
    created = client.post(
        "/api/v1/projects",
        json={"name": "Alpha Secure Project", "language": "python"},
    ).json()
    proj_id = created["id"]
    file_id = created["files"][0]["id"]

    # Intruder attempts to add a file -> 404
    res_add = client.post(
        f"/api/v1/projects/{proj_id}/files",
        json={"name": "injected.py", "content": "# malicious"},
        headers=intruder_headers,
    )
    assert res_add.status_code == 404

    # Intruder attempts to update file -> 404
    res_update = client.put(
        f"/api/v1/projects/{proj_id}/files/{file_id}",
        json={"content": "# overwrite attempt"},
        headers=intruder_headers,
    )
    assert res_update.status_code == 404

    # Intruder attempts to delete file -> 404
    res_del = client.delete(
        f"/api/v1/projects/{proj_id}/files/{file_id}",
        headers=intruder_headers,
    )
    assert res_del.status_code == 404


def test_owner_isolation_update_and_delete_project(client: TestClient) -> None:
    """Verify that an unauthorized owner cannot update or delete another owner's project."""
    # Register intruder
    res_intruder = client.post(
        "/api/v1/auth/register",
        json={"email": "intruder2@test.com", "name": "Intruder Two", "password": "Password123!"},
    ).json()
    intruder_headers = {"Authorization": f"Bearer {res_intruder['access_token']}"}

    created = client.post(
        "/api/v1/projects",
        json={"name": "Alpha Locked Project", "language": "python"},
    ).json()
    proj_id = created["id"]

    # Intruder tries to update
    res_update = client.put(
        f"/api/v1/projects/{proj_id}",
        json={"name": "Hacked Name"},
        headers=intruder_headers,
    )
    assert res_update.status_code == 404

    # Intruder tries to delete
    res_del = client.delete(
        f"/api/v1/projects/{proj_id}",
        headers=intruder_headers,
    )
    assert res_del.status_code == 404

    # Confirm Alpha's project is completely untouched
    res_get = client.get(f"/api/v1/projects/{proj_id}")
    assert res_get.status_code == 200
    assert res_get.json()["name"] == "Alpha Locked Project"


def test_unconfigured_mongodb_returns_in_memory_storage_header(client: TestClient) -> None:
    """Verify that when running without MongoDB, API returns in_memory storage indicator."""
    res = client.post(
        "/api/v1/projects",
        json={"name": "Fallback Test Project", "language": "python"},
        headers={"X-Client-Owner-ID": "owner_fallback_test"},
    )
    assert res.status_code == 201
    assert res.headers.get("x-storage-backend") == "in_memory"
    data = res.json()
    assert data["storage"] == "in_memory"


