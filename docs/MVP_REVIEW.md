# Fileex — MVP Feature Review

**Version:** 1.0 | **Reviewer:** Staff Engineering Team | **Date:** 2026-06-30  
**Purpose:** Define a realistic, shippable v1 scope. Prevent scope creep. Protect architectural extensibility.

---

> **Methodology:** Features are evaluated against three criteria:
> 1. **Core value** — Does removing this break the product's fundamental promise?
> 2. **Complexity** — What is the implementation cost relative to the value?
> 3. **Dependency** — Does another feature depend on this one?

---

## Tier Definitions

| Tier | Meaning |
|---|---|
| **Must Have (v1)** | Product is broken or embarrassing without this. Ship with v1. |
| **Should Have (v1)** | Significantly improves the experience. Include if timeline permits. |
| **Could Have (v1)** | Nice polish. Include only if core is complete and stable. |
| **Future Versions** | Not appropriate for v1 scope. Architecture must not block it. |

---

## 1. Authentication

| Feature | Tier | Rationale |
|---|---|---|
| Register (email + password) | **Must Have** | Without this, nothing works |
| Login (JWT + HTTP-only cookie) | **Must Have** | Core auth mechanism |
| Silent token refresh | **Must Have** | Without this, users are logged out every 15 minutes |
| Logout | **Must Have** | Basic security expectation |
| Change Password | **Should Have** | Security essential, not complex |
| User Profile (name, avatar) | **Should Have** | Important for settings page |
| Storage quota enforcement | **Must Have** | Prevents abuse; tied to upload flow |

---

## 2. File Operations

| Feature | Tier | Rationale |
|---|---|---|
| Upload (single file) | **Must Have** | Core product function |
| Upload (multi-file) | **Should Have** | UX improvement; same upload hook |
| Download | **Must Have** | Core product function |
| Rename | **Must Have** | Essential file management |
| Delete (soft → Trash) | **Must Have** | With Trash recovery |
| Move | **Must Have** | Fundamental file manager feature |
| Copy | **Should Have** | Important but non-blocking |
| Cut/Paste | **Should Have** | Clipboard flow |
| Duplicate | **Could Have** | Convenience; not essential |
| Preview (images, PDF, video, audio, text) | **Should Have** | Strong differentiator vs basic storage |
| Favorite / Star | **Could Have** | Nice to have; not core |
| Restore from Trash | **Must Have** | Required since we soft delete |
| Permanently delete from Trash | **Must Have** | Required for storage management |
| File Properties Panel | **Could Have** | Informational only; low priority |
| Share (generate link) | **Future** | Requires share token system; defer to v2 |

---

## 3. Folder Operations

| Feature | Tier | Rationale |
|---|---|---|
| Create Folder | **Must Have** | Basic organization |
| Rename Folder | **Must Have** | Basic organization |
| Delete Folder (soft) | **Must Have** | With cascade |
| Move Folder | **Must Have** | Organization |
| Nested Folders (infinite depth) | **Must Have** | Core architectural requirement |
| Breadcrumb Navigation | **Must Have** | Essential UX for nested navigation |
| Copy Folder (deep copy) | **Should Have** | Important but complex (async for large trees) |
| Cut/Paste Folder | **Should Have** | Part of clipboard flow |
| Folder Properties Panel | **Could Have** | Low value for v1 |
| Folder color | **Could Have** | Visual organization; not essential |

---

## 4. Clipboard System

| Feature | Tier | Rationale |
|---|---|---|
| Copy to clipboard | **Should Have** | Depends on copy/move endpoints |
| Cut to clipboard | **Should Have** | Depends on move endpoint |
| Paste from clipboard | **Should Have** | Completes the clipboard flow |
| Clipboard persists across navigation | **Should Have** | Required for usability |
| Cut items appear faded (visual feedback) | **Could Have** | Polish |
| Multi-select clipboard | **Future** | Multi-select itself is v2 scope |

---

## 5. File Preview

| Feature | Tier | Rationale |
|---|---|---|
| Image preview | **Should Have** | High value, easy to implement |
| PDF preview | **Should Have** | High value, browser-native |
| Video preview | **Could Have** | Large files; streaming complexity |
| Audio preview | **Could Have** | Low priority for most users |
| Text file preview | **Should Have** | Dev-friendly; easy |
| Unsupported format fallback | **Must Have** | Required for robustness |
| Plugin registry architecture | **Must Have** | Architecture constraint — do this right from day one |

> **Note:** Video preview is moved to Could Have because video streaming via presigned URL has complexity around range requests and mobile compatibility. Architecture supports it from day one.

---

## 6. Context Menu

| Feature | Tier | Rationale |
|---|---|---|
| File context menu | **Must Have** | Core interaction pattern |
| Folder context menu | **Must Have** | Core interaction pattern |
| Empty area context menu | **Should Have** | Improves UX significantly |
| Keyboard shortcuts (Ctrl+C, Ctrl+X, Ctrl+V) | **Should Have** | Expected by power users |

---

## 7. Storage Dashboard

| Feature | Tier | Rationale |
|---|---|---|
| Total / Used / Free storage | **Must Have** | Core information |
| Storage breakdown by file type | **Should Have** | Good UX, pre-computed in stats table |
| Recent uploads | **Should Have** | Homepage anchor feature |
| Activity history feed | **Should Have** | Valuable; uses activity_logs table |

---

## 8. Search

