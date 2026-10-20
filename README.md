# CodeBasick

CodeBasick is an AI-powered, beginner-friendly online programming IDE designed to make learning to code intuitive, accessible, and structured.

This repository is currently at **Phase 3: Frontend Foundation and Design System**, providing a dark-charcoal visual system, cohesive component library, responsive application shell, and honest client-side workspace management.

---

## Workspace Structure

```
CodeBasick/
├── apps/
│   ├── web/                     # Frontend Next.js 16 application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── docs/        # Guides & documentation route
│   │   │   │   ├── settings/    # Local editor preferences route
│   │   │   │   ├── workspace/
│   │   │   │   │   └── [id]/    # 3-Panel IDE layout preview
│   │   │   │   ├── globals.css  # Design system tokens & reset
│   │   │   │   ├── layout.tsx   # Root layout (fonts & metadata)
│   │   │   │   ├── not-found.tsx# Custom 404 page
│   │   │   │   └── page.tsx     # Workspaces dashboard
│   │   │   ├── components/
│   │   │   │   ├── layout/      # AppShell (collapsible sidebar & top nav)
│   │   │   │   └── ui/          # Button, Input, Textarea, Card, Badge, Modal, EmptyState, Skeleton
│   │   │   ├── lib/             # Storage manager & constants
│   │   │   └── types/           # Domain TypeScript definitions
│   │   ├── package.json         # Node scripts & dependencies
│   │   ├── tsconfig.json        # TypeScript configuration (strict)
│   │   ├── next.config.ts       # Next.js 16 configuration
│   │   └── .env.example         # Frontend environment template
│   └── api/                     # Backend Python FastAPI service
│       ├── app/
│       │   ├── api/             # Route controllers & endpoints
│       │   ├── core/            # Configuration & settings management
│       │   ├── models/          # Data models
│       │   ├── schemas/         # Pydantic schemas
│       │   ├── services/        # Business logic services
│       │   ├── utils/           # Utility functions
│       │   └── main.py          # Application entrypoint & middleware
│       ├── tests/               # Pytest automated test suite (16 tests)
│       ├── pyproject.toml       # Python package specification
│       └── .env.example         # Backend environment template
├── docs/                        # Architecture & foundation documentation
├── .gitignore                   # Monorepo git ignore rules
└── README.md                    # Root project documentation
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

## Quickstart

### 1. Frontend (Next.js 16)
```powershell
cd apps/web
npm install
npm run dev
```
Available at [http://localhost:3000](http://localhost:3000).

To build and check types:
```powershell
npm run typecheck
npm run build
```

### 2. Backend (FastAPI)
```powershell
cd apps/api
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Readiness Check: [http://127.0.0.1:8000/api/v1/health/ready](http://127.0.0.1:8000/api/v1/health/ready)

To run backend tests:
```powershell
pytest -v
```

---

## Design System & Implemented Pages

- **Design Aesthetic**: Dark charcoal developer environment (`#0b0c0e`, `#15181e`, `#1b1e26`) with restrained emerald/teal accents (`#10b981`), neutral borders, and visible keyboard focus rings.
- **Implemented Routes**:
  - `/` — Workspaces Dashboard with creation modal and truthful first-use empty state.
  - `/workspace/[id]` — 3-Panel IDE shell preview with starter file explorer and roadmap status.
  - `/settings` — Local editor preferences (font size, tab indentation, dark charcoal theme).
  - `/docs` — System documentation and architecture breakdown.
  - `/*` — Intentional, accessible 404 Not Found page.

---

## Current Phase Limitations

- **Phase 3 strictly establishes the frontend foundation, design tokens, application shell, and reusable component library.**
- The following features are intentionally scheduled for subsequent phases:
  - Monaco Editor integration (Phase 4)
  - Code execution runtime with Judge0 (Phase 5)
  - AI Assistant / Gemini LLM integration (Phase 6)
  - Database persistence with MongoDB (Phase 7)
  - User authentication and cloud accounts
  - PDF export
