# Fileex — Product Requirements Document (PRD)

**Version:** 1.4 | **Status:** Finalized | **Last Updated:** 2026-07-08

---

## 1. Executive Summary

Fileex is a modern, cloud-based file management platform designed to combine the familiarity of a desktop file manager (like Windows File Explorer) with the power and accessibility of a cloud storage service (like Google Drive or Dropbox).

The product targets users who want a seamless, intuitive experience for storing, organizing, previewing, and sharing files across web and desktop environments — without the steep learning curve of enterprise tools.

---

## 2. Product Vision

> **"Make cloud storage feel like your desktop."**

Fileex bridges the gap between local and cloud file management. Users should feel like they are using their familiar file manager — powered by the cloud.

---

## 3. Target Users

| Persona | Description |
|---|---|
| Individual | Personal documents, media, projects |
| Student | Assignments, notes across devices |
| Freelancer | Client files, deliverables, archives |
| Small Team *(v2)* | Shared workspaces and documents |

---

## 4. Core Principles

- **Familiarity First** — UX must feel like a native file manager
- **Modular Architecture** — Every feature is independently extensible
- **Security by Default** — Auth, access control, input validation at every layer
- **Performance Conscious** — File operations must be fast; UI must feel snappy
- **Future Ready** — Architecture must not block versioning, sync, or collaboration

---

## 5. Feature Requirements

### 5.1 Authentication

| ID | Feature | Priority |
|---|---|---|
| AUTH-01 | User Registration (email + password + name) | P0 |
| AUTH-02 | Login — JWT access token + refresh token returned in response body | P0 |
| AUTH-03 | Silent token refresh (refresh token rotation via `POST /auth/refresh`) | P0 |
| AUTH-04 | Logout (invalidate refresh token) | P0 |
| AUTH-05 | User Profile (name, avatar, email) | P1 |
| AUTH-06 | Change Password | P1 |
| AUTH-07 | Storage quota management + enforcement | P0 |

> **Future Production Enhancement:** The web application will migrate Refresh Token delivery to an HTTP-only Secure SameSite cookie. The desktop application will use OS credential storage (e.g., Electron `safeStorage`). Cookie-based authentication is not applicable to Electron.

### 5.2 File Operations

| ID | Feature | Priority |
|---|---|---|
| FILE-01 | Upload (single + multi-file) | P0 |
| FILE-02 | Download | P0 |
| FILE-03 | Rename | P0 |
| FILE-04 | Delete (soft → Trash) | P0 |
| FILE-05 | Move to folder | P0 |
| FILE-06 | Copy | P1 |
| FILE-07 | Cut (clipboard) | P1 |
| FILE-08 | Paste from clipboard | P1 |
| FILE-09 | Duplicate in same folder | P1 |
| FILE-10 | Preview in-app | P1 |
| FILE-11 | Favorite / star | P2 |
| FILE-12 | Restore from Trash | P0 |
| FILE-13 | Permanently delete from Trash | P0 |
| FILE-14 | Properties panel | P2 |
| FILE-15 | Share (generate link) | **v2** |

### 5.3 Folder Operations

| ID | Feature | Priority |
|---|---|---|
| FOLD-01 | Create folder | P0 |
| FOLD-02 | Rename folder | P0 |
| FOLD-03 | Delete folder (soft → Trash) | P0 |
| FOLD-04 | Move folder | P0 |
| FOLD-05 | Nested folders (infinite depth) | P0 |
| FOLD-06 | Breadcrumb navigation | P0 |
| FOLD-07 | Copy folder (deep copy) | P1 |
| FOLD-08 | Cut/Paste folder (clipboard) | P1 |
| FOLD-09 | Properties panel | P2 |
| FOLD-10 | Folder color | P2 |

### 5.4 Clipboard System

| ID | Feature | Priority |
|---|---|---|
| CLIP-01 | Copy file/folder to client-side clipboard | P1 |
| CLIP-02 | Cut file/folder (pending move) | P1 |
| CLIP-03 | Paste clipboard content into target folder | P1 |
| CLIP-04 | Clipboard persists across folder navigation | P1 |
| CLIP-05 | Clipboard cleared after paste | P1 |
| CLIP-06 | Cut items appear faded (visual feedback) | P2 |

> **Design Note:** Clipboard is client-side state only. The API call (copy/move) fires on paste. No server-side clipboard state. See ADR-005.

### 5.5 File Preview

| ID | Feature | Priority |
|---|---|---|
| PREV-01 | Image preview (JPG, PNG, GIF, WEBP, SVG) | P1 |
| PREV-02 | PDF preview (embedded viewer) | P1 |
| PREV-03 | Video preview (MP4, WEBM, OGG) | P2 |
| PREV-04 | Audio preview (MP3, WAV, OGG, FLAC) | P2 |
| PREV-05 | Text file preview (TXT, MD, CSV, JSON, code) | P1 |
| PREV-06 | Unsupported format fallback → download prompt | P0 |
| PREV-07 | Preview opens from context menu or double-click | P1 |
| PREV-08 | Plugin architecture for extensibility | P0 |

