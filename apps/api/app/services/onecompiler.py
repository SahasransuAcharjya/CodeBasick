"""OneCompiler code execution service integration."""

import asyncio
import logging
from typing import Any, Dict, Optional
import httpx

from app.core.config import Settings, get_settings
from app.core.exceptions import ExecutionException
from app.schemas.execution import ExecuteRequest, ExecuteResponse

logger = logging.getLogger("codebasick.services.onecompiler")


class OneCompilerService:
    """Service client for the OneCompiler code execution API."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        """Initialize the OneCompiler service client.

        Args:
            settings: Optional Settings instance; defaults to get_settings().
        """
        self.settings = settings or get_settings()
        self._semaphore = asyncio.Semaphore(self.settings.MAX_CONCURRENT_EXECUTIONS)

    async def execute_code(self, request: ExecuteRequest) -> ExecuteResponse:
        """Submit code for compilation and execution to OneCompiler.

        Args:
            request: Validated ExecuteRequest with language, code/files, and optional stdin.

        Returns:
            ExecuteResponse containing actual stdout, stderr, exception, and metrics.

        Raises:
            ExecutionException: If provider returns HTTP errors or network connectivity fails.
        """
        # 1. Check if provider API key is configured
        api_key = self.settings.ONECOMPILER_API_KEY
        if not api_key or not api_key.strip():
            logger.info("OneCompiler API key is not configured. Returning unconfigured status.")
            return ExecuteResponse(
                status="unconfigured",
                language=request.language,
                stdout=None,
                stderr=None,
                exception=None,
                message=(
                    "OneCompiler API key is not configured on the backend server. "
                    "Set ONECOMPILER_API_KEY in apps/api/.env or environment variables to enable live code execution."
                ),
            )

        # 2. Assemble OneCompiler files payload
        files = []
        if request.files and len(request.files) > 0:
            files = [{"name": f.name, "content": f.content} for f in request.files]
        else:
            default_name = request.filename or ("main.c" if request.language == "c" else "main.py")
            files = [{"name": default_name, "content": request.code or ""}]

        payload: Dict[str, Any] = {
            "language": request.language,
            "files": files,
        }
        if request.stdin is not None:
            payload["stdin"] = request.stdin

        # 3. Assemble sanitized request headers (never log or expose api_key)
        headers: Dict[str, str] = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        if self.settings.ONECOMPILER_HOST_HEADER:
            headers["X-RapidAPI-Key"] = api_key.strip()
            headers["X-RapidAPI-Host"] = self.settings.ONECOMPILER_HOST_HEADER.strip()
        else:
            headers["X-API-Key"] = api_key.strip()

        # 4. Execute request with concurrency limiter and timeout
        async with self._semaphore:
            logger.info(
                "Dispatching execution request to OneCompiler: language=%s, files=%d",
                request.language,
                len(files),
            )

            try:
                async with httpx.AsyncClient(
                    timeout=httpx.Timeout(self.settings.ONECOMPILER_TIMEOUT_SECONDS)
                ) as client:
                    response = await client.post(
                        self.settings.ONECOMPILER_BASE_URL,
                        json=payload,
                        headers=headers,
                    )

                # Handle HTTP status codes
                if response.status_code == 401 or response.status_code == 403:
                    logger.error("OneCompiler authentication rejected (status=%d)", response.status_code)
                    raise ExecutionException(
                        message="Authentication with OneCompiler failed. Please verify your configured API key.",
                        status_code=502,
                    )
                elif response.status_code == 429:
                    logger.warning("OneCompiler rate limit exceeded (status=429)")
                    raise ExecutionException(
                        message="OneCompiler rate limit reached. Please wait before submitting additional code.",
                        status_code=429,
                    )
                elif response.status_code >= 500:
                    logger.error("OneCompiler remote server error (status=%d)", response.status_code)
                    raise ExecutionException(
                        message="OneCompiler service is temporarily unavailable. Please try again later.",
                        status_code=502,
                    )

                response.raise_for_status()

                try:
                    data = response.json()
                    if not isinstance(data, dict):
                        raise ValueError("Provider response payload is not a JSON object")
                except Exception as parse_err:
                    logger.error("Failed to parse OneCompiler response as JSON: %s", str(parse_err))
                    raise ExecutionException(
                        message="Received an unexpected or malformed response from the execution provider.",
                        status_code=502,
                    )

            except httpx.TimeoutException:
                logger.warning(
                    "Execution request timed out after %.1f seconds for language=%s",
                    self.settings.ONECOMPILER_TIMEOUT_SECONDS,
                    request.language,
                )
                return ExecuteResponse(
                    status="timeout",
                    language=request.language,
                    stdout=None,
                    stderr=None,
                    exception=f"Execution timed out after {self.settings.ONECOMPILER_TIMEOUT_SECONDS} seconds.",
                    message="The code execution provider timed out. Check for infinite loops or long-running operations.",
                )

            except httpx.HTTPStatusError as exc:
                logger.error("OneCompiler HTTP status error: %d", exc.response.status_code)
                raise ExecutionException(
                    message=f"OneCompiler returned an error response (HTTP {exc.response.status_code}).",
                    status_code=502,
                )

            except httpx.RequestError as exc:
                logger.error("Connection error while calling OneCompiler: %s", exc.__class__.__name__)
                raise ExecutionException(
                    message="Failed to connect to OneCompiler code execution provider.",
                    status_code=502,
                )

        # 5. Parse and map OneCompiler result
        raw_status = data.get("status")
        stdout = data.get("stdout")
        stderr = data.get("stderr")
        exception = data.get("exception")

        # Determine normalized outcome status
        if raw_status == "failed" or bool(stderr) or bool(exception):
            outcome_status = "failed"
        else:
            outcome_status = "success"

        return ExecuteResponse(
            stdout=stdout,
            stderr=stderr,
            exception=exception,
            status=outcome_status,
            executionTime=data.get("executionTime"),
            compilationTime=data.get("compilationTime"),
            memoryUsed=data.get("memoryUsed"),
            language=request.language,
        )


from fastapi import Depends


def get_onecompiler_service(
    settings: Settings = Depends(get_settings),
) -> OneCompilerService:
    """Return an instance of OneCompilerService configured with active settings."""
    return OneCompilerService(settings=settings)

