"""In-memory sliding-window rate limiter for sensitive authentication endpoints.

Note on Production Architecture:
This in-memory rate limiter protects individual FastAPI worker processes from brute-force
attacks. For multi-node or horizontally scaled production deployments, a distributed rate
limiter (e.g. using Redis or an API Gateway / Cloudflare reverse proxy) should be deployed.
"""

import time
import logging
from collections import defaultdict
from typing import Dict, List, Tuple

from app.core.exceptions import RateLimitException

logger = logging.getLogger("codebasick.rate_limit")

# Store timestamp history: key -> list of float timestamps
_rate_limit_history: Dict[str, List[float]] = defaultdict(list)


def check_auth_rate_limit(
    key: str,
    max_attempts: int,
    window_seconds: int = 60,
    action: str = "request",
) -> None:
    """Enforce a sliding-window rate limit on a specific identifier.

    Args:
        key: Unique bucket identifier (e.g. "login:127.0.0.1", "reg:127.0.0.1").
        max_attempts: Maximum allowed attempts within the sliding window.
        window_seconds: Time window duration in seconds (default 60s).
        action: Descriptive action name for error messages.

    Raises:
        RateLimitException: If rate limit is exceeded.
    """
    now = time.time()
    cutoff = now - window_seconds

    # Purge timestamps outside the active sliding window
    timestamps = [ts for ts in _rate_limit_history[key] if ts > cutoff]

    if len(timestamps) >= max_attempts:
        logger.warning(
            "Rate limit exceeded for key '%s': %d attempts in %d seconds.",
            key,
            len(timestamps),
            window_seconds,
        )
        # Calculate approximate wait time
        oldest_in_window = timestamps[0]
        retry_after = max(1, int(oldest_in_window + window_seconds - now))
        raise RateLimitException(
            message=f"Too many {action} attempts. Please try again in {retry_after} seconds.",
            details={"retry_after_seconds": retry_after},
        )

    # Record current attempt
    timestamps.append(now)
    _rate_limit_history[key] = timestamps


def clear_rate_limits() -> None:
    """Reset all rate limiting buckets (used primarily in test fixtures)."""
    _rate_limit_history.clear()
