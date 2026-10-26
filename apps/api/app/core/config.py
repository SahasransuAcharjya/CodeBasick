"""Application configuration and validated environment settings."""

from functools import lru_cache
from typing import List, Literal, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Validated application configuration settings."""

    # Project metadata
    PROJECT_NAME: str = "CodeBasick API"
    VERSION: str = "0.1.0"

    # Environment
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    DEBUG: bool = True

    # Server routing & binding
    API_V1_STR: str = "/api/v1"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # CORS configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    ALLOWED_METHODS: List[str] = [
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "PATCH",
        "OPTIONS",
        "HEAD",
    ]
    ALLOWED_HEADERS: List[str] = [
        "Content-Type",
        "Authorization",
        "Accept",
        "X-Requested-With",
        "X-Client-Owner-ID",
    ]

    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # OneCompiler Code Execution Settings
    ONECOMPILER_API_KEY: Optional[str] = None
    ONECOMPILER_BASE_URL: str = "https://api.onecompiler.com/v1/run"
    ONECOMPILER_HOST_HEADER: Optional[str] = None
    ONECOMPILER_TIMEOUT_SECONDS: float = 15.0
    MAX_SOURCE_CODE_SIZE_BYTES: int = 65536  # 64 KB limit
    MAX_STDIN_SIZE_BYTES: int = 65536  # 64 KB limit
    MAX_CONCURRENT_EXECUTIONS: int = 5

    # Google Gemini AI Settings
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_FALLBACK_MODELS: List[str] = ["gemini-flash-lite-latest", "gemini-3.5-flash"]
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/models"
    GEMINI_TIMEOUT_SECONDS: float = 25.0
    GEMINI_MAX_OUTPUT_TOKENS: int = 3000
    MAX_AI_CONCURRENT_REQUESTS: int = 5

    # MongoDB Atlas Persistent Storage Settings (Phase 7B)
    MONGODB_URI: Optional[str] = None
    MONGODB_DB_NAME: str = "codebasick"
    MONGODB_CONNECT_TIMEOUT_MS: int = 5000
    MAX_PROJECT_FILES: int = 25
    MAX_PROJECT_FILE_SIZE_BYTES: int = 65536  # 64 KB per source file
    MAX_PROJECT_NAME_LENGTH: int = 100

    # Authentication & Security Settings (Phase 8 & 8.1)
    AUTH_SECRET_KEY: str = "cb_dev_secret_key_needs_replacement_in_production_32bytes_min_length_ok"
    AUTH_ALGORITHM: str = "HS256"
    AUTH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    AUTH_COOKIE_NAME: str = "cb_auth_token"
    AUTH_COOKIE_SECURE: bool = False  # Enforced True in production
    AUTH_COOKIE_SAMESITE: Literal["lax", "strict", "none"] = "lax"
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # Rate Limiting Settings
    AUTH_RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    AUTH_RATE_LIMIT_REGISTER_PER_MINUTE: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("DEBUG", mode="after")
    @classmethod
    def validate_debug(cls, v: bool, info) -> bool:
        """Ensure debug mode is disabled in production."""
        env = info.data.get("ENVIRONMENT")
        if env == "production" and v is True:
            raise ValueError("DEBUG must be set to False in production environment.")
        return v

    @field_validator("AUTH_COOKIE_SECURE", mode="after")
    @classmethod
    def validate_cookie_secure(cls, v: bool, info) -> bool:
        """Enforce Secure cookies in production environment."""
        env = info.data.get("ENVIRONMENT")
        if env == "production" and not v:
            raise ValueError("AUTH_COOKIE_SECURE must be True in production environment.")
        return v

    @field_validator("AUTH_SECRET_KEY", mode="after")
    @classmethod
    def validate_auth_secret(cls, v: str, info) -> str:
        """Ensure secret key is long enough and replaced in production."""
        if len(v) < 32:
            raise ValueError("AUTH_SECRET_KEY must be at least 32 characters long.")
        env = info.data.get("ENVIRONMENT")
        if env == "production" and "dev_secret_key" in v:
            raise ValueError("AUTH_SECRET_KEY must be set to a secure unique secret in production.")
        return v

    @field_validator("CORS_ORIGINS", mode="after")
    @classmethod
    def validate_cors_origins(cls, v: List[str], info) -> List[str]:
        """Validate CORS origins for security rules."""
        env = info.data.get("ENVIRONMENT")
        cleaned_origins: List[str] = []
        for origin in v:
            clean = origin.strip().rstrip("/")
            if not clean:
                continue
            if env == "production" and clean == "*":
                raise ValueError("Wildcard '*' CORS origin is strictly forbidden in production.")
            cleaned_origins.append(clean)
        return cleaned_origins



@lru_cache()
def get_settings() -> Settings:
    """Return a cached Settings instance."""
    return Settings()


def clear_settings_cache() -> None:
    """Clear cached settings for isolated testing."""
    get_settings.cache_clear()
