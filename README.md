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
- **OneCompiler Code Execution Integration**: Dedicated backend proxy at `POST /api/  - **Persistent Project Storage (Phase 7B & 7B.1)**:
  - **Database Persistence**: Managed MongoDB connection via async `motor` driver with startup connection lifecycle, graceful fallback handling, and optimized indexes on `owner_id`, compound unique `(owner_id, id)`, and `updated_at`.
  - **Project & File Management API**: RESTful CRUD endpoints (`POST /api/v1/projects`, `GET /api/v1/projects`, `GET /api/v1/projects/{id}`, `PUT /api/v1/projects/{id}`, `DELETE /api/v1/projects/{id}`, and sub-file routes).
  - **Truthful Autosave & Status Indicators**: Unambiguous visual indicators: `Saved (Cloud)` for confirmed database persistence, `Saved (Local Only)` when operating in offline/browser-cached fallback, `Saving...`, `Save`, and `Save Failed (Retry)`.
  - **Buffer Safety & Project Switching**: Active edits are flushed immediately on component unmount and cross-project navigation, with stale-sequence protection preventing out-of-order save status overwrites.
  - **Tenant Scoping**: Client ownership isolation via `X-Client-Owner-ID` header. *(Note: This is a client-partitioning token; a cryptographic identity provider is required prior to public multi-user deployment).*
  - **Resilient Dual-Layer Architecture**: Frontend writes synchronously to browser cache (`localStorage`) and debounces persistence to FastAPI/MongoDB. If the database or API is unreachable, local code is never lost and users can trigger manual retry synchronization.

---

## Database Configuration (MongoDB Atlas & Local)

For production and persistent development storage, configure MongoDB in `apps/api/.env`:

```env
# MongoDB Atlas Connection URI (or local instance: mongodb://127.0.0.1:27017)
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
- **Graceful Unreachability**: If `MONGODB_URI` is unconfigured or MongoDB is temporarily unreachable, FastAPI gracefully logs a warning and falls back to in-memory mode without crashing the API or interrupting OneCompiler code execution or AI tutoring features.
- **Truthful Save States**: The API passes `X-Storage-Backend: mongodb` (or `in_memory`), enabling the frontend to distinguish real cloud database saves from local-only saves.
- **Ephemeral Filesystem Warning**: Avoid storing persistent projects on ephemeral container filesystems (e.g. Heroku or Render free dyno ephemeral disks) which wipe on restart. Always connect to a persistent managed database like MongoDB Atlas.
- **Indexes Created**:
  - `idx_owner_id`: single index on `owner_id` for fast listing by user/client.
  - `idx_owner_project_unique`: unique compound index on `(owner_id, id)` for strict isolation.
  - `idx_updated_at`: descending index on `updated_at` for sorted project queries.

- **Authentication & Secure Project Ownership (Phase 8 & 8.1 Security Hardening)**:
  - **Account Registration & Login**: Full email/password registration (`POST /api/v1/auth/register`) with normalized lowercase emails, duplicate prevention, and bcrypt password hashing. User login (`POST /api/v1/auth/login`) with generic error messages preventing user enumeration.
  - **No Long-Lived Storage in LocalStorage**: Authentication tokens are NEVER stored in browser `localStorage` or `sessionStorage`. Browser session state is maintained securely via `HttpOnly`, `SameSite=Lax` cookies. Page refreshes query `/api/v1/auth/me` with `credentials: "include"`, ensuring zero client-side token exposure to XSS.
  - **Strict CSRF Protection**: Dedicated `CSRFProtectionMiddleware` validates state-changing requests (`POST`, `PUT`, `DELETE`, `PATCH`) when cookie authentication is present. Requests must come from trusted origins (`CORS_ORIGINS`) or include custom headers (`X-Requested-With: XMLHttpRequest`). Untrusted origins receive HTTP 403 Forbidden. Pure Bearer token requests remain supported for non-browser API clients.
  - **In-Memory Rate Limiting**: Brute-force protection on `/login` (10 attempts/min per IP/email) and `/register` (5 attempts/min per IP). Exceeded thresholds return HTTP 429 Too Many Requests with retry-after guidance.
  - **Google Sign-In**: OpenID Connect token verification endpoint (`POST /api/v1/auth/google`) validating Google token signatures, issuer, audience, and verified email status. Requires configured `GOOGLE_CLIENT_ID` and protects against account hijacking by preventing unverified automatic linking of password-based accounts.
  - **Secure Session Management**: Signed HS256 JWT access tokens with 7-day expiration and secure `HttpOnly` session cookie (`cb_auth_token`). Real logout endpoint (`POST /api/v1/auth/logout`) that invalidates cookie credentials. In production, `AUTH_COOKIE_SECURE=True` is strictly enforced.
  - **Independent FastAPI Identity Verification**: FastAPI verifies credentials server-side via `get_current_user` dependency. Client-supplied headers (e.g. `X-Client-Owner-ID`) are untrusted and completely ignored for authorization.
  - **Protected Project & File APIs**: All project and sub-file routes enforce ownership scoped to the authenticated user ID. Cross-user access attempts return HTTP 404 (preventing info leakage), and unauthenticated requests return HTTP 401.
  - **Preserved Local Workspaces**: Anonymous local browser workspaces are preserved. When logged in, users can click "Import All to Cloud" to promote local workspaces into authenticated cloud projects.
  - **Users Collection & Indexes**: MongoDB `users` collection initialized with unique indexes on `id`, `email`, and sparse unique index on `google_sub`. Concurrent duplicate registrations are caught atomically at the database tier.

---

## Database & Authentication Configuration

Configure `apps/api/.env`:

```env
# MongoDB Atlas Connection URI (or local instance: mongodb://127.0.0.1:27017)
# Format: mongodb+srv://<username>:<password>@<cluster-address>/<dbname>?retryWrites=true&w=majority
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=codebasick
MONGODB_CONNECT_TIMEOUT_MS=5000

# Authentication & Security (Phase 8 & 8.1)
AUTH_SECRET_KEY="replace-with-a-secure-random-secret-key-at-least-32-bytes"
AUTH_ALGORITHM="HS256"
AUTH_TOKEN_EXPIRE_MINUTES=10080
AUTH_COOKIE_NAME="cb_auth_token"
AUTH_COOKIE_SECURE=false # Enforced True when ENVIRONMENT="production"
AUTH_COOKIE_SAMESITE="lax"

# In-Memory Rate Limiting
AUTH_RATE_LIMIT_LOGIN_PER_MINUTE=10
AUTH_RATE_LIMIT_REGISTER_PER_MINUTE=5

# Google OAuth 2.0 / OpenID Connect (Optional for Google Sign-In)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

And in `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
```

### Running Tests:
- Run complete backend test suite (122 automated tests):
  ```powershell
  cd apps/api
  pytest -v
  ```
- Run live MongoDB integration tests:
  ```powershell
  cd apps/api
  pytest -v tests/test_mongodb_live.py
  ```
- Run authentication and security audit tests:
  ```powershell
  cd apps/api
  pytest -v tests/test_auth.py tests/test_project_authorization.py tests/test_security_audit.py
  ```
- Run frontend typecheck, linting, and production build:
  ```powershell
  cd apps/web
  npm run typecheck
  npm run lint
  npm run build
  ```