> **Design Note:** Previews use presigned S3 URLs rendered client-side. No file data routes through the backend server for previews.

### 5.6 Context Menus

**File menu:** Open, Preview, Download, Rename, Copy, Cut, Paste, Move To, Duplicate, Delete, Favorite, Share, Properties

**Folder menu:** Open, Rename, Copy, Cut, Paste, Move To, Delete, New Folder, Properties

**Empty area menu:** New Folder, Upload File, Paste, Select All

### 5.7 Storage Dashboard

| ID | Feature | Priority |
|---|---|---|
| DASH-01 | Total / Used / Free storage | P0 |
| DASH-02 | Breakdown by file type | P1 |
| DASH-03 | Recent uploads | P1 |
| DASH-04 | Activity history feed | P1 |

### 5.8 Search

| ID | Feature | Priority |
|---|---|---|
| SRCH-01 | Search by name | P0 |
| SRCH-02 | Filter by extension | P1 |
| SRCH-03 | Filter by type category | P1 |
| SRCH-04 | Filter by size (min/max) | P2 |
| SRCH-05 | Filter by date | P2 |
| SRCH-06 | Search within folder | P2 |
| SRCH-07 | Full-text content search | **v3** |

### 5.9 Views & Sorting

| Feature | Options | Priority |
|---|---|---|
| Views | Grid (cards + thumbnails), List (table) | P0 |
| Sort by | Name, Size, Date, Type | P0 |
| Direction | Ascending / Descending | P0 |
| Preference | Persisted in localStorage + user settings | P1 |

### 5.10 Trash / Recycle Bin

| ID | Feature | Priority |
|---|---|---|
| TRASH-01 | Soft delete → Trash | P0 |
| TRASH-02 | Restore from Trash | P0 |
| TRASH-03 | Permanently delete | P0 |
| TRASH-04 | Empty Trash (bulk) | P1 |
| TRASH-05 | Auto-purge after 30 days | P1 |

### 5.11 Desktop Application

The desktop application provides a **dual-pane file manager** interface. The left pane manages local files using Electron and Node.js filesystem APIs. The right pane manages cloud storage using the same backend API as the web application. Users manually transfer files between the two panes.

**Design Constraints (non-negotiable):**
- No automatic synchronization
- No background file watcher
- No conflict resolution engine
- Local operations use Electron + Node.js `fs` APIs exclusively
- Cloud operations use the backend REST API exclusively

**Local File Management — Left Pane:**

| ID | Feature | Priority |
|---|---|---|
| DESK-L01 | Browse local folders and files | P0 |
| DESK-L02 | Create local folder | P0 |
| DESK-L03 | Rename local file or folder | P0 |
| DESK-L04 | Delete local file or folder | P0 |
| DESK-L05 | Move local file or folder | P0 |
| DESK-L06 | Copy local file or folder | P1 |
| DESK-L07 | Cut & Paste local file or folder | P1 |
| DESK-L08 | Preview local file (images, text, PDF) | P1 |
| DESK-L09 | Search local files by name within folder | P1 |
| DESK-L10 | Right-click context menu for local items | P1 |

**Cloud Storage Management — Right Pane:**

| ID | Feature | Priority |
|---|---|---|
| DESK-C01 | Browse cloud folders and files (via API) | P0 |
| DESK-C02 | Full cloud operations matching web app | P0 |
| DESK-C03 | Right-click context menu for cloud items | P1 |

**Transfer Operations:**

| ID | Feature | Priority |
|---|---|---|
| DESK-T01 | Upload: selected local file → cloud folder | P0 |
| DESK-T02 | Download: selected cloud file → local folder | P0 |
| DESK-T03 | Upload progress indicator | P1 |

---

### 5.12 Settings Module *(New)*

The Settings module allows users to manage their account preferences, appearance, and storage information. Settings are stored server-side (`user_settings` table) so they persist across devices and sessions. View preference is also mirrored in localStorage for fast initial render.

| ID | Feature | Priority | Notes |
|---|---|---|---|
| SET-01 | Edit Profile — name | P1 | `PATCH /users/me` |
| SET-02 | Change Email *(with re-verification)* | **v2** | Requires email verification flow |
| SET-03 | Change Password | P1 | `PATCH /auth/password` |
| SET-04 | Profile Picture upload + remove | P2 | Two-phase S3 upload for avatar |
| SET-05 | Theme — Light / Dark | P1 | Stored in `user_settings.theme` |
| SET-06 | Default View — Grid / List | P1 | Stored in `user_settings.defaultView` |
| SET-07 | Default Sort Field | P2 | Stored in `user_settings.defaultSortBy` |
| SET-08 | Default Sort Direction | P2 | Stored in `user_settings.defaultSortDir` |
| SET-09 | Language / Locale | **v3** | Architecture stub only; i18n infrastructure not in v1 |
| SET-10 | Storage Information display | P1 | Mirrors `/storage/stats` |
| SET-11 | Danger Zone — Delete Account | **v2** | Requires cascading delete + grace period |

