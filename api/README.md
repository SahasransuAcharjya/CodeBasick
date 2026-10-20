# CodeBasick Backend API

FastAPI backend service powering CodeBasick.

## Requirements
- Python >= 3.10

## Setup
Create and activate a virtual environment:
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:
```powershell
pip install -e ".[dev]"
```

## Running the API
Start development server:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Running Tests
```powershell
pytest
```
