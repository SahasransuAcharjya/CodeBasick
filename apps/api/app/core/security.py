"""Security, cryptography, password hashing, and token handling."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
import httpx
import jwt

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedException

logger = logging.getLogger("codebasick.security")


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception as exc:
        logger.warning("Error verifying password hash: %s", exc)
        return False


def create_access_token(
    user_id: str,
    email: str,
    name: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a signed JWT access token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.AUTH_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "codebasick-api",
    }

    token = jwt.encode(payload, settings.AUTH_SECRET_KEY, algorithm=settings.AUTH_ALGORITHM)
    return token


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and verify a signed JWT access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.AUTH_SECRET_KEY,
            algorithms=[settings.AUTH_ALGORITHM],
            issuer="codebasick-api",
            options={"require": ["exp", "sub"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException(message="Session expired. Please log in again.")
    except jwt.InvalidIssuerError:
        raise UnauthorizedException(message="Invalid token issuer.")
    except jwt.PyJWTError as jwt_err:
        logger.warning("JWT verification error: %s", jwt_err)
        raise UnauthorizedException(message="Invalid or tampered authentication token.")


async def verify_google_id_token(id_token: str, client_id: Optional[str] = None) -> Dict[str, Any]:
    """Verify a Google OpenID Connect ID token using Google's public tokeninfo endpoint.

    Validates signature, issuer, audience, and expiration.
    """
    settings = get_settings()
    expected_client_id = client_id or settings.GOOGLE_CLIENT_ID
    if not expected_client_id:
        raise UnauthorizedException(
            message="Google Sign-In is not configured on this server. Google Client ID is missing."
        )

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                logger.warning("Google tokeninfo returned status %d: %s", resp.status_code, resp.text)
                raise UnauthorizedException(message="Invalid or expired Google identity token.")

            data = resp.json()
    except httpx.RequestError as req_err:
        logger.error("Failed to contact Google identity provider: %s", req_err)
        raise UnauthorizedException(message="Failed to contact Google identity verification service.")

    # Validate issuer
    issuer = data.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise UnauthorizedException(message=f"Invalid Google token issuer '{issuer}'.")

    # Validate audience against configured client ID
    token_aud = data.get("aud")
    if token_aud != expected_client_id:
        raise UnauthorizedException(
            message="Google token audience does not match configured Google Client ID."
        )


    # Validate email
    email = data.get("email")
    if not email:
        raise UnauthorizedException(message="Google token does not contain a verified email address.")

    email_verified = data.get("email_verified")
    if email_verified is not True and email_verified != "true":
        raise UnauthorizedException(message="Google email address is not verified by Google.")

    google_sub = data.get("sub")
    if not google_sub:
        raise UnauthorizedException(message="Google token missing stable subject identifier (sub).")

    name = data.get("name") or email.split("@")[0]

    return {
        "google_sub": str(google_sub),
        "email": str(email).strip().lower(),
        "name": str(name).strip(),
    }
