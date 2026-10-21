"""Centralized error handling and application exceptions."""

import logging
from typing import Any, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("codebasick.exceptions")


STATUS_422 = getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422)


class AppException(Exception):
    """Base exception for application-level errors."""

    def __init__(
        self,
        message: str = "An error occurred while processing the request.",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class NotFoundException(AppException):
    """Resource not found exception."""

    def __init__(self, message: str = "Resource not found.", details: Optional[Any] = None) -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ValidationException(AppException):
    """Custom validation exception."""

    def __init__(self, message: str = "Validation failed.", details: Optional[Any] = None) -> None:
        super().__init__(
            message=message,
            status_code=STATUS_422,
            details=details,
        )


class ExecutionException(AppException):
    """Exception raised during external code execution operations."""

    def __init__(
        self,
        message: str = "Code execution error.",
        status_code: int = status.HTTP_502_BAD_GATEWAY,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
        )


class AIServiceException(AppException):
    """Exception raised during AI tutoring and code explanation operations."""

    def __init__(
        self,
        message: str = "AI service error.",
        status_code: int = status.HTTP_502_BAD_GATEWAY,
        details: Optional[Any] = None,
    ) -> None:
        super().__init__(
            message=message,
            status_code=status_code,
            details=details,
        )


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle custom application exceptions safely."""
    logger.warning("Application error: %s (status: %d)", exc.message, exc.status_code)
    content: dict[str, Any] = {"error": exc.message}
    if exc.details is not None:
        content["details"] = exc.details
    return JSONResponse(status_code=exc.status_code, content=content)


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle request validation errors without leaking stack traces or sensitive inputs."""
    sanitized_errors = []
    for err in exc.errors():
        sanitized_errors.append(
            {
                "field": " -> ".join(str(loc) for loc in err.get("loc", [])),
                "message": err.get("msg", "Invalid input"),
                "type": err.get("type", "value_error"),
            }
        )
    return JSONResponse(
        status_code=STATUS_422,
        content={
            "error": "Request validation failed",
            "details": sanitized_errors,
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected server errors.

    Logs full diagnostic traceback internally on the server, but returns a generic,
    sanitized message to the client to prevent security leaks.
    """
    logger.exception(
        "Unhandled server error on %s %s: %s",
        request.method,
        request.url.path,
        str(exc),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )
