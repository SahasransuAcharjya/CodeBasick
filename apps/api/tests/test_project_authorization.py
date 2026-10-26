"""Comprehensive project authorization and cross-tenant security tests."""

import pytest
from fastapi.testclient import TestClient
from app.core.config import Settings
from app.main import create_app
from app.repositories.project_repository import in_memory_repository
from app.repositories.user_repository import in_memory_user_repo


@pytest.fixture(autouse=True)
def clean_repos():
    """Clear repositories between test runs."""
    in_memory_user_repo.clear()
    in_memory_repository.clear()
    yield
    in_memory_user_repo.clear()
    in_memory_repository.clear()


@pytest.fixture
def client():
    settings = Settings(
        ENVIRONMENT="test",
        DEBUG=False,
        MONGODB_URI=None,
    )
    app = create_app(settings)
    with TestClient(app) as test_client:
        yield test_client


def register_user(client: TestClient, email: str, name: str, password: str = "TestPass123!") -> dict:
    """Helper to register a user and return auth headers and user doc."""
    res = client.post(
        "/api/v1/auth/register",
        json={"email": email, "name": name, "password": password},
    )
    assert res.status_code == 201
    data = res.json()
    token = data["access_token"]
    return {
        "user": data["user"],
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


def test_cross_user_project_isolation(client: TestClient) -> None:
    """Verify that User A and User B have completely isolated projects and files."""
    user_a = register_user(client, "alice@codebasick.com", "Alice")
    user_b = register_user(client, "bob@codebasick.com", "Bob")

    # 1. User A creates a project
    proj_a = client.post(
        "/api/v1/projects",
        json={"name": "Alice Secret Project", "language": "python"},
        headers=user_a["headers"],
    ).json()
    proj_a_id = proj_a["id"]
    proj_a_file_id = proj_a["files"][0]["id"]

    # 2. User B creates a project
    proj_b = client.post(
        "/api/v1/projects",
        json={"name": "Bob Open Project", "language": "c"},
        headers=user_b["headers"],
    ).json()
    proj_b_id = proj_b["id"]

    # 3. User A can retrieve their own project
    res_a_self = client.get(f"/api/v1/projects/{proj_a_id}", headers=user_a["headers"])
    assert res_a_self.status_code == 200
    assert res_a_self.json()["name"] == "Alice Secret Project"

    # 4. User B CANNOT retrieve User A's project (404 without leaking info)
    res_b_get_a = client.get(f"/api/v1/projects/{proj_a_id}", headers=user_b["headers"])
    assert res_b_get_a.status_code == 404

    # 5. User B CANNOT list User A's project
    b_projects = client.get("/api/v1/projects", headers=user_b["headers"]).json()["items"]
    assert len(b_projects) == 1
    assert b_projects[0]["id"] == proj_b_id

    # 6. User B CANNOT update User A's project
    res_b_update_a = client.put(
        f"/api/v1/projects/{proj_a_id}",
        json={"name": "Hacked by Bob"},
        headers=user_b["headers"],
    )
    assert res_b_update_a.status_code == 404

    # 7. User B CANNOT delete User A's project
    res_b_delete_a = client.delete(
        f"/api/v1/projects/{proj_a_id}",
        headers=user_b["headers"],
    )
    assert res_b_delete_a.status_code == 404

    # 8. User B CANNOT add files to User A's project
    res_b_add_file = client.post(
        f"/api/v1/projects/{proj_a_id}/files",
        json={"name": "trojan.py", "content": "# malicious"},
        headers=user_b["headers"],
    )
    assert res_b_add_file.status_code == 404

    # 9. User B CANNOT update files in User A's project
    res_b_update_file = client.put(
        f"/api/v1/projects/{proj_a_id}/files/{proj_a_file_id}",
        json={"content": "# corrupted"},
        headers=user_b["headers"],
    )
    assert res_b_update_file.status_code == 404

    # 10. User B CANNOT delete files in User A's project
    res_b_delete_file = client.delete(
        f"/api/v1/projects/{proj_a_id}/files/{proj_a_file_id}",
        headers=user_b["headers"],
    )
    assert res_b_delete_file.status_code == 404

    # 11. Changing X-Client-Owner-ID has ZERO effect on authenticated project access
    res_forged_header = client.get(
        f"/api/v1/projects/{proj_a_id}",
        headers={
            "Authorization": f"Bearer {user_b['token']}",
            "X-Client-Owner-ID": user_a["user"]["id"],  # Forged header matching Alice's ID
        },
    )
    assert res_forged_header.status_code == 404

    # 12. Confirm Alice's project is completely untouched
    res_a_check = client.get(f"/api/v1/projects/{proj_a_id}", headers=user_a["headers"])
    assert res_a_check.status_code == 200
    assert res_a_check.json()["name"] == "Alice Secret Project"
    assert res_a_check.json()["files"][0]["id"] == proj_a_file_id


def test_unauthenticated_request_rejected_on_projects(client: TestClient) -> None:
    """Verify that unauthenticated requests to protected project endpoints return 401."""
    # List projects without auth
    res_list = client.get("/api/v1/projects")
    assert res_list.status_code == 401

    # Create project without auth
    res_create = client.post("/api/v1/projects", json={"name": "No Auth", "language": "python"})
    assert res_create.status_code == 401

    # Get project without auth
    res_get = client.get("/api/v1/projects/ws_any_id")
    assert res_get.status_code == 401


def test_tampered_or_invalid_tokens_rejected_on_projects(client: TestClient) -> None:
    """Verify that forged or malformed tokens cannot access protected projects."""
    res = client.get(
        "/api/v1/projects",
        headers={"Authorization": "Bearer forged.token.signature"},
    )
    assert res.status_code == 401
