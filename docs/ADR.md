# Fileex — Architecture Decision Records (ADR)

**Version:** 1.0 | **Status:** Accepted | **Last Updated:** 2026-06-30

---

> **Format:** Each ADR follows the structure: Context → Problem → Alternatives Considered → Decision → Consequences.  
> ADRs are append-only. Once accepted, they are not deleted — only superseded by a new ADR.

---

## ADR-001 — MySQL over MongoDB

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team

### Context
Fileex stores structured data: users, files, folders, activity logs, storage stats, and relationships between them. The data model is highly relational — a file belongs to a folder, a folder belongs to a user, a folder can contain other folders, and storage stats roll up from individual file records.

### Problem
Which database engine best fits Fileex's data model and future scaling needs?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **MySQL** | ACID transactions, strong relational model, JOINs, foreign key enforcement, wide hosting support | Schema migrations require planning; less flexible for unstructured data |
| **PostgreSQL** | All MySQL benefits + JSON columns + advanced features (CTEs, window functions) | Slightly more complex hosting setup; overkill for this scope |
| **MongoDB** | Schema flexibility, easy to start | No native JOINs, no real foreign keys, inconsistent for relational data, poor fit for transaction-heavy operations |
| **SQLite** | Zero setup | Not suitable for production multi-user concurrent access |

### Decision
**MySQL 8** is chosen.

- The data model is clearly relational: users → folders → files with ownership and hierarchy
- ACID transactions are required (e.g., delete file + update storage stats must be atomic)
- MySQL 8 supports Recursive CTEs for folder tree traversal — which MongoDB cannot do natively
- MySQL has the widest managed hosting support (PlanetScale, AWS RDS, Railway)
- PostgreSQL would also be valid, but MySQL was chosen for familiarity and simpler on-premise setup for portfolio demonstration

### Consequences
- **Positive:** Strong data integrity, referential consistency, easy to reason about relationships
- **Positive:** Prisma supports MySQL natively with full migration tooling
- **Negative:** Schema changes require migrations — cannot add fields ad-hoc
- **Negative:** JSON columns are available in MySQL 8 but less idiomatic than PostgreSQL's JSONB

---

## ADR-002 — Prisma ORM over Raw SQL

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team

### Context
The backend needs a data access layer to communicate with MySQL. The choice is between writing raw SQL, using a lightweight query builder, or using a full ORM.

### Problem
What is the right level of database abstraction for a production-quality codebase that needs to be maintainable, type-safe, and migratable?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Prisma** | Type safety, auto-generated client, migration system, schema-as-code, excellent DX | Slightly less flexible for ultra-complex queries; abstraction over raw SQL |
| **Raw SQL (mysql2)** | Full control, maximum performance | No type safety, no migration tooling, boilerplate-heavy, hard to maintain |
| **Knex.js** | Query builder, more control than ORM, migration support | Less type safety than Prisma, more verbose than Prisma for simple queries |
| **TypeORM** | Decorator-based, TypeScript native | Known inconsistency bugs, heavier, configuration-heavy |
| **Sequelize** | Mature, widely used | Poor TypeScript support, verbose, aging API design |

### Decision
**Prisma** is chosen.

- Schema is defined once in `schema.prisma` and serves as the single source of truth
- Prisma Client is fully type-safe — breaking schema changes are caught at compile time
- Prisma Migrate handles versioned migrations cleanly
- For complex queries (recursive CTE for folder breadcrumbs), Prisma's `$queryRaw` escape hatch allows raw SQL without abandoning the ORM
- Developer experience is significantly better than any alternative

### Consequences
- **Positive:** Type-safe DB access across the entire backend
- **Positive:** Schema migrations are versioned, reproducible, and reviewable
- **Positive:** Onboarding new developers is faster — schema is self-documenting
- **Negative:** Prisma bundles a query engine binary — slightly larger deployment artifact
- **Negative:** Very complex queries (deep recursive trees) may require raw SQL fallback

---

## ADR-003 — AWS S3 over Storing Files in MySQL

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team

### Context
Fileex is a file storage product. It must store file blobs (raw binary data) somewhere. The architecture separates file metadata (MySQL) from file content (object storage).

### Problem
Where should the actual file data live?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **AWS S3** | Industry standard, infinitely scalable, cheap storage per GB, built-in CDN integration, presigned URLs, versioning support | Requires AWS account; adds operational dependency |
| **MySQL BLOB columns** | No additional service | Destroys DB performance, backups become huge, DB not designed for binary streaming, no CDN |
| **Local disk (server filesystem)** | Simple for dev | Not scalable, single point of failure, files lost on server replacement, no CDN |
| **Cloudflare R2** | S3-compatible, no egress fees | Less ecosystem support, smaller community |
| **MinIO (self-hosted S3)** | S3-compatible, free, self-hosted | Requires infrastructure management; not suited for portfolio/cloud deployment |

