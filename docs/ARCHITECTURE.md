# Fileex — System Architecture

**Version:** 1.3 | **Status:** Planning | **Last Updated:** 2026-06-30

---

## 1. Architectural Overview

Fileex follows a **three-tier architecture**:

```
┌───────────────────────────────────────────────────────┐
│                     CLIENT TIER                       │
│   Web App (React + Vite)   Desktop App (Electron)     │
└──────────────────────┬────────────────────────────────┘
                       │ HTTPS / REST API
┌──────────────────────▼────────────────────────────────┐
│                   APPLICATION TIER                    │
│              Node.js + Express.js API                 │
│   (Auth, Files, Folders, Search, Trash, Settings,     │
│    Notifications, Activity, Storage Stats)            │
└───────────────┬──────────────────┬────────────────────┘
                │ Prisma ORM       │ AWS SDK
┌───────────────▼──────┐   ┌───────▼──────────────────┐
│    DATA TIER         │   │    OBJECT STORAGE         │
│  MySQL Database      │   │       AWS S3              │
│  (Metadata + Users)  │   │   (File Blobs)            │
└──────────────────────┘   └──────────────────────────┘
```

**Core separation:** MySQL stores metadata only. S3 stores file blobs only. The API is stateless — no file data passes through it during previews or downloads.

### 1.2 Repository Structure

The repository is a simple multi-app monorepo with no shared packages. Each application is fully self-contained.

```
Fileex/
├── docs/        # All planning documentation (single source of truth)
├── web/         # React + Vite web application
├── server/      # Node.js + Express.js backend API
├── desktop/     # Electron + React desktop application
├── scripts/     # Developer utility scripts (DB seed, deploy helpers)
└── README.md
```

**No shared package.** The web, server, and desktop applications are independent. Each maintains its own utilities, constants, validators, and helpers. Small amounts of duplicated code between applications are acceptable and preferred over introducing a shared build dependency.

---

## 2. System Components

### 2.1 Web Frontend

| Component | Technology | Role |
|---|---|---|
| UI Framework | React 18 | Component-based UI |
| Build Tool | Vite | Dev server + bundler |
| Styling | Tailwind CSS | Utility-first styling |
| Routing | React Router v6 | Client-side navigation |
| HTTP Client | Axios | API communication with interceptors |
| Server State | TanStack Query | Caching, background refetch |
| Client State | Zustand | Clipboard, selections, view prefs, notifications |
| File Preview | Plugin Registry | Extensible MIME-to-renderer system |

### 2.2 Backend API

| Component | Technology | Role |
|---|---|---|
| Runtime | Node.js 20 LTS | |
| Framework | Express.js | Routing + middleware |
| ORM | Prisma | Type-safe DB queries + migrations |
| Database | MySQL 8 | Relational metadata |
| Storage | AWS S3 | File blobs |
| Auth | JWT + bcrypt | Secure authentication |
| Validation | Zod | Request validation |
| Logging | Winston | Structured logging |

### 2.3 Desktop Application

The desktop app is an **independent Electron + React application**. It does not share code with `web/`. It provides a dual-pane interface: the left pane manages local files via Electron IPC; the right pane manages cloud storage via the backend REST API.

| Component | Technology | Role |
|---|---|---|
| Shell | Electron | BrowserWindow, OS integration |
| IPC Bridge | Electron IPC + contextBridge | Safe renderer ↔ main process communication |
| Renderer UI | React (independent of web/) | Dual-pane file manager interface |
| Local FS | Node.js `fs`, `path`, `os` (main process only) | All local filesystem operations |
| Cloud API | Axios (renderer process) | Calls backend REST API for cloud operations |

---

## 3. Frontend Architecture

### 3.1 Application Structure

