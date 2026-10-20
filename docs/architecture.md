# CodeBasick System Architecture: Phase 3 Frontend Foundation

## Overview
CodeBasick is an AI-powered, beginner-friendly online programming IDE designed to provide a structured, accessible coding learning experience.

Phase 3 establishes a polished, accessible, responsive frontend foundation featuring a developer-focused design system, cohesive reusable component library, responsive application shell, and honest client-side workspace management.

## Workspace Layout

```
CodeBasick/
├── apps/
│   ├── web/                     # Frontend Next.js 16 Application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── docs/        # Architecture & guide documentation view
│   │   │   │   ├── settings/    # Editor preferences & local configuration
│   │   │   │   ├── workspace/
│   │   │   │   │   └── [id]/    # 3-Panel IDE layout interim view
│   │   │   │   ├── globals.css  # Design system tokens & reset
│   │   │   │   ├── layout.tsx   # Root layout (fonts & metadata)
│   │   │   │   ├── not-found.tsx# Intentional accessible 404 page
│   │   │   │   └── page.tsx     # Workspaces dashboard & creation modal
│   │   │   ├── components/
│   │   │   │   ├── layout/      # AppShell (collapsible sidebar, sticky top nav)
│   │   │   │   └── ui/          # Button, Input, Textarea, Card, Badge, Modal, EmptyState, Skeleton
│   │   │   ├── features/        # Feature modules boundary
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Storage manager & constants
│   │   │   └── types/           # Domain TypeScript definitions
│   │   ├── public/              # Static assets
│   │   ├── package.json         # Scripts and dependencies (Next.js 16, React 19, Lucide)
│   │   ├── tsconfig.json        # Strict TypeScript compiler settings
│   │   ├── next.config.ts       # Next.js 16 configuration
│   │   └── .env.example         # Web environment template
│   └── api/                     # Backend Python FastAPI Microservice
│       ├── app/
│       │   ├── api/             # Routes (health liveness & readiness) & router
│       │   ├── core/            # Config (Pydantic Settings), exceptions, logging
│       │   ├── models/          # Reserved for future data models
│       │   ├── schemas/         # Health and readiness response models
│       │   ├── services/        # Business logic services
│       │   ├── utils/           # Utility helpers
│       │   └── main.py          # Application factory & middleware
│       ├── tests/               # Pytest automated test suite (16 tests)
│       ├── pyproject.toml       # Python package specification
│       ├── .env.example         # Backend environment template
│       └── README.md            # Backend service documentation
├── docs/                        # Architecture & foundation documentation
├── .gitignore                   # Monorepo git ignore rules
└── README.md                    # Root project documentation & operational guide
```

## Architectural Separation of Concerns

1. **Frontend Architecture (`apps/web`)**:
   - **Framework**: Next.js 16 (Turbopack, App Router), React 19, TypeScript 5.
   - **Design Direction**: Serious, developer-focused aesthetic using dark charcoal canvas (`#0b0c0e`), multi-level surfaces (`#111317`, `#15181e`, `#1b1e26`), readable off-white text (`#f3f4f6`), and restrained emerald/teal accents (`#10b981`).
   - **Design Tokens**: Fully centralized in `src/app/globals.css` with CSS custom properties for surfaces, borders, typography, radius scale, and focus rings.
   - **Accessible Component Library**: Accessible `Button`, `Input`, `Textarea`, `Card`, `Badge`, `Modal`, `EmptyState`, and `Skeleton`.
   - **Responsive Shell**: Collapsible desktop sidebar (240px / 60px) with keyboard accessibility (`aria-expanded`) and slide-in drawer on mobile viewports (< 768px). Zero horizontal overflow.
   - **Client Persistence**: Real, functional client-side workspace manager stored in `localStorage` without fabricating fake server records or analytics.

2. **Backend Architecture (`apps/api`)**:
   - **Framework**: FastAPI 0.156+, Uvicorn 0.54+, Pydantic v2 + Pydantic Settings.
   - **Versioned Routing**: API endpoints under `/api/v1` with root liveness (`GET /health`) and readiness (`GET /api/v1/health/ready`).
   - **Safe Error Handling**: Internal server errors logged on the server and sanitized to generic 500 JSON without exposing stack traces or local paths.

3. **Phase Boundaries**:
   - In-browser Monaco editor integration deferred to Phase 4.
   - Containerized code execution (Judge0) deferred to Phase 5.
   - AI assistant / tutoring context deferred to Phase 6.
