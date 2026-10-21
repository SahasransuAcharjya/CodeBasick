"""Comprehensive automated tests for OneCompiler execution service and endpoint."""

from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def test_settings() -> Settings:
    """Fixture providing isolated Settings with a mock OneCompiler API key."""
    return Settings(
        ENVIRONMENT="test",
        DEBUG=False,
        ONECOMPILER_API_KEY="test_mock_secret_api_key_12345",
        ONECOMPILER_BASE_URL="https://api.onecompiler.com/v1/run",
        ONECOMPILER_TIMEOUT_SECONDS=5.0,
    )


@pytest.fixture
def unconfigured_settings() -> Settings:
    """Fixture providing Settings with no OneCompiler API key."""
    return Settings(
        ENVIRONMENT="test",
        DEBUG=False,
        ONECOMPILER_API_KEY=None,
    )


@pytest.fixture
def client(test_settings: Settings) -> TestClient:
    """Fixture providing a TestClient configured with test_settings."""
    app = create_app(test_settings)
    return TestClient(app)


@pytest.fixture
def unconfigured_client(unconfigured_settings: Settings) -> TestClient:
    """Fixture providing a TestClient without an API key."""
    app = create_app(unconfigured_settings)
    return TestClient(app)


def test_execute_unconfigured_api_key(unconfigured_client: TestClient) -> None:
    """Test that missing API key returns status 'unconfigured' with helpful guidance."""
    payload = {
        "language": "python",
        "code": "print('hello')",
    }
    response = unconfigured_client.post("/api/v1/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "unconfigured"
    assert "ONECOMPILER_API_KEY" in data["message"]
    assert data["stdout"] is None


def test_execute_python_success(client: TestClient) -> None:
    """Test successful Python code execution."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": "Hello from Python!\n",
            "stderr": None,
            "exception": None,
            "status": "success",
            "executionTime": 15,
            "compilationTime": 0,
            "memoryUsed": 8420,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "print('Hello from Python!')",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["stdout"] == "Hello from Python!\n"
        assert data["stderr"] is None
        assert data["executionTime"] == 15
        assert data["language"] == "python"

        # Verify correct payload sent to OneCompiler
        mock_post.assert_called_once()
        _, kwargs = mock_post.call_args
        sent_json = kwargs["json"]
        assert sent_json["language"] == "python"
        assert sent_json["files"][0]["name"] == "main.py"
        assert sent_json["files"][0]["content"] == "print('Hello from Python!')"


def test_execute_c_success(client: TestClient) -> None:
    """Test successful C code compilation and execution."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": "Hello from C!\n",
            "stderr": None,
            "exception": None,
            "status": "success",
            "compilationTime": 68,
            "executionTime": 8,
            "memoryUsed": 2100,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "c",
                "code": "#include <stdio.h>\nint main() { printf(\"Hello from C!\\n\"); return 0; }",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["stdout"] == "Hello from C!\n"
        assert data["compilationTime"] == 68
        assert data["executionTime"] == 8
        assert data["language"] == "c"


def test_execute_c_compilation_failure(client: TestClient) -> None:
    """Test C code compilation error returned by OneCompiler."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": None,
            "stderr": "main.c: In function 'main':\nmain.c:3:5: error: expected ';' before 'return'\n",
            "exception": None,
            "status": "failed",
            "compilationTime": 42,
            "executionTime": 0,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "c",
                "code": "#include <stdio.h>\nint main() { printf(\"Missing semicolon\") return 0; }",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert data["stdout"] is None
        assert "error: expected ';'" in data["stderr"]
        assert data["compilationTime"] == 42


def test_execute_python_runtime_exception(client: TestClient) -> None:
    """Test Python runtime exception returned by OneCompiler."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": None,
            "stderr": "Traceback (most recent call last):\n  File 'main.py', line 1, in <module>\n    1 / 0\nZeroDivisionError: division by zero\n",
            "exception": "ZeroDivisionError: division by zero",
            "status": "failed",
            "executionTime": 12,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "print(1 / 0)",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "failed"
        assert "ZeroDivisionError" in data["stderr"]
        assert data["exception"] == "ZeroDivisionError: division by zero"


def test_execute_timeout(client: TestClient) -> None:
    """Test timeout handling when OneCompiler takes too long to respond."""
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Read timed out")

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "while True: pass",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "timeout"
        assert "timed out" in data["exception"].lower()


def test_execute_invalid_language(client: TestClient) -> None:
    """Test rejection of unsupported programming languages."""
    for invalid_lang in ["javascript", "ruby", "rust", "html-css", ""]:
        response = client.post(
            "/api/v1/execute",
            json={
                "language": invalid_lang,
                "code": "console.log('invalid')",
            },
        )
        assert response.status_code == 422
        data = response.json()
        assert "Unsupported language" in str(data) or "validation failed" in str(data).lower()


def test_execute_empty_code(client: TestClient) -> None:
    """Test rejection of requests with empty code and files."""
    response = client.post(
        "/api/v1/execute",
        json={
            "language": "python",
            "code": "   ",
        },
    )
    assert response.status_code == 422


def test_execute_oversized_code(client: TestClient) -> None:
    """Test rejection of source code exceeding the 64 KB safety limit."""
    huge_code = "# " + ("A" * 70000)
    response = client.post(
        "/api/v1/execute",
        json={
            "language": "python",
            "code": huge_code,
        },
    )
    assert response.status_code == 422
    assert "exceeds maximum limit" in response.text


def test_execute_provider_auth_failure(client: TestClient) -> None:
    """Test that a 401/403 from OneCompiler returns 502 without leaking secrets."""
    mock_response = httpx.Response(
        status_code=401,
        json={"error": "Invalid API Key"},
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "print(1)",
            },
        )

        assert response.status_code == 502
        assert "Authentication with OneCompiler failed" in response.json()["error"]
        # Ensure secret key is NEVER exposed in the response
        assert "test_mock_secret_api_key_12345" not in response.text