### Decision
**AWS S3** is chosen as primary, with the architecture being **S3-compatible** so MinIO can be swapped in for local development.

- Object storage is the correct abstraction for file blobs — it is not a database concern
- AWS S3 provides 99.999999999% durability with zero operational overhead
- Presigned URLs allow clients to download/upload directly without routing bytes through the backend
- The S3 client is abstracted behind a `storage/` service module — switching to R2 or MinIO requires only config changes

### Consequences
- **Positive:** Backend is I/O-free for file transfers — extremely scalable
- **Positive:** S3 presigned URLs enable direct client ↔ S3 transfers (lower latency, no backend bottleneck)
- **Positive:** Storage is practically unlimited
- **Negative:** AWS costs must be monitored (primarily S3 PUT/GET request costs)
- **Negative:** Adds external service dependency — local dev requires MinIO or S3 credentials

---

## ADR-004 — Manual Upload over Automatic Synchronization

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Product + Architecture Team

### Context
Fileex includes a desktop application built with Electron. The question is whether the desktop app should automatically synchronize a local folder with cloud storage (like Dropbox), or require the user to manually trigger all operations.

### Problem
Should the desktop app perform automatic background synchronization?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Manual upload (chosen)** | Simpler architecture, user has full control, no background process needed, no conflict resolution complexity | Less seamless than Dropbox-style sync |
| **Auto-sync (watch folder)** | Familiar Dropbox-like experience | Requires file system watcher, conflict resolution system, offline queue, delta sync, versioning — dramatically increases complexity |
| **Selective sync** | Middle ground | Still requires sync engine, conflict detection, and state reconciliation |

### Decision
**Manual upload only** for the desktop app.

- Auto-sync introduces an entirely new engineering domain: conflict resolution, delta sync, offline queuing, and file-system event management
- This complexity would dominate the project and is not the focus of a file management portfolio project
- Manual operations give users explicit control — no surprise bandwidth usage, no accidental overwrites
- The architecture explicitly reserves space for auto-sync in v3 via a `syncEvents` table

### Consequences
- **Positive:** Dramatically simpler desktop app architecture
- **Positive:** No conflict resolution logic needed in v1
- **Positive:** Desktop and web apps share the same API — no special sync protocol
- **Negative:** Less seamless than Dropbox; users must consciously upload/download files

---

## ADR-005 — Client-Side Clipboard over Server-Side Clipboard

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team

### Context
Fileex implements a copy/cut/paste clipboard for files and folders, similar to Windows Explorer. The clipboard must be persisted across folder navigations but cleared after paste.

### Problem
Where should clipboard state live — on the client or the server?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Client-side (Zustand store)** | Simple, no server round-trip, natural UX, stateless backend, cleared on logout | Clipboard lost on page refresh or browser crash (acceptable) |
| **Server-side session** | Persists across devices and page refreshes | Requires session or DB storage, cleanup jobs for stale clipboards, state synchronization complexity |
| **URL state** | Survives refresh | URLs become polluted; breaks bookmarking; security concern for file IDs in URLs |

### Decision
**Client-side clipboard** in Zustand store.

- Clipboard is a UI session concept — it is not meaningful to persist clipboard across different sessions or devices
- Windows Explorer and Google Drive both use client-side clipboard
- The actual API call (copy or move) only fires on Paste — the backend remains stateless
- On paste, the clipboard `op` type (`copy` or `cut`) determines which API endpoint is called

### Consequences
- **Positive:** Zero server state; backend is simpler and stateless
- **Positive:** No cleanup jobs or stale clipboard management needed
- **Positive:** Consistent with how every native OS handles clipboard
- **Negative:** Clipboard is lost on page refresh (intentional and expected behavior)
- **Negative:** Clipboard cannot be shared across browser tabs (acceptable for v1)

---

## ADR-006 — Soft Delete over Hard Delete

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team + Product Team

### Context
When a user deletes a file or folder, the system must decide whether to permanently remove the record from the database and the blob from S3 immediately, or mark it as deleted and allow recovery.

### Problem
Should deletes be immediate and permanent, or deferred (soft delete with Trash)?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Soft delete (chosen)** | Recovery via Trash, accident protection, audit trail, no data loss | Requires Trash management, scheduled purge jobs, slightly more complex queries |
| **Hard delete** | Simpler, immediately frees storage | No recovery, accidental deletion is permanent, poor UX |
| **Versioned delete** | Full history | Overkill for v1, reserved for v2 |

### Decision
**Soft delete** everywhere using a `deletedAt` timestamp.