**Settings persistence strategy:**
- On first load, settings are fetched from `GET /settings` and stored in client state
- UI-critical settings (theme, view) are additionally cached in `localStorage` for instant application before the API response arrives
- Settings changes are persisted immediately via `PATCH /settings`

---

### 5.13 Notification System *(New)*

Fileex includes an in-app notification system that surfaces feedback for all asynchronous and important operations. Notifications are stored in the database and displayed in a notification bell/panel in the navigation bar.

**Design Principle:** Notifications are **poll-based** in v1. The client fetches unread notifications on focus/navigation. Real-time push notifications (WebSocket) are deferred to v3.

| ID | Notification Type | Trigger | Priority |
|---|---|---|---|
| NOTIF-01 | Upload Completed | File `status` set to `READY` | P1 |
| NOTIF-02 | Upload Failed | Confirm step fails / S3 error | P1 |
| NOTIF-03 | Download Started | Download URL issued | P2 |
| NOTIF-04 | Delete Successful | File/folder soft deleted | P2 |
| NOTIF-05 | Folder Created | Folder creation confirmed | P2 |
| NOTIF-06 | File/Folder Renamed | Rename operation succeeded | P2 |
| NOTIF-07 | File/Folder Moved | Move operation succeeded | P2 |
| NOTIF-08 | Copy Completed | Copy operation succeeded | P2 |
| NOTIF-09 | Storage Quota Warning (80%) | `storageStats` update exceeds 80% | P1 |
| NOTIF-10 | Storage Quota Exceeded (100%) | Upload refused due to quota | P0 |
| NOTIF-11 | Error Notification | Any 5xx or unhandled client error | P1 |
| NOTIF-12 | Folder Bulk Delete Completed | Large folder delete finished | P1 |

**Notification object fields:**
- `id`, `userId`, `type` (enum), `title`, `body`, `isRead`, `metadata` (JSON), `createdAt`

**Notification Bell UX:**
- Unread count badge on bell icon
- Clicking opens a dropdown panel (last 20 notifications)
- "Mark all as read" button
- Each notification is individually dismissible

---

### 5.14 File & Folder Naming Rules *(New)*

#### Uniqueness Enforcement
- Within the same folder, **no two items (files or folders) may have the same name**
- Files and folders share the same namespace, enforced by a unique constraint on `(ownerId, parentId, displayName)`
- The uniqueness check is **case-insensitive** (`Resume.pdf` and `resume.pdf` are considered the same)
- When violated, the API returns **HTTP 409 Conflict**

#### 409 Conflict Response Format
```json
{
  "success": false,
  "error": {
    "code": "NAME_CONFLICT",
    "message": "A file named 'Resume.pdf' already exists in this folder."
  }
}
```

#### Auto-Rename on Copy
Copy operations must never fail due to naming conflicts. The system automatically generates a unique name:

| Iteration | File Name |
|---|---|
| Original | `Resume.pdf` |
| First copy | `Resume (copy).pdf` |
| Second copy | `Resume (copy 2).pdf` |
| Third copy | `Resume (copy 3).pdf` |

The same logic applies to folders:

| Iteration | Folder Name |
|---|---|
| Original | `Projects` |
| First copy | `Projects (copy)` |
| Second copy | `Projects (copy 2)` |

The auto-rename resolution runs entirely server-side. The client receives the final resolved name in the API response.

**Applies to:** `POST /files/:id/copy`, `POST /files/:id/duplicate`, `POST /folders/:id/copy`

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | File listing API < 300ms (p95) |
| Performance | Settings API < 100ms (cached) |
| Performance | Upload progress shown in real time |
| Security | JWT access token: 15min expiry |
| Security | Refresh token: 7 days, rotated on every use; delivered in response body (see AUTH-02) |
| Security | All S3 access via presigned URLs only |
| Security | MIME type + file size validation on upload |
| Security | Rate limiting on auth endpoints |
| Security | Unique name check enforced server-side (not client-side only) |
| Scalability | Per-user data isolation |
| Scalability | Metadata (MySQL) decoupled from blobs (S3) |
| Reliability | Soft deletes for all destructive operations |
| Reliability | Activity logging for all operations |
| Reliability | Notifications generated atomically with their triggering operation |

---

## 7. Out of Scope (v1)

File sharing/links, real-time collaboration, file versioning, team workspaces, comments, mobile app, offline mode, auto-sync, i18n, email verification, account deletion.

---

## 8. Future Roadmap

| Version | Feature |
|---|---|
| v2 | File Versioning |
| v2 | Share Links |
| v2 | Team Workspaces |
| v2 | Change Email + verification |
| v3 | Real-time Sync (WebSocket/SSE) |
| v3 | Real-time Push Notifications |
| v3 | Comments & Annotations |
| v4 | Mobile App (React Native) |
| v4 | Full-text Search (ElasticSearch) |
| v4 | i18n / Language Support |
