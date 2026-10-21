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
    ]

    # Logging
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # OneCompiler Code Execution Settings
    ONECOMPILER_API_KEY: Optional[str] = None
    ONECOMPILER_BASE_URL: str = "https://api.onecompiler.com/v1/run"
    ONECOMPILER_HOST_HEADER: Optional[str] = None
    ONECOMPILER_TIMEOUT_SECONDS: float = 15.0
    MAX_SOURCE_CODE_SIZE_BYTES: int = 65536  # 64 KB limit
    MAX_CONCURRENT_EXECUTIONS: int = 5

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
