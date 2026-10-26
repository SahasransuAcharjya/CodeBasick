"""Shared API dependencies, including owner isolation and repository injection."""

import re
from typing import Optional
from fastapi import Header

from app.core.exceptions import ValidationException

OWNER_ID_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+$")
DEFAULT_LOCAL_OWNER = "local-developer-owner"


def get_current_owner_id(
    x_client_owner_id: Optional[str] = Header(
        None,
        alias="X-Client-Owner-ID",
        description="Client workspace owner token for tenant isolation.",
    )
) -> str:
    """Extract and validate the client owner token for project access isolation.

    In the absence of a centralized authentication service, this ensures
    each client or browser workspace operates in an isolated tenant scope.
    """
    if not x_client_owner_id or not x_client_owner_id.strip():
        # Default local developer identity when no header is supplied
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