```
src/
├── app/                      # App shell, router, providers
├── assets/                   # Static assets
├── components/               # Shared UI components
│   ├── ui/                   # Base primitives (Button, Modal, Input)
│   ├── FileCard/             # Grid view file card
│   ├── FileRow/              # List view file row
│   ├── FolderCard/           # Grid view folder card
│   ├── ContextMenu/          # Right-click menu system
│   ├── Breadcrumb/           # Navigation breadcrumb
│   ├── PreviewModal/         # File preview modal
│   ├── UploadZone/           # Drag-and-drop upload
│   ├── StorageBar/           # Storage usage bar
│   ├── SearchBar/            # Search + filter UI
│   └── NotificationBell/     # Notification icon + dropdown
├── features/
│   ├── auth/                 # Login, Register, AuthGuard
│   ├── dashboard/            # Dashboard + widgets
│   ├── explorer/             # File browser (main view)
│   ├── trash/                # Trash/Recycle Bin view
│   ├── favorites/            # Starred files view
│   ├── search/               # Search results view
│   ├── notifications/        # Notification panel
│   └── settings/             # Settings pages (new)
│       ├── SettingsLayout.jsx
│       ├── ProfileSettings.jsx
│       ├── SecuritySettings.jsx
│       ├── AppearanceSettings.jsx
│       └── StorageSettings.jsx
├── hooks/
│   ├── useUpload.js          # Two-phase upload hook
│   ├── useClipboard.js       # Clipboard operations
│   ├── useContextMenu.js     # Context menu trigger
│   └── useNotifications.js   # Notification polling
├── lib/                      # Axios instance, utilities
├── preview/                  # Preview plugin registry
│   ├── registry.js
│   ├── ImagePreviewer.jsx
│   ├── PDFPreviewer.jsx
│   ├── VideoPreviewer.jsx
│   ├── AudioPreviewer.jsx
│   ├── TextPreviewer.jsx
│   └── FallbackPreviewer.jsx
├── store/
│   ├── useClipboardStore.js
│   ├── useSelectionStore.js
│   ├── useViewStore.js
│   ├── useNotificationStore.js  # (new)
│   └── useSettingsStore.js      # (new)
└── types/
```

### 3.2 Routing Structure

```
/                        → Redirect to /dashboard
/login                   → Login page
/register                → Registration page
/dashboard               → Storage overview + activity
/explorer                → Root of cloud storage
/explorer/:folderId      → Folder contents
/trash                   → Recycle bin
/favorites               → Starred files
/search                  → Search results
/settings                → Redirect to /settings/profile
/settings/profile        → Edit profile, avatar
/settings/security       → Change password
/settings/appearance     → Theme, default view, sort
/settings/storage        → Storage quota info
```

### 3.3 State Management

| Store | Library | Manages |
|---|---|---|
| Server state | TanStack Query | Files, folders, user, storage, notifications |
| Clipboard | Zustand | Copied/cut items, op type |
| Selection | Zustand | Selected files/folders |
| View Prefs | Zustand + localStorage | Grid/List, sort field/dir |
| Context Menu | Zustand | Menu position, target item |
| Notifications | Zustand | Unread count, panel state |
| Settings | Zustand | Cached user preferences |

### 3.4 Settings State Flow

```
App starts
  → Load theme from localStorage (instant, no flash)
  → Fetch GET /settings (on mount)
  → Merge API response into settingsStore
  → settingsStore drives: theme class, defaultView, defaultSort

User changes a setting
  → Optimistic update in settingsStore
  → PATCH /settings
  → If API fails → rollback settingsStore

Theme change
  → Apply `data-theme="dark"` to <html> element
  → Persist to both settingsStore and localStorage
```

### 3.5 Notification System Architecture

**v1 — Poll-based (client-initiated)**

```
useNotifications hook (mounted in AppShell)
  │
  ├── On mount: GET /notifications?unreadOnly=true
  ├── On window focus: GET /notifications?unreadOnly=true
  ├── On route change: GET /notifications?unreadOnly=true
  └── Every 30 seconds (background interval)

NotificationBell
  ├── Shows unreadCount badge
  ├── Opens dropdown panel on click
  ├── Panel fetches GET /notifications (paginated)
  └── Provides mark-as-read and dismiss actions
```

**v3 — WebSocket-based (future)**
```
Server sends push events via WebSocket/SSE
Client receives and appends to notificationStore
No polling required
```

**Why poll-based in v1?**
- Zero infrastructure cost — no WebSocket server, no socket.io
- Works identically in web and Electron apps
- Notification latency of ≤ 30 seconds is acceptable for file operations
- WebSocket upgrade path is clean: replace hook internals, keep store + UI intact

### 3.6 Clipboard System Design

```
User Action         Client State          API Call (on Paste)
──────────          ────────────          ───────────────────
Ctrl+C / Copy  →  { op: 'copy',     →   POST /files/:id/copy
                    items: [...] }        { destinationFolderId }

Ctrl+X / Cut   →  { op: 'move',     →   PATCH /files/:id/move
                    items: [...] }        { destinationFolderId }

Ctrl+V / Paste →  reads store      →   fires API based on op
                  clears store
```

### 3.7 Preview Plugin System

```javascript
// preview/registry.js
const previewRegistry = [
  { test: /^image\//, component: ImagePreviewer },
  { test: /^video\//, component: VideoPreviewer },
  { test: /^audio\//, component: AudioPreviewer },
  { test: /^application\/pdf/, component: PDFPreviewer },
  { test: /^text\//, component: TextPreviewer },
  { test: /.*/, component: FallbackPreviewer },
];
```

Adding a new preview type = adding one entry to the registry. Existing code is never modified.

