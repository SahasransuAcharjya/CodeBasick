"""Authentication request and response schemas."""

import re
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class UserRegisterRequest(BaseModel):
    """Payload for registering a new user with email and password."""

    email: str = Field(..., description="User email address.")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 characters).")
    name: str = Field(..., min_length=2, max_length=100, description="Display name.")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Email must be a string.")
        clean = v.strip().lower()
        if not clean or len(clean) > 254:
            raise ValueError("Email length is invalid.")
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format.")
        return clean

    @field_validator("name", mode="before")
    @classmethod
    def clean_name(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Name must be a string.")
        clean = v.strip()
        if len(clean) < 2 or len(clean) > 100:
            raise ValueError("Name must be between 2 and 100 characters.")
        return clean


class UserLoginRequest(BaseModel):
    """Payload for logging in with email and password."""

    email: str = Field(..., description="User email address.")
    password: str = Field(..., min_length=1, description="Account password.")

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Email must be a string.")
        return v.strip().lower()


class GoogleAuthRequest(BaseModel):
    """Payload for Google OAuth 2.0 / OpenID Connect token verification."""

    id_token: str = Field(..., min_length=10, description="Google OpenID Connect ID token.")


class UserResponse(BaseModel):
    """Public user identity model."""

    id: str = Field(..., description="Unique user identifier.")
    email: str = Field(..., description="Normalized user email.")
    name: str = Field(..., description="Display name.")
    auth_provider: Literal["local", "google"] = Field("local", description="Primary authentication provider.")
    created_at: str = Field(..., description="Account creation timestamp (ISO 8601).")


class TokenResponse(BaseModel):
    """Authentication token response payload."""

    access_token: str = Field(..., description="JWT bearer access token.")
    token_type: str = Field("bearer", description="Token scheme.")
    user: UserResponse = Field(..., description="Authenticated user details.")
