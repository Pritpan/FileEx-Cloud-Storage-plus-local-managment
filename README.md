# Fileex

> **Make cloud storage feel like your desktop.**

Fileex is a production-quality, cloud-based file management platform that combines the familiarity of a desktop file manager with the power of cloud storage. It is available as a **web application** and a **desktop application**, both backed by a single REST API.

---

## Repository Structure

```
FileEx/
├── docs/        # All planning and architecture documentation (single source of truth)
├── web/         # React + Vite web application
├── server/      # Node.js + Express.js REST API
├── desktop/     # Electron + React desktop application
├── scripts/     # Developer utility scripts (seed, migrate, deploy helpers)
├── notes/       # Personal engineering notebook (not committed)
├── README.md
└── .gitignore
```

> **Architecture rule:** `web/`, `server/`, and `desktop/` are fully independent applications.
> There is no shared package. Each application owns its dependencies, utilities, and build pipeline.
> The only shared contract between them is the REST API specification in `docs/`.

---

## Applications

### Web Application — `web/`

A browser-based file manager built with React 18 and Vite.

| Technology | Role |
|---|---|
| React 18 | Component-based UI |
| Vite | Dev server and bundler |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side navigation |
| Axios | API communication with interceptors |
| TanStack Query | Server state caching and background refetch |
| Zustand | Client state (clipboard, selections, view preferences) |

### Backend API — `server/`

A stateless REST API built with Node.js and Express.js.

| Technology | Role |
|---|---|
| Node.js 20 LTS | JavaScript runtime |
| Express.js | Routing and middleware |
| Prisma | Type-safe ORM and migration system |
| MySQL 8 | Relational metadata storage |
| AWS S3 | File blob object storage |
| JWT + bcrypt | Authentication |
| Zod | Request validation |
| Winston | Structured logging |

### Desktop Application — `desktop/`

A dual-pane file manager built with Electron and React. The left pane manages local files via Electron IPC. The right pane manages cloud storage via the backend REST API.

| Technology | Role |
|---|---|
| Electron | BrowserWindow and OS integration |
| Electron IPC + contextBridge | Safe renderer ↔ main process communication |
| React (independent of `web/`) | Dual-pane file manager UI |
| Node.js `fs`, `path`, `os` | Local filesystem operations (main process only) |
| Axios | Cloud API communication (renderer process) |

---

## Key Architectural Decisions

| Decision | Choice | Reason |
|---|---|---|
| Database | MySQL 8 | ACID transactions, relational model, recursive CTEs for folder trees |
| ORM | Prisma | Type-safe queries, schema-as-code, versioned migrations |
| File Storage | AWS S3 | Presigned URLs, direct client uploads, infinite scale |
| Upload Strategy | Two-phase presigned URL | Backend never handles file bytes — fully stateless |
| Delete Strategy | Soft delete (Trash) | Users can recover accidentally deleted files |
| Clipboard | Client-side Zustand store | UI session concept — no server state required |
| Desktop Sync | Manual only | No auto-sync in v1 — explicitly scoped out (see ADR-004) |
| Code Sharing | No shared package | Each app is fully independent (see ADR-008) |

> Full decision rationale is documented in `docs/ADR.md`.

---

## Documentation

All planning documents are in `docs/`. They are the single source of truth.
Do not contradict them. If you find an inconsistency, raise it — do not invent a new architecture.

| Document | Purpose |
|---|---|
| `docs/PRD.md` | Product Requirements — all features, priorities, and constraints |
| `docs/ARCHITECTURE.md` | System architecture, folder structures, data flows |
| `docs/ADR.md` | Architecture Decision Records — why every major decision was made |
| `docs/API_SPEC.md` | Complete REST API specification |
| `docs/DATABASE_DESIGN.md` | MySQL schema, Prisma models, indexes, relationships |
| `docs/MVP_REVIEW.md` | v1 scope review — Must Have / Should Have / Could Have / Future |

---

## Getting Started

> **Prerequisites:** Node.js 20 LTS, MySQL 8, AWS S3 credentials (or local MinIO)

Setup instructions for each application will be added as each application is scaffolded.

- Web application setup → `web/README.md` *(added in Chunk 2)*
- Server setup → `server/README.md` *(added in Chunk 3)*
- Desktop setup → `desktop/README.md` *(added in Chunk 4)*

---

## Development Principles

- **Docs are the contract.** If the code disagrees with the docs, the code is wrong.
- **No shared packages.** Utility duplication across apps is intentional and preferable to coupled builds.
- **Security by default.** Auth, validation, and quota enforcement at every layer.
- **Soft delete everything.** No hard deletes in v1. Users deserve a Recycle Bin.
- **Two-phase upload.** The backend never touches file bytes. S3 handles all blobs.

---

## Project Status

| Application | Status |
|---|---|
| Planning and Architecture | ✅ Complete |
| Repository Initialization | ✅ Complete |
| Web Application | 🔲 Not started |
| Backend API | 🔲 Not started |
| Desktop Application | 🔲 Not started |

---

## License

Private — not licensed for public distribution.