---

## 4. Backend Architecture

### 4.1 Layered Pattern

```
Request → Route → Controller → Service → Repository → Prisma → MySQL
```

**Strict Architectural Rules:**
- **Controllers** contain HTTP logic only (req/res parsing, calling services). No business logic.
- **Services** contain all business logic.
- **Repositories** are the ONLY layer allowed to use Prisma. No Prisma outside repositories.

### 4.2 Backend Folder Structure

```
src/
├── config/
│   ├── env.js              # Validated env config (using zod)
│   ├── db.js               # Prisma client singleton
│   └── s3.js               # AWS S3 client
├── middleware/
│   ├── authenticate.js     # JWT verification
│   ├── errorHandler.js     # Global error handler
│   ├── rateLimiter.js      # Auth endpoint rate limiting
│   └── validate.js         # Zod schema validation middleware
├── modules/
│   ├── auth/               # register, login, refresh, logout, me
│   ├── files/              # upload, download, rename, move, copy, delete
│   ├── folders/            # CRUD, move, copy, breadcrumb, contents
│   ├── trash/              # list, restore, delete, empty
│   ├── search/             # search with filters
│   ├── storage/            # stats dashboard
│   ├── activity/           # feed
│   ├── users/              # profile, avatar
│   ├── settings/           # GET, PATCH settings (new)
│   └── notifications/      # list, read, dismiss (new)
├── utils/                      # Server-internal utilities only
│   ├── errors.js               # AppError, ConflictError, QuotaError, etc.
│   ├── s3Helpers.js            # Presigned URL generation, delete, copy
│   ├── nameResolver.js         # Auto-rename logic for copy operations
│   ├── validators.js           # Shared Zod schemas (server-internal)
│   └── logger.js               # Winston logger
├── jobs/                       # Scheduled background jobs
│   ├── purgeTrash.js           # Purge trash items past scheduledPurgeAt
│   ├── purgePendingUploads.js  # Clean stale 'pending' file records
│   └── purgeNotifications.js   # Remove notifications older than 90 days
├── app.js                      # Express app setup
└── server.js                   # HTTP server entrypoint
```

> **Note on `utils/`:** This folder is server-internal only. It is not a shared package and is not imported by `web/` or `desktop/`. The name `utils/` is used instead of `shared/` to avoid implying cross-application sharing.

### 4.3 Name Resolver Utility

`utils/nameResolver.js` provides a pure, testable function for auto-renaming on copy:

```
resolveUniqueName(baseName, extension, existingNames[]) → uniqueName

Examples:
  ("Resume", "pdf", ["Resume.pdf"])
    → "Resume (copy).pdf"

  ("Resume", "pdf", ["Resume.pdf", "Resume (copy).pdf"])
    → "Resume (copy 2).pdf"
```

This function is used by: `FileService.copyFile()`, `FileService.duplicateFile()`, `FolderService.copyFolder()`.

### 4.4 Notification Service Pattern

`NotificationService.create()` is called as a side effect inside relevant service methods, within the same database transaction:

```javascript
// Inside FileService.confirmUpload():
await prisma.$transaction([
  prisma.file.update({ where: { id }, data: { uploadStatus: 'confirmed' } }),
  prisma.storageStats.update({ ... }),
  prisma.notification.create({
    data: {
      userId,
      type: 'upload_complete',
      title: 'Upload Complete',
      body: `${file.name} was uploaded successfully.`,
      metadata: { fileId: file.id }
    }
  })
]);
```

This guarantees atomicity — a notification is never created for a failed operation, and a successful operation never silently drops its notification.

### 4.5 Middleware Stack

```
Request
  ├── cors()
  ├── helmet()
  ├── express.json()
  ├── rateLimiter (auth routes only)
  ├── authenticate (protected routes)
  ├── validate(schema) (per-route)
  └── Route Handler
        └── globalErrorHandler (catch-all)
```

---

## 5. Desktop Application Architecture

### 5.1 Design Overview

The desktop application is a **dual-pane file manager** built with Electron and React. It is an **independent application** — it does not share code with `web/`. Any utilities needed in both places are duplicated intentionally.

```
┌──────────────────────────────────────────────────────────────┐
│  Fileex Desktop                                  [_][□][X]  │
├───────────────────────────┬──────────────────────────────────┤
│   LOCAL FILE SYSTEM       │   CLOUD STORAGE                  │
│   (Electron IPC + fs)     │   (Backend REST API)             │
│                           │                                  │
│  📁 Documents             │  📁 My Drive                     │
│  📁 Projects              │  📁 Work Files                   │
│  📄 resume.pdf            │  📄 report.pdf                   │
│                           │                                  │
├───────────────────────────┴──────────────────────────────────┤
│       [ ↑ Upload to Cloud ]    [ ↓ Download to Local ]       │
└──────────────────────────────────────────────────────────────┘
```

