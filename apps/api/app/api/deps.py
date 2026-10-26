"""Shared API dependencies, including verified authentication and user identity."""

import re
from typing import Optional
from fastapi import Cookie, Depends, Header

from app.core.exceptions import UnauthorizedException, ValidationException
from app.core.security import decode_access_token
from app.repositories.user_repository import BaseUserRepository, get_user_repository
from app.schemas.auth import UserResponse

OWNER_ID_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+$")
DEFAULT_LOCAL_OWNER = "local-developer-owner"


async def get_current_user(
    authorization: Optional[str] = Header(
        None,
        alias="Authorization",
        description="Standard Bearer authentication token.",
    ),
    cb_auth_token: Optional[str] = Cookie(
        None,
        alias="cb_auth_token",
        description="HttpOnly session cookie.",
    ),
    user_repo: BaseUserRepository = Depends(get_user_repository),
) -> UserResponse:
    """Validate Bearer token or session cookie and return verified user.

    Rejects missing, forged, or expired tokens with HTTP 401 Unauthorized.
    """
    token: Optional[str] = None
    if authorization and authorization.strip():
        parts = authorization.strip().split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1].strip()
        else:
            token = authorization.strip()
    elif cb_auth_token and cb_auth_token.strip():
        token = cb_auth_token.strip()

    if not token:
        raise UnauthorizedException(
            message="Authentication credentials are required. Please log in."
        )

    # Decode and verify JWT signature and claims
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException(message="Token payload is missing subject identity.")

    # Fetch user from persistent repository
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise UnauthorizedException(
            message="User associated with this token no longer exists or has been deactivated."
        )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        auth_provider=user.get("provider", "local"),
        created_at=user.get("created_at", ""),
    )


async def get_optional_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    cb_auth_token: Optional[str] = Cookie(None, alias="cb_auth_token"),
    user_repo: BaseUserRepository = Depends(get_user_repository),
) -> Optional[UserResponse]:
    """Return verified user if credentials are supplied, otherwise None."""
    try:
        return await get_current_user(
            authorization=authorization,
            cb_auth_token=cb_auth_token,
            user_repo=user_repo,
        )
    except UnauthorizedException:
        return None


def get_current_owner_id(
    x_client_owner_id: Optional[str] = Header(
        None,
        alias="X-Client-Owner-ID",
        description="Deprecated legacy owner token.",
    )
) -> str:
    """Legacy helper maintained strictly for backwards-compatibility unit tests.

    WARNING: This header does NOT represent authenticated identity and is bypassed
    by secure user tokens.
    """
    if not x_client_owner_id or not x_client_owner_id.strip():
        return DEFAULT_LOCAL_OWNER

    clean_id = x_client_owner_id.strip()
    if len(clean_id) < 4 or len(clean_id) > 64:
        raise ValidationException(
            message="X-Client-Owner-ID must be between 4 and 64 characters in length."
        )

    if not OWNER_ID_REGEX.match(clean_id):
        raise ValidationException(
            message="X-Client-Owner-ID contains invalid characters. Use alphanumeric, hyphens, and underscores."
        )

    return clean_id
