# CodeBasick Backend API

FastAPI backend service powering CodeBasick, an AI-powered beginner-friendly online IDE.

## Requirements
- Python >= 3.10 (tested with Python 3.13.7)

## Setup
Create and activate a virtual environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

*(On macOS/Linux: `source .venv/bin/activate`)*

Install dependencies in editable development mode:
```powershell
pip install --upgrade pip
pip install -e ".[dev]"
```

## Environment Configuration
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

Available configuration options:
- `PROJECT_NAME`: Service display name (default: `"CodeBasick API"`)
- `ENVIRONMENT`: Deployment tier (`"development"`, `"test"`, `"production"`)
- `DEBUG`: Boolean debug flag (enforced `False` in production)
- `API_V1_STR`: Versioned routing prefix (default: `"/api/v1"`)
- `CORS_ORIGINS`: JSON list of allowed origins (wildcards prohibited in production)
- `HOST`: Server host binding (default: `"127.0.0.1"`)
- `PORT`: Server port binding (default: `8000`)
- `LOG_LEVEL`: Logging threshold (`"DEBUG"`, `"INFO"`, `"WARNING"`, `"ERROR"`)
- `ONECOMPILER_API_KEY`: OneCompiler execution API key (kept confidential on backend)
- `ONECOMPILER_BASE_URL`: Execution API endpoint (default: `"https://api.onecompiler.com/v1/run"`)
- `ONECOMPILER_TIMEOUT_SECONDS`: Request timeout in seconds (default: `15.0`)
- `ONECOMPILER_HOST_HEADER`: Optional RapidAPI host header (e.g. `"onecompiler-apis.p.rapidapi.com"`)

## Running the API
Start development server with live reload:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Available endpoints:
- Code Execution: `POST http://127.0.0.1:8000/api/v1/execute`
- Root Health Liveness: `GET http://127.0.0.1:8000/health`
- Versioned Health Liveness: `GET http://127.0.0.1:8000/api/v1/health`
- Versioned Readiness: `GET http://127.0.0.1:8000/api/v1/health/ready`
- Root Metadata: `GET http://127.0.0.1:8000/`
- Interactive OpenAPI Docs: `GET http://127.0.0.1:8000/docs`

## Running Automated Tests
```powershell
pytest -v
```

## Security & Architecture Highlights
- **Decoupled Settings**: Validated via Pydantic Settings with strict production guards.
- **Explicit CORS**: Restricted to designated frontend origins (`http://localhost:3000`).
- **Information Leak Protection**: Unhandled server errors return sanitized responses; API keys are never leaked to clients, logs, or error responses.
- **Isolated Code Execution**: Code is submitted to OneCompiler's cloud sandbox. In-process execution (`eval`, `exec`, `subprocess`) on the FastAPI host is strictly prohibited.