**Constraints (enforced by design):**
- No automatic synchronization
- No background file watcher
- No conflict resolution engine
- All transfers are explicit, user-initiated actions

### 5.2 Process Architecture

```
Renderer Process (React UI)
  │
  ├── Local ops  ──► IPC (contextBridge) ──► Main Process (Node.js)
  │                                              └── fs, path, os
  │
  └── Cloud ops  ──► HTTPS ──► Backend API (server/)
```

### 5.3 No Shared Code Policy

| What is NOT shared | Reason |
|---|---|
| React components from `web/` | Desktop UI is purpose-built for dual-pane layout |
| Validation logic from `server/` | Desktop validates locally; server validates authoritatively |
| Axios instance from `web/` | Desktop has its own API client |
| Any `shared/` package | Strict constraint: No such package exists |

---

## 6. Storage & S3 Integration Strategy

### 6.1 Two-Phase Upload Flow

Storage implementation remains provider-agnostic, enabling MinIO to replace S3 for local development without changing business logic.

```text
User selects file
       ↓
POST /upload/initiate
       ↓
Validate quota
       ↓
Generate immutable storageKey
       ↓
Create File record (status = PENDING)
       ↓
Generate Presigned Upload URL
       ↓
Client uploads directly to S3
       ↓
POST /upload/complete
       ↓
Verify object exists in S3
       ↓
status = READY
       ↓
Update StorageStats.usedStorage
```

### 6.2 Upload Recovery

Whenever files are listed (e.g. GET /files):
If `PENDING` files exist:
1. For each `PENDING` file, verify object existence in S3.
2. If object exists:
   - `status = READY`
   - Update `usedStorage` (only once)
3. If object does not exist:
   - `status = FAILED`

No background cleanup worker is used for MVP. The `uploadStartedAt` timestamp exists for future cleanup strategies.

### 6.2 Download / Preview Flow

```
Client → GET /files/:id/download-url → presigned GET URL → Client fetches from S3 directly
```

---

## 7. Authentication Architecture

### 7.1 Dual-Token Strategy

| Token | Storage | Expiry | Purpose |
|---|---|---|---|
| Access Token (JWT) | Memory (JS var) | 15 min | Authenticate API requests |
| Refresh Token | HTTP-only Cookie | 7 days | Issue new access tokens |

### 7.2 Refresh Flow

Axios interceptor detects 401 → POST /auth/refresh (cookie sent automatically) → Backend issues new tokens → Retries original request.

---

## 8. Edge Cases & System Behavior

*(All known edge cases apply equally to the Web application and the Cloud-side of the Desktop application).*

### EDGE-01 & 02: Upload Interrupted
`pending` record sits in the DB. Purge job deletes it after 1 hour. No quota impact.

### EDGE-03: Deleting a Folder Containing Thousands of Files
Handled **asynchronously**. Immediate soft delete of root folder, then background job cascades delete.

### EDGE-04: Rename Conflict
Returns `409 NAME_CONFLICT`. Client displays error message.

### EDGE-05: Moving a Folder Into Itself
Returns `422 CIRCULAR_REFERENCE` after recursive CTE check on the destination ancestor chain.

### EDGE-07: Upload Exceeds Storage Quota
Returns `413 QUOTA_EXCEEDED` before S3 upload begins.

### EDGE-08: Invalid File Types
Returns `400 VALIDATION_ERROR` against strict server-side allowlist.

### EDGE-09: Expired Presigned URLs
Client intercepts S3 403 error and re-fetches a fresh URL or prompts user to retry.

---

## 9. Key Architectural Decisions

See `ADR.md` for full decision records.

| ADR | Decision |
|---|---|
| ADR-001 | MySQL over MongoDB |
| ADR-002 | Prisma over Raw SQL |
| ADR-003 | AWS S3 over DB file storage |
| ADR-004 | Manual upload over auto-sync |
| ADR-005 | Client-side clipboard |
| ADR-006 | Soft delete over hard delete |
| ADR-007 | Two-phase presigned URL upload |
| ADR-008 | Independent Applications (No Shared Packages) |

---

## 10. Future Architecture Extensions

| Feature | Extension Point |
|---|---|
| File Versioning | `fileVersions` table; S3 keys include version hash |
| Real-time Notifications | Replace poll hook with WebSocket client; same store + UI |
| Team Workspaces | Add `workspaces` table; multi-owner access model |
| Mobile App | Same API; add push notification service |
| Full-text Search | ElasticSearch; index on `upload_complete` event |