| Feature | Tier | Rationale |
|---|---|---|
| Search by name | **Must Have** | Cannot ship without basic search |
| Filter by extension | **Should Have** | Power user feature; easy to add |
| Filter by file type category | **Should Have** | Useful for dashboard-style filtering |
| Filter by size | **Could Have** | Low priority for most users |
| Filter by date | **Could Have** | Moderate value |
| Search within folder | **Could Have** | Moderate value |
| Full-text content search | **Future** | Requires ElasticSearch; v3+ |

---

## 9. Views & Sorting

| Feature | Tier | Rationale |
|---|---|---|
| Grid View | **Must Have** | Primary visual mode |
| List View | **Must Have** | Essential for file managers |
| Sort by Name / Date / Size / Type | **Must Have** | Cannot ship without sorting |
| Ascending / Descending | **Must Have** | Required for sorting |
| View preference persisted | **Should Have** | UX comfort |

---

## 10. Trash / Recycle Bin

| Feature | Tier | Rationale |
|---|---|---|
| Soft delete to Trash | **Must Have** | ADR-006 |
| Restore from Trash | **Must Have** | Reason for soft delete |
| Permanently delete | **Must Have** | Storage management |
| Empty Trash (bulk) | **Should Have** | UX convenience |
| Auto-purge after 30 days | **Should Have** | Production hygiene |

---

## 11. Settings

| Feature | Tier | Rationale |
|---|---|---|
| Edit Profile (name) | **Should Have** | Basic account management |
| Change Password | **Should Have** | Security |
| Profile Picture | **Could Have** | Low value, storage complexity |
| Theme (Light / Dark) | **Should Have** | Modern UX expectation |
| Default View (Grid / List) | **Should Have** | Ties to view persistence |
| Default Sort Order | **Could Have** | Minor comfort feature |
| Language | **Future** | i18n infrastructure not in scope |
| Storage Information | **Should Have** | Mirrors dashboard stats |

---

## 12. Notifications

| Feature | Tier | Rationale |
|---|---|---|
| In-app notification bell | **Should Have** | Good UX signal for async ops |
| Upload complete / failed | **Should Have** | Valuable feedback |
| Delete / Rename / Move events | **Could Have** | Lower urgency |
| Quota exceeded alert | **Must Have** | Critical user-facing error |
| Real-time push notifications | **Future** | Requires WebSocket; defer to v3 |

---

## 13. Activity History

| Feature | Tier | Rationale |
|---|---|---|
| Log all operations | **Should Have** | Audit trail; built into service layer |
| Activity feed in dashboard | **Should Have** | Surfaces the log data |
| Filter activity by type | **Could Have** | Power user feature |

---

## 14. Desktop Application

| Feature | Tier | Rationale |
|---|---|---|
| Browse cloud storage | **Must Have** | Core desktop feature |
| Upload from local disk | **Must Have** | Core desktop feature |
| Download to local disk | **Must Have** | Core desktop feature |
| Delete cloud files | **Must Have** | Core desktop feature |
| Organize cloud storage (rename, move, new folder) | **Should Have** | Full feature parity with web |
| Context menu | **Should Have** | Expected UX |
| Local file browser panel | **Must Have** | Unified dual-pane experience is a core requirement |
| Auto-sync | **Future** | ADR-004 — explicitly out of scope |

---

## 15. File Naming Rules

| Feature | Tier | Rationale |
|---|---|---|
| Unique name enforcement within folder | **Must Have** | Data integrity requirement |
| 409 Conflict response | **Must Have** | Required API behavior |
| Auto-rename on copy (`(copy)`, `(copy 2)`) | **Must Have** | Prevents copy failures |

---

## V1 Scope Summary

### ✅ Must Have — Ship with v1 (non-negotiable)
Auth (register/login/refresh/logout), quota enforcement, upload (single), download, rename, delete, move, restore from Trash, permanent delete, create/rename/delete/move folder, nested folders, breadcrumbs, file listing (grid + list), sorting (all options), search by name, storage stats, quota exceeded notification, context menus (file + folder), preview fallback, preview plugin architecture, naming rule enforcement, 409 responses, soft delete everywhere.

### 🟡 Should Have — Target for v1
Multi-file upload, copy, cut/paste clipboard, image/PDF/text preview, empty area context menu, keyboard shortcuts, storage breakdown, recent uploads, activity feed, empty trash, auto-purge, settings (profile, password, theme, view defaults, storage info), in-app notifications (upload/quota), search filters (extension, type category), folder copy, view preference persistence.

### 🔵 Could Have — Include if core is stable
Duplicate file, video/audio preview, file/folder properties panels, folder color, favorite/star, filter by size/date, profile picture, default sort setting, activity filter, cut item visual feedback.

### 🚀 Future Versions (v2+)
File sharing (share links), file versioning, team workspaces, real-time sync, comments, mobile app, multi-select, full-text search, i18n/language support, real-time push notifications, auto-sync.

---

## Features Recommended for Demotion from v1

| Feature | Original Priority | Recommended | Reason |
|---|---|---|---|
| File Share / Share Links | P2 | **v2** | Requires token auth bypass, link expiry management, and download tracking — a complete sub-system |
| Video Streaming Preview | P1 | **Could Have** | Range request complexity, large file handling, mobile codec support |
| Profile Picture Upload | P1 | **Could Have** | Requires its own S3 upload flow for avatars; low user impact |
| Multi-select | Not in PRD | **v2** | Requires selection store, bulk API endpoints, and significant UI work |
| Language / i18n | P3 | **v3** | Requires i18n infrastructure, translation files, locale routing |
