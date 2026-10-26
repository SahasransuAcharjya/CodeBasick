# CodeBasick

CodeBasick is an AI-powered, beginner-friendly online programming IDE designed to make learning to code intuitive, accessible, and structured.

This repository is currently at **Phase 4: Interactive Code Workspace**, featuring a client-side Monaco Editor integration, multi-file tab bar, language selector (C and Python), buffer preservation, collapsible panels, and an honest output console.

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
│   │   │   │   │   ├── [id]/    # Interactive Monaco IDE workspace route
│   │   │   │   │   └── page.tsx # Workspace index redirect
│   │   │   │   ├── globals.css  # Design system tokens & reset
│   │   │   │   ├── layout.tsx   # Root layout (fonts & metadata)
│   │   │   │   ├── not-found.tsx# Custom 404 page
│   │   │   │   └── page.tsx     # Workspaces dashboard & creation modal
│   │   │   ├── components/
│   │   │   │   ├── layout/      # AppShell (collapsible sidebar & top nav)
│   │   │   │   └── ui/          # Button, Input, Textarea, Card, Badge, Modal, EmptyState, Skeleton
│   │   │   ├── features/
│   │   │   │   └── workspace/   # Monaco IDE Workspace Feature
│   │   │   │       ├── CodeEditor.tsx          # Monaco Editor component
│   │   │   │       ├── EditorTabs.tsx          # Tab management
│   │   │   │       ├── FileExplorer.tsx        # File tree & file creation modal
│   │   │   │       ├── OutputPanel.tsx         # Console tabs: Output, Diagnostics, Status
│   │   │   │       ├── WorkspaceToolbar.tsx    # Workspace controls & language switch
│   │   │   │       ├── WorkspaceShell.tsx      # Multi-buffer state orchestrator
│   │   │   │       ├── workspace.constants.ts  # C & Python starters & configs
│   │   │   │       └── workspace.types.ts      # Domain interfaces
│   │   │   ├── lib/             # Storage manager & constants
│   │   │   └── types/           # Domain TypeScript definitions
│   │   ├── package.json         # Node scripts & dependencies
│   │   ├── tsconfig.json        # TypeScript configuration (strict)
│   │   └── next.config.ts       # Next.js 16 configuration
│   └── api/                     # Backend Python FastAPI service (Untouched in Phase 4)
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

## Implemented Capabilities (Phases 4 - 7B)

- **Monaco Editor Client-Side Integration**: Embedded Monaco Editor via `@monaco-editor/react` (v4.7.0) with dark charcoal palette `codebasick-dark`, monospace font, bracket matching, automatic indentation, and responsive resizing.
- **Languages Supported**: **C (GCC C11)** and **Python 3**, with distinct starter templates.
- **Buffer Safety**: Switching between languages or tabs maintains isolated in-memory source buffers. User edits are never silently overwritten.
- **Multi-File Explorer**: Add and switch files (`.c`, `.h`, `.py`, `.js`, etc.) with extension validation and duplicate prevention.
- **Output & Diagnostics Panel**: Real console with Output, Diagnostics, and Execution Status tabs, displaying real-time execution outputs, compiler errors, exceptions, and execution metrics.
- **OneCompiler Code Execution Integration**: Dedicated backend proxy at `POST /api/v1/execute` connected to OneCompiler's cloud code execution engine. The Run button triggers remote sandbox compilation and execution.
- **Gemini AI Tutoring (Phase 6)**: AI Pseudocode generation and line-by-line explanation using Google Gemini API (`POST /api/v1/ai/pseudocode` and `POST /api/v1/ai/explain`).
- **AI Error Doctor & One-Click Fix (Phase 7A)**: Automatic syntax and runtime error diagnosis with interactive unified code diffs and undoable single-click editor fix application (`POST /api/v1/ai/diagnose-error`).
- **Persistent Project Storage (Phase 7B)**:
  - **Database Persistence**: Managed MongoDB Atlas connection via async `motor` driver with startup connection lifecycle, graceful fallback handling, and optimized indexes on `owner_id`, compound unique `(owner_id, id)`, and `updated_at`.
  - **Project & File Management API**: RESTful CRUD endpoints (`POST /api/v1/projects`, `GET /api/v1/projects`, `GET /api/v1/projects/{id}`, `PUT /api/v1/projects/{id}`, `DELETE /api/v1/projects/{id}`, and sub-file routes).
  - **Autosave & Editor Synchronization**: Debounced autosave (1.5s delay) with visual indicators (`Saved`, `Saving...`, `Save`, `Save Failed (Retry)`), keyboard shortcut `Ctrl+S`, project renaming modal, and zero data loss on file switching.
  - **Tenant Isolation**: Protected client ownership model via `X-Client-Owner-ID` header generated per client workspace session, preventing cross-tenant access without exposing public unauthenticated project data.
  - **Resilient Offline Fallback**: Dual-layer architecture: frontend writes synchronously to local cache (`localStorage`) and debounces asynchronous persistence to the FastAPI/MongoDB backend. If the backend or database is offline, local workspaces remain fully functional.

---

## Database Configuration (MongoDB Atlas)

For production and persistent development storage, configure MongoDB Atlas in `apps/api/.env`:

```env
# MongoDB Atlas Connection URI (Replace with your actual cluster URI)
# Format: mongodb+srv://<username>:<password>@<cluster-address>/<dbname>?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://db_user:YOUR_SECRET_PASSWORD@cluster0.example.mongodb.net/?retryWrites=true&w=majority

# MongoDB Database Name
MONGODB_DB_NAME=codebasick

# Connection timeout in milliseconds (defaults to 5000)
MONGODB_CONNECT_TIMEOUT_MS=5000
```

### Database Behavior & Safety:
- **Server-Side Only**: MongoDB credentials are strictly kept in `apps/api/.env` and are never exposed to the Next.js frontend or browser.
- **Connection Lifecycle**: Initialized asynchronously during FastAPI application startup (`lifespan` context) and properly closed on shutdown.
- **Graceful Unreachability**: If `MONGODB_URI` is left unconfigured or MongoDB Atlas is temporarily unreachable, FastAPI gracefully logs a warning and falls back to the in-memory/local repository without crashing the API or blocking code execution or AI tutoring features.
- **Ephemeral Filesystem Warning**: Avoid storing persistent projects on ephemeral container filesystems (e.g. Heroku or Render free dyno ephemeral disks) which wipe on restart. Always connect to a persistent managed database like MongoDB Atlas.
- **Indexes Created**:
  - `idx_owner_id`: single index on `owner_id` for fast listing by user/client.
  - `idx_owner_project_unique`: unique compound index on `(owner_id, id)` for strict isolation.
  - `idx_updated_at`: descending index on `updated_at` for sorted project queries.