- Users expect a Recycle Bin — this is a fundamental UX expectation from Windows Explorer and Google Drive
- A deleted file sets `deletedAt` on the `files` row and creates a `trashItems` record
- The S3 object is **not deleted** until the trash item is permanently deleted
- All queries add `WHERE deletedAt IS NULL` to filter out trash — this is enforced at the repository layer
- A scheduled job purges items from Trash after 30 days (configurable)

### Consequences
- **Positive:** Users can recover accidentally deleted files
- **Positive:** Full audit trail is preserved
- **Positive:** Matches the mental model of every mainstream file manager
- **Negative:** S3 storage costs continue until permanent deletion
- **Negative:** All queries must include `deletedAt IS NULL` — enforced via repository layer, never left to individual developers

---

## ADR-007 — Two-Phase Presigned URL Upload

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team

### Context
Fileex allows users to upload files to cloud storage. The question is how file bytes travel from the user's device to S3.

### Problem
Should file uploads be proxied through the backend server, or should clients upload directly to S3?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Two-phase presigned URL (chosen)** | Backend never handles bytes, scales infinitely, low latency, standard industry pattern | Slightly more complex client flow; requires confirm step |
| **Proxy through backend** | Single request, simpler client code | Backend becomes I/O bottleneck; memory pressure on large files; doesn't scale horizontally without sticky sessions |
| **S3 Transfer Acceleration** | Faster for global users | Extra cost; only useful at scale |

### Decision
**Two-phase presigned URL upload.**

**Phase 1:** Client requests an upload URL from the backend.
- Backend validates: quota, MIME type, file size, folder ownership
- Backend creates a `files` record with `uploadStatus: pending`
- Backend generates a presigned S3 PUT URL (expires in 15 minutes)
- Backend returns `{ fileId, uploadUrl }` to client

**Phase 2:** Client uploads directly to S3 using the presigned URL.
- No backend involved during the actual transfer
- Client sends `POST /files/:id/confirm` on success
- Backend marks `uploadStatus: confirmed` and updates `storageStats`

This is the exact pattern used by Dropbox, Notion, Linear, and AWS itself.

### Consequences
- **Positive:** Backend handles zero file bytes — fully stateless and horizontally scalable
- **Positive:** Upload speed is limited only by client's bandwidth to S3 (no backend hop)
- **Positive:** Backend can enforce all business rules (quota, MIME, size) before the upload begins
- **Negative:** Interrupted uploads leave `pending` records — requires a cleanup job to purge stale `pending` files older than 1 hour
- **Negative:** Confirm step adds a small UX complexity — handled transparently in the client's upload hook

---

## ADR-008 — Independent Applications (No Shared Packages)

**Status:** Accepted  
**Date:** 2026-06-30  
**Deciders:** Architecture Team

### Context
Fileex consists of three separate applications: a React Web App, an Express API Server, and an Electron Desktop App. They share some logic (e.g., file sizing, naming rules, validation schemas). 

### Problem
Should we create a monorepo with a `shared/` package for common code, or keep the applications completely independent and accept code duplication?

### Alternatives Considered

| Option | Pros | Cons |
|---|---|---|
| **Independent Apps (chosen)** | Absolute separation of concerns, zero cross-app build dependencies, simpler deployment | Code duplication for common utilities |
| **Shared Package (monorepo)** | DRY (Don't Repeat Yourself), single source of truth for schemas/utils | Complex tooling (Turborepo/Lerna), coupled builds, versioning hell, slower onboarding |

### Decision
**Independent Applications with No Shared Packages.**

- We explicitly prioritize decoupling and simplicity over DRY across application boundaries.
- The `web/`, `server/`, and `desktop/` directories must be fully self-contained.
- If a utility (like a file size formatter or validation regex) is needed in two places, it will be intentionally duplicated.
- The only shared contract is the REST API Specification.

### Consequences
- **Positive:** Any application can be built, tested, and deployed entirely on its own without knowing about the others.
- **Positive:** No complex monorepo build tools required.
- **Positive:** Developers can work on the web app without needing to understand the desktop app's build process.
- **Negative:** Some small utility functions and constants must be maintained in multiple places.

---

## ADR Index

| ID | Decision | Status |
|---|---|---|
| ADR-001 | MySQL over MongoDB | Accepted |
| ADR-002 | Prisma over Raw SQL | Accepted |
| ADR-003 | AWS S3 over database file storage | Accepted |
| ADR-004 | Manual upload over auto-sync | Accepted |
| ADR-005 | Client-side clipboard | Accepted |
| ADR-006 | Soft delete over hard delete | Accepted |
| ADR-007 | Two-phase presigned URL upload | Accepted |
| ADR-008 | Independent Applications (No Shared Packages) | Accepted |
