"""Unit and integration tests for authentication (Registration, Login, JWT, Google OAuth)."""

from datetime import timedelta
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.main import create_app
from app.repositories.user_repository import in_memory_user_repo


@pytest.fixture(autouse=True)
def clean_user_repo():
    """Clear in-memory user repository before and after each test."""
    in_memory_user_repo.clear()
    yield
    in_memory_user_repo.clear()


@pytest.fixture
def client():
    """Create test client with clean settings and isolated memory repository."""
    settings = Settings(
        ENVIRONMENT="test",
        DEBUG=False,
        MONGODB_URI=None,
    )
    app = create_app(settings)
    with TestClient(app) as test_client:
        yield test_client


# ==============================================================================
# 1. Registration Tests
# ==============================================================================


def test_register_success(client: TestClient) -> None:
    """Verify that a new user can register successfully with valid credentials."""
    payload = {
        "email": "learner@CodeBasick.com",
        "name": "Alex Learner",
        "password": "SecurePassword123!",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "learner@codebasick.com"  # Normalized lowercase
    assert data["user"]["name"] == "Alex Learner"
    assert data["user"]["auth_provider"] == "local"
    assert "password" not in data["user"]
    assert "hashed_password" not in data["user"]

    # Verify cookie was set
    cookie = res.cookies.get(get_settings().AUTH_COOKIE_NAME)
    assert cookie is not None


def test_register_duplicate_email_rejected(client: TestClient) -> None:
    """Verify that registering with an already existing normalized email fails with 409."""
    payload = {
        "email": "duplicate@test.com",
        "name": "First User",
        "password": "Password123!",
    }
    res1 = client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt to register again with same email in different case
    payload2 = {
        "email": "DUPLICATE@TEST.COM",
        "name": "Second User",
        "password": "AnotherPassword456!",
    }
    res2 = client.post("/api/v1/auth/register", json=payload2)
    assert res2.status_code == 409
    assert "already exists" in res2.json()["error"].lower()


def test_register_short_password_rejected(client: TestClient) -> None:
    """Verify that passwords shorter than 8 characters are rejected."""
    payload = {
        "email": "short@test.com",
        "name": "Short Pwd",
        "password": "short",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422


def test_register_invalid_email_format_rejected(client: TestClient) -> None:
    """Verify that malformed email addresses are rejected."""
    payload = {
        "email": "not-an-email",
        "name": "Invalid Email",
        "password": "ValidPassword123!",
    }
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 422


# ==============================================================================
# 2. Login Tests
# ==============================================================================


def test_login_success(client: TestClient) -> None:
    """Verify that an existing user can log in with their correct password."""
    # Register first
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login_user@test.com",
            "name": "Login Test",
            "password": "MySuperSecret123!",
        },
    )

    # Login
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "login_user@test.com", "password": "MySuperSecret123!"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login_user@test.com"
    assert data["user"]["name"] == "Login Test"


def test_login_incorrect_password_rejected(client: TestClient) -> None:
    """Verify that an incorrect password returns 401 with generic error message."""
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrong_pwd@test.com",
            "name": "Wrong Pwd User",
            "password": "RealPassword123!",
        },
    )

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "wrong_pwd@test.com", "password": "WrongPassword!"},
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["error"].lower()


def test_login_nonexistent_email_rejected(client: TestClient) -> None:
    """Verify that attempting to log in with a non-existent account returns 401."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@nowhere.com", "password": "SomePassword123!"},
    )
    assert res.status_code == 401
    assert "invalid email or password" in res.json()["error"].lower()


# ==============================================================================
# 3. Session and Token Validation Tests
# ==============================================================================


def test_get_me_authenticated_success(client: TestClient) -> None:
    """Verify that GET /auth/me returns the current user profile when valid Bearer token is provided."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "me@test.com", "name": "Me User", "password": "Password123!"},
    ).json()
    token = reg["access_token"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "me@test.com"
    assert data["name"] == "Me User"


def test_get_me_unauthenticated_rejected(client: TestClient) -> None:
    """Verify that GET /auth/me returns 401 when no credentials are provided."""
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401


def test_get_me_expired_token_rejected(client: TestClient) -> None:
    """Verify that expired tokens are rejected with 401."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "expired@test.com", "name": "Expired User", "password": "Password123!"},
    ).json()
    user_id = reg["user"]["id"]

    # Generate expired token (-10 minutes)
    expired_token = create_access_token(
        user_id=user_id,
        email="expired@test.com",
        name="Expired User",
        expires_delta=timedelta(minutes=-10),
    )

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res.status_code == 401
    assert "expired" in res.json()["error"].lower()


def test_get_me_tampered_token_rejected(client: TestClient) -> None:
    """Verify that tampered or improperly signed tokens are rejected with 401."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"email": "tamper@test.com", "name": "Tamper User", "password": "Password123!"},
    ).json()
    token = reg["access_token"]
    tampered_token = token[:-4] + "abcd"

    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401


def test_logout_clears_cookie(client: TestClient) -> None:
    """Verify that logout deletes the auth cookie."""
    res = client.post("/api/v1/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "logged_out"


# ==============================================================================
# 4. Google Sign-In Tests
# ==============================================================================


@patch("app.api.routes.auth.verify_google_id_token")
def test_google_sign_in_new_user_success(mock_verify, client: TestClient) -> None:
    """Verify that a new user can sign in via Google OAuth."""
    mock_verify.return_value = {
        "google_sub": "google_sub_123456",
        "email": "google_learner@gmail.com",
        "name": "Google Learner",
    }

    res = client.post("/api/v1/auth/google", json={"id_token": "valid_google_token_mock"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "google_learner@gmail.com"
    assert data["user"]["name"] == "Google Learner"
    assert data["user"]["auth_provider"] == "google"


@patch("app.api.routes.auth.verify_google_id_token")
def test_google_sign_in_existing_google_user_success(mock_verify, client: TestClient) -> None:
    """Verify that returning Google users are logged in smoothly."""
    mock_verify.return_value = {
        "google_sub": "google_sub_78910",
        "email": "returning_google@gmail.com",
        "name": "Returning Google User",
    }

    # First sign in (creates account)
    res1 = client.post("/api/v1/auth/google", json={"id_token": "google_token_1_valid"})
    assert res1.status_code == 200
    user_id1 = res1.json()["user"]["id"]

    # Second sign in (logs in existing account)
    res2 = client.post("/api/v1/auth/google", json={"id_token": "google_token_2_valid"})
    assert res2.status_code == 200
    assert res2.json()["user"]["id"] == user_id1


@patch("app.api.routes.auth.verify_google_id_token")
def test_google_sign_in_account_linking_protection(mock_verify, client: TestClient) -> None:
    """Verify that Google Sign-In cannot hijack an existing password account without verification."""
    # User registers with email & password
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "conflict_user@gmail.com",
            "name": "Conflict User",
            "password": "StrongPassword123!",
        },
    )

    # Attacker / other party attempts Google Sign-In with that email
    mock_verify.return_value = {
        "google_sub": "google_sub_unlinked",
        "email": "conflict_user@gmail.com",
        "name": "Conflict User",
    }

    res = client.post("/api/v1/auth/google", json={"id_token": "unlinked_token"})
    assert res.status_code == 409
    assert "already exists with password login" in res.json()["error"].lower()
