"""Authentication REST API endpoints (Email/Password registration, login, Google OAuth)."""

import time
import uuid
from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import (
    create_access_token,
    hash_password,
    verify_google_id_token,
    verify_password,
)
from app.repositories.user_repository import (
    BaseUserRepository,
    get_user_repository,
    utc_now_iso,
)
from app.schemas.auth import (
    GoogleAuthRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def generate_user_id() -> str:
    """Generate a clean unique user identifier."""
    ts = hex(int(time.time() * 1000))[2:]
    rand = uuid.uuid4().hex[:6]
    return f"usr_{ts}_{rand}"


def set_auth_cookie(response: Response, token: str) -> None:
    """Attach secure HttpOnly session cookie to the response."""
    settings = get_settings()
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        max_age=settings.AUTH_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register with Email and Password",
    description="Create a new authenticated account using email and password.",
)
async def register(
    payload: UserRegisterRequest,
    response: Response,
    user_repo: BaseUserRepository = Depends(get_user_repository),
) -> TokenResponse:
    """Register a new user account with secure password hashing."""
    email = payload.email.strip().lower()
    existing = await user_repo.get_by_email(email)
    if existing:
        raise ConflictException(message="An account with this email address already exists. Please log in.")

    now = utc_now_iso()
    user_id = generate_user_id()
    hashed = hash_password(payload.password)

    user_doc = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "hashed_password": hashed,
        "provider": "local",
        "created_at": now,
        "updated_at": now,
    }

    created = await user_repo.create_user(user_doc)
    user_resp = UserResponse(
        id=created["id"],
        email=created["email"],
        name=created["name"],
        auth_provider="local",
        created_at=created["created_at"],
    )

    token = create_access_token(user_id=user_id, email=email, name=user_resp.name)
    set_auth_cookie(response, token)

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with Email and Password",
    description="Authenticate an existing user using email and password.",
)
async def login(
    payload: UserLoginRequest,
    response: Response,
    user_repo: BaseUserRepository = Depends(get_user_repository),
) -> TokenResponse:
    """Authenticate user credentials and issue a verified JWT access token."""
    email = payload.email.strip().lower()
    user = await user_repo.get_by_email(email)

    # Use generic credential error to prevent account enumeration
    if not user:
        raise UnauthorizedException(message="Invalid email or password.")

    hashed = user.get("hashed_password")
    if not hashed or not verify_password(payload.password, hashed):
        raise UnauthorizedException(message="Invalid email or password.")

    user_resp = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        auth_provider=user.get("provider", "local"),
        created_at=user.get("created_at", ""),
    )

    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    set_auth_cookie(response, token)

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.post(
    "/google",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Google Sign-In",
    description="Authenticate or register a user using a verified Google OpenID Connect token.",
)
async def google_auth(
    payload: GoogleAuthRequest,
    response: Response,
    user_repo: BaseUserRepository = Depends(get_user_repository),
) -> TokenResponse:
    """Verify Google ID token and return an authenticated user session."""
    google_data = await verify_google_id_token(payload.id_token)
    google_sub = google_data["google_sub"]
    email = google_data["email"]
    name = google_data["name"]

    # 1. Lookup user by Google subject ID
    user = await user_repo.get_by_google_sub(google_sub)

    # 2. If not found by Google sub, check by email
    if not user:
        existing_by_email = await user_repo.get_by_email(email)
        if existing_by_email:
            # If account was created locally with a password, protect against account hijacking
            if existing_by_email.get("provider") == "local" and not existing_by_email.get("google_sub"):
                raise ConflictException(
                    message="An account with this email already exists with password login. Please log in with your email and password."
                )
            # Link google_sub to existing account
            user = await user_repo.update_user(existing_by_email["id"], {"google_sub": google_sub})
        else:
            # Create new user via Google OAuth
            now = utc_now_iso()
            user_id = generate_user_id()
            user_doc = {
                "id": user_id,
                "email": email,
                "name": name,
                "hashed_password": None,
                "provider": "google",
                "google_sub": google_sub,
                "created_at": now,
                "updated_at": now,
            }
            user = await user_repo.create_user(user_doc)

    if not user:
        raise UnauthorizedException(message="Failed to establish user identity from Google authentication.")

    user_resp = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        auth_provider=user.get("provider", "google"),
        created_at=user.get("created_at", ""),
    )

    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    set_auth_cookie(response, token)

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile",
    description="Retrieve the authenticated user's profile.",
)
async def get_me(current_user: UserResponse = Depends(get_current_user)) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout User",
    description="Invalidate session cookie and terminate the authenticated session.",
)
async def logout(response: Response) -> dict:
    """Clear session cookie."""
    settings = get_settings()
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )
    return {"status": "logged_out", "message": "Successfully logged out."}
