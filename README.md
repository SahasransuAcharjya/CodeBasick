# CodeBasick

CodeBasick is an AI-powered, beginner-friendly online programming IDE designed to make learning to code intuitive, accessible, and structured.

This repository is currently at **Phase 2: Backend Foundation**, establishing a resilient, modular, and testable FastAPI backend with decoupled configuration, clean routing, safe error handling, and robust CORS isolation.

---

## Workspace Structure

```
CodeBasick/
├── apps/
│   ├── web/                     # Frontend Next.js application
│   │   ├── src/
│   │   │   ├── app/             # App Router layout, pages, and styles
│   │   │   ├── components/      # UI components
│   │   │   ├── features/        # Modular feature slices
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Shared constants and helpers
│   │   │   └── types/           # TypeScript interfaces & types
│   │   ├── public/              # Static assets
│   │   ├── package.json         # Node scripts & dependencies
│   │   ├── tsconfig.json        # TypeScript configuration (strict)
│   │   ├── next.config.ts       # Next.js 16 configuration
│   │   └── .env.example         # Frontend environment template
│   └── api/                     # Backend Python FastAPI service
│       ├── app/
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── __init__.py
│       │   │   │   └── health.py    # Health and readiness endpoints
│       │   │   ├── __init__.py
│       │   │   └── router.py        # Central API router (/api/v1)
│       │   ├── core/
│       │   │   ├── __init__.py
│       │   │   ├── config.py        # Pydantic Settings with validation
│       │   │   ├── exceptions.py    # Centralized safe error handlers
│       │   │   └── logging.py       # Standard application logging
│       │   ├── models/              # Reserved for future data models
│       │   ├── schemas/
│       │   │   ├── __init__.py
│       │   │   └── health.py        # Pydantic response schemas
│       │   ├── services/            # Business logic services
│       │   ├── utils/               # Utility functions
│       │   ├── __init__.py
│       │   └── main.py              # Application factory & middleware
│       ├── tests/
│       │   ├── __init__.py
│       │   ├── test_config.py       # Configuration and validation tests
│       │   ├── test_cors.py         # CORS origin isolation tests
│       │   ├── test_errors.py       # Exception sanitization tests
│       │   └── test_health.py       # Liveness and readiness tests
│       ├── pyproject.toml           # Python package specification
│       ├── .env.example             # Backend environment template
│       └── README.md                # Backend service documentation
├── docs/                            # Architecture & foundation documentation
├── .gitignore                       # Monorepo git ignore rules
└── README.md                        # Root project documentation
```

---

## Runtime Requirements

| Runtime / Tool | Version Tested |
| -------------- | -------------- |
| **Node.js**    | `>= 20.9.0` (tested on `v22.18.0`) |
| **npm**        | `>= 10.0.0` (tested on `11.4.2`) |
| **Python**     | `>= 3.10` (tested on `3.13.7`) |
| **Git**        | Installed |

---

## Environment Setup

### 1. Frontend Configuration
Copy the frontend environment template:
```powershell
cp apps/web/.env.example apps/web/.env.local
```

### 2. Backend Configuration
Copy the backend environment template:
```powershell
cp apps/api/.env.example apps/api/.env
```

---

## Frontend (Next.js + TypeScript)

### Installation
From the root or `apps/web` directory:
```powershell
cd apps/web
npm install
```

### Development Server
```powershell
npm run dev
```
The application will be available at [http://localhost:3000](http://localhost:3000).

### Type Checking & Build
```powershell
# Run strict TypeScript check
npm run typecheck

# Run production build
npm run build
```

---

## Backend (FastAPI + Python)

### Virtual Environment & Installation
From the root or `apps/api` directory:
```powershell
cd apps/api

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install package with dev dependencies
pip install --upgrade pip
pip install -e ".[dev]"
```

*(On Linux / macOS: use `source .venv/bin/activate` instead)*

### Running the API Server
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Root Health Check (Liveness): [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Versioned Health Check: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
- Versioned Readiness Check: [http://127.0.0.1:8000/api/v1/health/ready](http://127.0.0.1:8000/api/v1/health/ready)
- Root Metadata Endpoint: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

### Running Automated Tests
```powershell
pytest -v
```

---

## Current Phase Limitations

- **Phase 2 establishes the foundational backend architecture, routing, configuration, and security handling.**
- The following features are intentionally out of scope for this phase and will be implemented in subsequent phases:
  - Monaco Editor integration
  - Code execution runtime (Judge0)
  - AI Assistant / Gemini LLM integration
  - Database persistence (MongoDB)
  - User authentication and session management
  - PDF export
  - Production containerization & deployment
