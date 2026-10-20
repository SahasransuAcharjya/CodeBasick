# CodeBasick System Architecture: Phase 2 Backend Foundation

## Overview
CodeBasick is an AI-powered, beginner-friendly online programming IDE designed to provide a structured, accessible coding learning experience.

Phase 2 establishes a reliable, modular, and testable FastAPI backend foundation adhering to strict security boundaries and clear separation of concerns.

## Workspace Layout

```
CodeBasick/
├── apps/
│   ├── web/                     # Frontend Next.js application
│   │   ├── src/
│   │   │   ├── app/             # Next.js App Router (pages, layout, styles)
│   │   │   ├── components/      # Reusable UI presentation components
│   │   │   ├── features/        # Feature-driven modular slices (editor, tutor, etc.)
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Shared client libraries & constants
│   │   │   └── types/           # Client-side TypeScript definitions
│   │   ├── public/              # Static assets
│   │   ├── package.json         # Frontend dependencies and npm scripts
│   │   ├── tsconfig.json        # Strict TypeScript compiler settings
│   │   ├── next.config.ts       # Next.js 16 configuration
│   │   └── .env.example         # Web environment template
│   └── api/                     # Backend Python FastAPI microservice
│       ├── app/
│       │   ├── api/
│       │   │   ├── routes/
│       │   │   │   ├── __init__.py
│       │   │   │   └── health.py    # Health & readiness route definitions
│       │   │   ├── __init__.py
│       │   │   └── router.py        # Central API router aggregating sub-routes
│       │   ├── core/
│       │   │   ├── __init__.py
│       │   │   ├── config.py        # Pydantic Settings with production validation
│       │   │   ├── exceptions.py    # Safe centralized error handlers
│       │   │   └── logging.py       # Application logging configuration
│       │   ├── models/              # Data models (reserved for Phase 3+)
│       │   ├── schemas/
│       │   │   ├── __init__.py
│       │   │   └── health.py        # Health, Readiness, and Error schemas
│       │   ├── services/            # Business logic services
│       │   ├── utils/               # Utility helpers
│       │   ├── __init__.py
│       │   └── main.py              # Application factory (create_app) & middleware
│       ├── tests/
│       │   ├── __init__.py
│       │   ├── test_config.py       # Configuration and validation tests
│       │   ├── test_cors.py         # CORS origin isolation tests
│       │   ├── test_errors.py       # Exception sanitization tests
│       │   └── test_health.py       # Liveness and readiness tests
│       ├── pyproject.toml           # PEP 621 Python package configuration
│       ├── .env.example             # Backend environment template
│       └── README.md                # Backend service documentation
├── docs/                            # Architecture & project documentation
├── .gitignore                       # Monorepo git ignore rules
└── README.md                        # Root project documentation & operational guide
```

## Architectural Separation of Concerns

1. **Frontend (`apps/web`)**:
   - Framework: Next.js 16 (App Router), React 19, TypeScript 5.
   - Styling: Vanilla CSS and CSS Modules.
   - Strict TypeScript checking enabled (`"strict": true`, `"typecheck": "tsc --noEmit"`).

2. **Backend Architecture (`apps/api`)**:
   - Framework: FastAPI 0.156+, Uvicorn 0.54+, Pydantic v2 + Pydantic Settings.
   - Factory Pattern: `create_app(settings)` enables isolated test harnesses with distinct configurations.
   - Decoupled Configuration: Centralized in `app.core.config.Settings` with production guards (e.g. forbidding `DEBUG=True` or wildcard `*` CORS in production).
   - Versioned Routing: API routers aggregated under `/api/v1` via `app.api.router`.
   - Logging: Standardized in `app.core.logging.setup_logging`.
   - Information Leak Prevention: Centralized exception handlers catch unexpected errors and return sanitized 500 JSON without stack traces or internal filesystem paths.

3. **Security & Phase Boundaries**:
   - No untrusted code execution inside backend (no `eval`, `exec`, or `subprocess`).
   - No MongoDB, Gemini, or Judge0 connections pretending to exist prematurely.
   - CORS strictly restricted to designated frontend origins (`http://localhost:3000`).
