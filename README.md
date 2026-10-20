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

## Implemented Workspace Capabilities (Phase 4)

- **Monaco Editor Client-Side Integration**: Embedded Monaco Editor via `@monaco-editor/react` (v4.7.0) with dark charcoal palette `codebasick-dark`, monospace font, bracket matching, automatic indentation, and responsive resizing.
- **Languages**: **C (GCC C11)** and **Python 3**, with distinct starter templates.
- **Buffer Safety**: Switching between languages or tabs maintains isolated in-memory source buffers. User edits are never silently overwritten.
- **Multi-File Explorer**: Add and switch files (`.c`, `.h`, `.py`, `.js`, etc.) with extension validation and duplicate prevention.
- **Output & Diagnostics Panel**: Real console with Output, Diagnostics, and Execution Status tabs.
- **Honest Run Button**: Validates buffer metrics without fabricating fake execution output, confirming sandbox execution arrives with Judge0 in Phase 5.
- **Responsive Workspace**: Automatic sidebar collapse and overlay mode for mobile viewports (< 768px).
