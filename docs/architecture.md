# CodeBasick System Architecture: Phase 4 Interactive Code Workspace

## Overview
CodeBasick is an AI-powered, beginner-friendly online programming IDE designed to provide a structured, accessible coding learning experience.

Phase 4 establishes the first functional, client-side browser coding workspace featuring:
- **Monaco Editor Integration**: Embedded full-featured client-side editor with dark charcoal styling (`codebasick-dark`), automatic layout resizing, syntax highlighting, bracket matching, and configurable indentation/word-wrap.
- **Language Support**: First-class support for **C (GCC C11)** and **Python 3**, with distinct starter templates and language-mode switching.
- **Buffer & Tab Isolation**: Independent source buffers preserved in memory when switching languages or tabs, avoiding silent overwrites or code loss.
- **Workspace Navigation & Management**: Connected dashboard creation flow linking to dynamic `/workspace/[id]` routes and `/workspace` redirect.
- **Output & Diagnostics Panel**: Multi-tab console (Output, Diagnostics, Execution Status) with an honest, non-deceptive Run button contract explicitly stating that Judge0 sandbox execution arrives in Phase 5.

## Monorepo Directory Layout

```
CodeBasick/
├── apps/
│   ├── web/                     # Frontend Next.js 16 Application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── docs/        # Guides & documentation route
│   │   │   │   ├── settings/    # Editor preferences & local configuration
│   │   │   │   ├── workspace/
│   │   │   │   │   ├── [id]/    # Interactive Monaco workspace route
│   │   │   │   │   └── page.tsx # Redirect to latest/default workspace
│   │   │   │   ├── globals.css  # Design system tokens & CSS reset
│   │   │   │   ├── layout.tsx   # Root layout (fonts & metadata)
│   │   │   │   ├── not-found.tsx# Accessible 404 page
│   │   │   │   └── page.tsx     # Workspaces dashboard & creation modal
│   │   │   ├── components/
│   │   │   │   ├── layout/      # AppShell (collapsible sidebar, sticky top nav)
│   │   │   │   └── ui/          # Button, Input, Textarea, Card, Badge, Modal, EmptyState, Skeleton
│   │   │   ├── features/
│   │   │   │   └── workspace/   # Phase 4 Modular Workspace System
│   │   │   │       ├── CodeEditor.tsx          # Monaco Editor wrapper (client-side only)
│   │   │   │       ├── EditorTabs.tsx          # Multi-tab bar with close & active indicators
│   │   │   │       ├── FileExplorer.tsx        # File tree sidebar & safe file creator modal
│   │   │   │       ├── OutputPanel.tsx         # Tabbed console (Output, Diagnostics, Status)
│   │   │   │       ├── WorkspaceToolbar.tsx    # Compact toolbar (language, run, panel toggles)
│   │   │   │       ├── WorkspaceShell.tsx      # Orchestrator for buffer preservation & state
│   │   │   │       ├── workspace.constants.ts  # C & Python templates & extension mappings
│   │   │   │       ├── workspace.types.ts      # Workspace domain TypeScript definitions
│   │   │   │       └── index.ts                # Feature barrel export
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Storage manager & constants
│   │   │   └── types/           # Domain TypeScript definitions
│   │   ├── package.json         # Next.js 16, React 19, @monaco-editor/react 4.7.0, Lucide
│   │   ├── tsconfig.json        # Strict TypeScript compiler settings
│   │   └── next.config.ts       # Next.js 16 configuration
│   └── api/                     # Backend Python FastAPI Microservice (Untouched in Phase 4)
│       ├── app/
│       │   ├── api/             # Routes (health liveness & readiness) & router
│       │   ├── core/            # Config (Pydantic Settings), exceptions, logging
│       │   ├── models/          # Reserved for future data models
│       │   ├── schemas/         # Health and readiness response models
│       │   ├── services/        # Business logic services
│       │   ├── utils/           # Utility helpers
│       │   └── main.py          # Application factory & middleware
│       ├── tests/               # Pytest automated test suite (16 tests)
│       └── pyproject.toml       # Python package specification
├── docs/                        # Architecture & foundation documentation
├── .gitignore                   # Monorepo git ignore rules
└── README.md                    # Root project documentation & operational guide
```

## Architectural Separation of Concerns

### 1. Monaco Editor Architecture (`CodeEditor.tsx`)
- **Package**: `@monaco-editor/react` (version `4.7.0`).
- **SSR Safety**: Monaco is rendered strictly client-side via `@monaco-editor/react` with a dark skeleton fallback during initialization, avoiding server rendering mismatches.
- **Theme Definition**: Custom Monaco theme `codebasick-dark` registered before editor mount using project tokens:
  - Background: `var(--bg-canvas)` (`#0b0c0e`)
  - Gutter & Line Numbers: `var(--text-muted)` (`#6b7280`)
  - Selection: `#1e293b`
  - Cursor: `var(--accent-primary)` (`#10b981`)
- **Isolation**: Each file buffer maintains independent state. When switching files or languages, editor models are loaded with appropriate language modes without unmounting or memory leaks.

### 2. Multi-File Model & Buffer Preservation (`WorkspaceShell.tsx`)
- **Source Buffers**: Each file is modeled as `{ id, name, content, language, isStarter }`.
- **Language Switch**: Switching languages from C to Python (or vice versa) does NOT overwrite the active buffer. If an existing file matching the chosen language exists, it is activated. If not, a new starter file is added to the workspace.
- **Tab State**: Users can open, switch, and close tabs. Active content edits are written directly to the in-memory/localStorage workspace model.

### 3. Execution & Output Contract (`OutputPanel.tsx` & `apps/api/app/services/onecompiler.py`)
- **Remote Sandbox Engine**: Code execution is powered by **OneCompiler Code Execution API** (`https://api.onecompiler.com/v1/run` or RapidAPI proxy).
- **Backend Proxy & Isolation**: The FastAPI backend acts as an authenticated, validating gateway. The provider API key is stored exclusively on the backend (`ONECOMPILER_API_KEY`) and is never sent to the browser, logged, or included in responses.
- **Run Button Workflow**:
  - Submits validated source code and project files to `POST /api/v1/execute`.
  - Validates language (`c` or `python`) and code size (maximum 64 KB).
  - Enforces request timeouts (15.0s) and concurrency limits.
  - Streams actual stdout, stderr, and compiler diagnostics returned by the remote sandbox into the Output and Diagnostics panels.
  - If unconfigured, provides a clear, honest notice instructing the administrator/user to set `ONECOMPILER_API_KEY`.
- **Security Guarantees**:
  - Strictly **no** client-side `eval()` or backend `exec()`, `eval()`, or subprocess execution.
  - Untrusted code never executes on the host FastAPI server.
- **Multi-Tab Output**:
  - `Output`: Real-time execution logs, stdout, stderr, and submission telemetry.
  - `Diagnostics`: Compiler warnings, syntax diagnostics, and error stream analysis.
  - `Status`: Runtime target (GCC C11 / Python 3.13), execution status, timing metrics (execution & compilation time in ms), memory usage (KB), and security mode.

### 4. Responsiveness & Layout
- **Desktop (>= 768px)**: 3-panel IDE layout with compact toolbar (48px), File Explorer sidebar (220px), central Monaco editor, and bottom output panel (240px). Explorer and Output can be individually collapsed.
- **Mobile (< 768px)**: Toolbar compacts, File Explorer transforms into an on-demand slide-over drawer, and Monaco editor takes 100% available width with word wrapping enabled to prevent horizontal overflow.