def test_execute_provider_rate_limit(client: TestClient) -> None:
    """Test that a 429 from OneCompiler returns 429 to client."""
    mock_response = httpx.Response(
        status_code=429,
        json={"error": "Too Many Requests"},
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "print(1)",
            },
        )

        assert response.status_code == 429
        assert "rate limit" in response.json()["error"].lower()


def test_execute_provider_server_error(client: TestClient) -> None:
    """Test that 500 from OneCompiler returns 502 Bad Gateway to client."""
    mock_response = httpx.Response(
        status_code=500,
        text="Internal Server Error",
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "c",
                "code": "int main() { return 0; }",
            },
        )

        assert response.status_code == 502
        assert "temporarily unavailable" in response.json()["error"]


def test_execute_network_connection_error(client: TestClient) -> None:
    """Test connection error handling."""
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.ConnectError("Connection refused")

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "c",
                "code": "int main() { return 0; }",
            },
        )

        assert response.status_code == 502
        assert "Failed to connect" in response.json()["error"]


def test_execute_multi_file_support(client: TestClient) -> None:
    """Test executing a multi-file project with headers and source files."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": "Result: 42\n",
            "stderr": None,
            "exception": None,
            "status": "success",
            "executionTime": 10,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        payload = {
            "language": "c",
            "files": [
                {"name": "main.c", "content": "#include \"utils.h\"\nint main() { print_result(); return 0; }"},
                {"name": "utils.h", "content": "void print_result();"},
                {"name": "utils.c", "content": "#include <stdio.h>\nvoid print_result() { printf(\"Result: 42\\n\"); }"},
            ],
        }

        response = client.post("/api/v1/execute", json=payload)
        assert response.status_code == 200
        assert response.json()["stdout"] == "Result: 42\n"

        _, kwargs = mock_post.call_args
        assert len(kwargs["json"]["files"]) == 3


def test_execute_empty_output(client: TestClient) -> None:
    """Test handling of code execution that produces no stdout."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": "",
            "stderr": None,
            "exception": None,
            "status": "success",
            "executionTime": 5,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "x = 10",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["stdout"] == ""


def test_execute_oversized_stdin(client: TestClient) -> None:
    """Test that stdin exceeding the 64 KB safety limit is rejected."""
    huge_stdin = "input line\n" * 8000  # > 65,536 bytes
    response = client.post(
        "/api/v1/execute",
        json={
            "language": "python",
            "code": "import sys; print(sys.stdin.read())",
            "stdin": huge_stdin,
        },
    )
    assert response.status_code == 422
    assert "Standard input payload size" in response.text


def test_execute_with_stdin_passthrough(client: TestClient) -> None:
    """Test that valid stdin is correctly packaged and sent to OneCompiler."""
    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": "Hello, Alice!\n",
            "stderr": None,
            "exception": None,
            "status": "success",
            "executionTime": 8,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "name = input(); print(f'Hello, {name}!')",
                "stdin": "Alice",
            },
        )

        assert response.status_code == 200
        assert response.json()["stdout"] == "Hello, Alice!\n"

        _, kwargs = mock_post.call_args
        assert kwargs["json"]["stdin"] == "Alice"


def test_execute_malformed_non_json_provider_response(client: TestClient) -> None:
    """Test handling when provider returns HTML or invalid non-JSON body."""
    mock_response = httpx.Response(
        status_code=200,
        text="<html><body>502 Bad Gateway</body></html>",
        headers={"content-type": "text/html"},
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "python",
                "code": "print(1)",
            },
        )

        assert response.status_code == 502
        assert "unexpected or malformed response" in response.json()["error"].lower()


def test_execute_unexpected_non_dict_provider_response(client: TestClient) -> None:
    """Test handling when provider returns JSON that is not an object/dict."""
    mock_response = httpx.Response(
        status_code=200,
        json=["invalid", "array", "format"],
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={
                "language": "c",
                "code": "int main() { return 0; }",
            },
        )

        assert response.status_code == 502
        assert "unexpected or malformed response" in response.json()["error"].lower()


def test_execute_secret_confidentiality(client: TestClient, caplog: pytest.LogCaptureFixture) -> None:
    """Verify that configured API secrets never leak into client responses or server logs."""
    secret = "test_mock_secret_api_key_12345"

    mock_response = httpx.Response(
        status_code=200,
        json={
            "stdout": "Secret verification passed\n",
            "stderr": None,
            "exception": None,
            "status": "success",
            "executionTime": 5,
        },
        request=httpx.Request("POST", "https://api.onecompiler.com/v1/run"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        response = client.post(
            "/api/v1/execute",
            json={"language": "python", "code": "print('check')"},
        )
        assert response.status_code == 200
        assert secret not in response.text
        assert secret not in caplog.text
