"""Dedicated security audit and hardening tests for CodeBasick Phase 8.1.

Covers:
- CSRF Protection on cookie-authenticated state-changing requests
- In-memory rate limiting on authentication endpoints
- Production cookie and secret configuration validation
- Google OpenID Connect ID-token validation unit tests
- Concurrent / duplicate account registration conflict handling
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.rate_limit import clear_rate_limits
from app.core.security import verify_google_id_token
from app.main import create_app
from app.repositories.user_repository import in_memory_user_repo


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
def test_settings():
    return Settings(
        ENVIRONMENT="test",
        DEBUG=False,
        MONGODB_URI=None,
        AUTH_RATE_LIMIT_LOGIN_PER_MINUTE=10,
        AUTH_RATE_LIMIT_REGISTER_PER_MINUTE=5,
        GOOGLE_CLIENT_ID="test_google_client_id_12345",
    )


@pytest.fixture
def client(test_settings):
    app = create_app(test_settings)
    with TestClient(app) as test_client:
        yield test_client


def register_user(client: TestClient, email: str = "csrf_tester@codebasick.com") -> str:
    """Helper to register user and return access token."""
    res = client.post(
        "/api/v1/auth/register",
        json={"email": email, "name": "CSRF Tester", "password": "Password123!"},
    )
    assert res.status_code == 201
    return res.json()["access_token"]


# ==============================================================================
# 1. CSRF Protection Tests
# ==============================================================================


def test_csrf_cookie_request_with_untrusted_origin_rejected(client: TestClient, test_settings: Settings) -> None:
    """Verify that a cookie-authenticated POST with an untrusted Origin returns 403 Forbidden."""
    token = register_user(client, "untrusted_origin@test.com")
    client.cookies.set(test_settings.AUTH_COOKIE_NAME, token)

    res = client.post(
        "/api/v1/projects",
        json={"name": "Attacker Project", "language": "python"},
        headers={"Origin": "https://malicious-attacker.com"},
    )
    assert res.status_code == 403
    assert res.json()["error_code"] == "CSRF_ORIGIN_UNTRUSTED"


def test_csrf_cookie_request_with_untrusted_referer_rejected(client: TestClient, test_settings: Settings) -> None:
    """Verify that a cookie-authenticated POST with an untrusted Referer returns 403 Forbidden."""
    token = register_user(client, "untrusted_ref@test.com")
    client.cookies.set(test_settings.AUTH_COOKIE_NAME, token)

    res = client.post(
        "/api/v1/projects",
        json={"name": "Attacker Project", "language": "python"},
        headers={"Referer": "https://evil.org/phishing-page"},
    )
    assert res.status_code == 403
    assert res.json()["error_code"] == "CSRF_REFERER_UNTRUSTED"


def test_csrf_cookie_request_missing_origin_and_custom_header_rejected(client: TestClient, test_settings: Settings) -> None:
    """Verify that a cookie-authenticated POST with no Origin/Referer and no custom header returns 403."""
    token = register_user(client, "missing_headers@test.com")
    client.cookies.set(test_settings.AUTH_COOKIE_NAME, token)

    res = client.post(
        "/api/v1/projects",
        json={"name": "Attacker Project", "language": "python"},
    )
    assert res.status_code == 403
    assert res.json()["error_code"] == "CSRF_HEADER_MISSING"


def test_csrf_cookie_request_with_trusted_origin_accepted(client: TestClient, test_settings: Settings) -> None:
    """Verify that a cookie-authenticated POST with a trusted Origin succeeds."""
    token = register_user(client, "trusted_origin@test.com")
    client.cookies.set(test_settings.AUTH_COOKIE_NAME, token)

    res = client.post(
        "/api/v1/projects",
        json={"name": "Legitimate Project", "language": "python"},
        headers={"Origin": "http://localhost:3000"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Legitimate Project"


def test_csrf_cookie_request_with_custom_header_accepted(client: TestClient, test_settings: Settings) -> None:
    """Verify that a cookie-authenticated POST with X-Requested-With header succeeds."""
    token = register_user(client, "custom_header@test.com")
    client.cookies.set(test_settings.AUTH_COOKIE_NAME, token)

    res = client.post(
        "/api/v1/projects",
        json={"name": "Custom Header Project", "language": "python"},
        headers={"X-Requested-With": "XMLHttpRequest"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "Custom Header Project"


def test_pure_bearer_token_bypasses_ambient_cookie_csrf(client: TestClient) -> None:
    """Verify that non-browser API clients using Bearer tokens without cookies are not blocked by CSRF."""
    token = register_user(client, "pure_bearer@test.com")
    client.cookies.clear()

    res = client.post(
        "/api/v1/projects",
        json={"name": "API Client Project", "language": "c"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 201
    assert res.json()["name"] == "API Client Project"


# ==============================================================================
# 2. Rate Limiting Tests
# ==============================================================================


def test_login_rate_limiting_enforced(client: TestClient) -> None:
    """Verify that exceeding login attempt threshold returns HTTP 429 Too Many Requests."""
    clear_rate_limits()

    # Attempt 10 failed logins
    for i in range(10):
        res = client.post(
            "/api/v1/auth/login",
            json={"email": "target_bruteforce@test.com", "password": f"WrongPass{i}"},
        )
        assert res.status_code == 401

    # 11th attempt must trigger rate limit
    res_blocked = client.post(
        "/api/v1/auth/login",
        json={"email": "target_bruteforce@test.com", "password": "WrongPass11"},
    )
    assert res_blocked.status_code == 429
    assert "too many login attempts" in res_blocked.json()["error"].lower()


def test_registration_rate_limiting_enforced(client: TestClient) -> None:
    """Verify that exceeding registration attempt threshold returns HTTP 429 Too Many Requests."""
    clear_rate_limits()

    # Register 5 users successfully
    for i in range(5):
        res = client.post(
            "/api/v1/auth/register",
            json={"email": f"reg_{i}@test.com", "name": f"User {i}", "password": "Password123!"},
        )
        assert res.status_code == 201

    # 6th attempt must trigger rate limit
    res_blocked = client.post(
        "/api/v1/auth/register",
        json={"email": "reg_exceeded@test.com", "name": "Exceeded User", "password": "Password123!"},
    )
    assert res_blocked.status_code == 429
    assert "too many registration attempts" in res_blocked.json()["error"].lower()


# ==============================================================================
# 3. Production Configuration and Cookie Validation Tests
# ==============================================================================


def test_production_enforces_secure_cookie() -> None:
    """Verify that production environment rejects AUTH_COOKIE_SECURE=False."""
    with pytest.raises(ValueError, match="AUTH_COOKIE_SECURE must be True in production"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            AUTH_COOKIE_SECURE=False,
            AUTH_SECRET_KEY="a_very_long_production_secret_key_that_is_32_bytes_or_more",
        )


def test_production_enforces_non_default_secret_key() -> None:
    """Verify that production environment rejects dev_secret_key placeholder."""
    with pytest.raises(ValueError, match="AUTH_SECRET_KEY must be set to a secure unique secret in production"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            AUTH_COOKIE_SECURE=True,
            AUTH_SECRET_KEY="cb_dev_secret_key_needs_replacement_in_production_32bytes_min_length_ok",
        )


def test_short_secret_key_rejected() -> None:
    """Verify that secret keys shorter than 32 characters are rejected."""
    with pytest.raises(ValueError, match="AUTH_SECRET_KEY must be at least 32 characters long"):
        Settings(AUTH_SECRET_KEY="short_key_123")


# ==============================================================================
# 4. Google OpenID Connect ID-Token Verification Unit Tests
# ==============================================================================


@pytest.mark.anyio
async def test_verify_google_id_token_missing_configured_client_id() -> None:
    """Verify that verify_google_id_token fails safely when Google Client ID is unconfigured."""
    with patch("app.core.security.get_settings") as mock_settings:
        mock_settings.return_value = Settings(GOOGLE_CLIENT_ID=None)
        with pytest.raises(UnauthorizedException, match="Google Sign-In is not configured on this server"):
            await verify_google_id_token("fake_token_value", client_id=None)


@pytest.mark.anyio
async def test_verify_google_id_token_invalid_issuer() -> None:
    """Verify that tokens from unexpected issuers are rejected."""
    from unittest.mock import MagicMock
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "iss": "https://untrusted-issuer.com",
        "aud": "test_client_id",
        "email": "test@gmail.com",
        "email_verified": True,
        "sub": "123456789",
    }

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        with pytest.raises(UnauthorizedException, match="Invalid Google token issuer"):
            await verify_google_id_token("mock_token", client_id="test_client_id")


@pytest.mark.anyio
async def test_verify_google_id_token_audience_mismatch() -> None:
    """Verify that tokens intended for other client IDs are rejected."""
    from unittest.mock import MagicMock
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "iss": "https://accounts.google.com",
        "aud": "other_app_client_id",
        "email": "test@gmail.com",
        "email_verified": True,
        "sub": "123456789",
    }

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        with pytest.raises(UnauthorizedException, match="audience does not match"):
            await verify_google_id_token("mock_token", client_id="my_expected_client_id")


@pytest.mark.anyio
async def test_verify_google_id_token_unverified_email() -> None:
    """Verify that Google tokens without verified email are rejected."""
    from unittest.mock import MagicMock
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "iss": "https://accounts.google.com",
        "aud": "my_client_id",
        "email": "unverified@gmail.com",
        "email_verified": False,
        "sub": "123456789",
    }

    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        with pytest.raises(UnauthorizedException, match="email address is not verified"):
            await verify_google_id_token("mock_token", client_id="my_client_id")



# ==============================================================================
# 5. Data Tier Atomic Duplicate Email Protection
# ==============================================================================


@pytest.mark.anyio
async def test_in_memory_repo_duplicate_email_conflict() -> None:
    """Verify that in_memory_user_repo raises ConflictException on duplicate email creation."""
    user_data = {
        "id": "usr_test_1",
        "email": "concurrent@test.com",
        "name": "Concurrent One",
        "hashed_password": "hash",
    }
    await in_memory_user_repo.create_user(user_data)

    user_data_dup = {
        "id": "usr_test_2",
        "email": "concurrent@test.com",
        "name": "Concurrent Two",
        "hashed_password": "hash",
    }
    with pytest.raises(ConflictException, match="already exists"):
        await in_memory_user_repo.create_user(user_data_dup)
