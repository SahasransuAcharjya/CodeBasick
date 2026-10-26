"""CSRF (Cross-Site Request Forgery) protection middleware.

Validates state-changing HTTP requests (POST, PUT, DELETE, PATCH) when authenticated
via HttpOnly session cookies. Ensures the request originates from a trusted frontend
origin (defined in CORS_ORIGINS) or includes custom preflight-forcing headers.
"""

import logging
from urllib.parse import urlparse
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import get_settings

logger = logging.getLogger("codebasick.csrf")


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """Enforce strict CSRF protection on cookie-authenticated state-changing requests."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Safe HTTP methods do not change state
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return await call_next(request)

        settings = get_settings()

        # Public endpoints that establish new credentials do not rely on existing session cookies
        if request.url.path in (
            f"{settings.API_V1_STR}/auth/login",
            f"{settings.API_V1_STR}/auth/register",
            f"{settings.API_V1_STR}/auth/google",
        ):
            return await call_next(request)

        # Check if the request contains an authenticated session cookie
        has_auth_cookie = settings.AUTH_COOKIE_NAME in request.cookies

        if not has_auth_cookie:
            # Requests without cookies (pure Bearer token or unauthenticated)
            # are not vulnerable to ambient browser CSRF attacks
            return await call_next(request)

        # If the request explicitly uses Authorization Bearer header, it is an explicit API call
        # Browsers cannot attach custom Authorization headers cross-site without CORS preflight
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.strip().lower().startswith("bearer "):
            return await call_next(request)

        # 1. Validate 'Origin' header if provided
        origin = request.headers.get("origin")
        if origin:
            clean_origin = origin.strip().rstrip("/")
            if clean_origin not in settings.CORS_ORIGINS:
                logger.warning("CSRF rejection: untrusted Origin header '%s'", origin)
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "CSRF validation failed: Untrusted Origin header.",
                        "error_code": "CSRF_ORIGIN_UNTRUSTED",
                    },
                )
            return await call_next(request)

        # 2. Fall back to 'Referer' header validation
        referer = request.headers.get("referer")
        if referer:
            try:
                parsed = urlparse(referer)
                referer_origin = f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
                if referer_origin not in settings.CORS_ORIGINS:
                    logger.warning("CSRF rejection: untrusted Referer origin '%s'", referer_origin)
                    return JSONResponse(
                        status_code=403,
                        content={
                            "error": "CSRF validation failed: Untrusted Referer header.",
                            "error_code": "CSRF_REFERER_UNTRUSTED",
                        },
                    )
                return await call_next(request)
            except Exception as parse_err:
                logger.warning("CSRF rejection: unparseable Referer header '%s': %s", referer, parse_err)
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": "CSRF validation failed: Malformed Referer header.",
                        "error_code": "CSRF_REFERER_MALFORMED",
                    },
                )

        # 3. If both Origin and Referer are absent, check for custom request header
        # Browsers cannot send custom headers cross-origin without CORS preflight approval
        x_requested_with = request.headers.get("x-requested-with")
        if x_requested_with and x_requested_with.lower() == "xmlhttprequest":
            return await call_next(request)

        if request.headers.get("x-csrf-protection") == "1":
            return await call_next(request)

        logger.warning(
            "CSRF rejection: Cookie-authenticated %s %s missing Origin, Referer, and custom header",
            request.method,
            request.url.path,
        )
        return JSONResponse(
            status_code=403,
            content={
                "error": "CSRF validation failed: Cookie-authenticated requests require a verified Origin or custom header.",
                "error_code": "CSRF_HEADER_MISSING",
            },
        )
