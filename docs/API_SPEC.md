# Fileex — API Specification

**Version:** 1.4 | **Base URL:** `/api/v1` | **Status:** Finalized | **Last Updated:** 2026-07-08

---

## Conventions

### Request / Response Format
- All bodies: `application/json`
- All timestamps: ISO 8601 (`2026-06-29T18:00:00Z`)
- File sizes: bytes (integer)

### ID Type Conventions

IDs are **not** uniformly UUID. Each entity uses the type defined in the schema:

| Entity | ID Field | Type | Notes |
|---|---|---|---|
| User | `id` | `VARCHAR(36)` | cuid() |
| RefreshToken | `id` | `VARCHAR(36)` | cuid() |
| Notification | `id` | `VARCHAR(36)` | UUID v4 |
| TrashItem | `id` | `VARCHAR(36)` | UUID v4 |
| ActivityLog | `id` | `VARCHAR(36)` | UUID v4 |
| Favorite | `id` | `VARCHAR(36)` | UUID v4 |
| StorageStats | `id` | `VARCHAR(36)` | UUID v4 |
| ShareLink | `id` | `VARCHAR(36)` | UUID v4 |
| **File** | `id` | **`INT`** | AUTO_INCREMENT |
| **Folder** | `id` | **`INT`** | AUTO_INCREMENT (stored in `files` table) |

> File and Folder IDs are integers in all request bodies, path params, query params, and response payloads. Use `123` not `"abc-uuid"` in examples.

### Authentication
Protected routes require `Authorization: Bearer <accessToken>` header.

Tokens are delivered in the **response body** for all clients:
```json
{ "accessToken": "eyJ...", "refreshToken": "..." }
```

> **Future Production Enhancement — Web Application:** The Refresh Token will migrate to an HTTP-only Secure SameSite cookie, eliminating the need to send it in the request body.
> **Future Production Enhancement — Desktop Application:** The Refresh Token will be stored in secure OS credential storage (e.g., keychain). Cookie-based auth is not planned for Electron.

### Standard Response Envelope

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Paginated:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": { "page": 1, "limit": 50, "total": 200, "totalPages": 4, "hasNext": true, "hasPrevious": false }
}
```

**Error:**
```json
{
  "success": false,
  "error": { "code": "FILE_NOT_FOUND", "message": "File not found" }
}
```

---

## Standard HTTP Status Codes

| Status | Meaning | Typical Use |
|---|---|---|
| 200 OK | Request succeeded | GET, PATCH, DELETE (with body) |
| 201 Created | Resource created | POST (new resource) |
| 204 No Content | Success, no body | Reserved for future use |
| 400 Bad Request | Validation failure | Invalid body / query params |
| 401 Unauthorized | Missing or invalid token | Auth failure |
| 403 Forbidden | Authenticated, no permission | Ownership violation |
| 404 Not Found | Resource does not exist | File, folder, trash item |
| 409 Conflict | Name already exists in folder | Naming conflict |
| 413 Payload Too Large | Quota exceeded | Upload size check |
| 422 Unprocessable Entity | Semantic validation failure | Circular folder reference |
| 429 Too Many Requests | Rate limit exceeded | Auth endpoints |
| 500 Internal Server Error | Unexpected server error | Unhandled exceptions |

---

## Application Error Codes

All error responses use a `code` string in the `error` object. Codes are grouped by domain.

**Auth**
| Code | HTTP | Description |
|---|---|---|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email or password is incorrect |
| `AUTH_INVALID_TOKEN` | 401 | Access token is missing, malformed, or expired |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Refresh token is invalid, expired, or revoked |
| `AUTH_EMAIL_CONFLICT` | 409 | An account with this email already exists |

**Files & Folders**
| Code | HTTP | Description |
|---|---|---|
| `FILE_NOT_FOUND` | 404 | File does not exist or is not owned by the requester |
| `FOLDER_NOT_FOUND` | 404 | Folder does not exist or is not owned by the requester |
| `NAME_CONFLICT` | 409 | A file or folder with this name already exists in the target folder |
| `FORBIDDEN_OPERATION` | 403 | Operation is not permitted (e.g., wrong owner) |
| `INVALID_MIME_TYPE` | 400 | MIME type is not in the allowed list |
| `CIRCULAR_REFERENCE` | 422 | Move would create a circular folder reference |

**Upload**
| Code | HTTP | Description |
|---|---|---|
| `UPLOAD_NOT_FOUND` | 404 | No PENDING file record exists for the given `fileId` |
| `UPLOAD_NOT_COMPLETED` | 422 | S3 object was not found — upload did not complete |
| `QUOTA_EXCEEDED` | 413 | Upload size would exceed the user's storage quota |

**Trash**
| Code | HTTP | Description |
|---|---|---|
| `TRASH_ITEM_NOT_FOUND` | 404 | Trash item does not exist |

**General**
| Code | HTTP | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body or query params failed schema validation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

> These codes are the single source of truth. Do not define error codes in individual endpoint sections — reference this table.

---

## Pagination Standard

All paginated endpoints accept and return the same structure.

**Query Parameters:**
| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `page` | int | 1 | — | Page number (1-indexed) |
| `limit` | int | 50 | 100 | Items per page |

**Response `pagination` Object:**
```json
{
  "page": 1,
  "limit": 50,
  "total": 200,
  "totalPages": 4,
  "hasNext": true,
  "hasPrevious": false
}
```

---

## Sorting Standard

All listing endpoints that support sorting accept the same query parameters.

| Param | Type | Default | Description |
|---|---|---|---|
| `sortBy` | string | `name` | Field to sort by |
| `sortDir` | string | `asc` | Sort direction |

**Supported `sortBy` values:** `name`, `createdAt`, `updatedAt`, `size`, `type`

**Supported `sortDir` values:** `asc`, `desc`

---

## Repository Filter Rule

All repository query methods automatically filter `WHERE deletedAt IS NULL` — **except** methods inside the Trash repository, which query `WHERE deletedAt IS NOT NULL`.

No controller or service method should manually append a deleted-item filter. This is enforced at the repository layer by convention.

---

## Service Layer Invariants

The following rules are validated in the **Service layer**, not the database:

**File (type = `FILE`):**
- `storageKey` — required, immutable after creation
- `mimeType` — required, must be in allowed list
- `size` — must be `> 0`

**Folder (type = `FOLDER`):**
- `storageKey` — must be `NULL`
- `mimeType` — must be `NULL`
- `size` — must be `0`

---

---

## Module 1 — Authentication

### `POST /auth/register`
Register a new user account. Creates `users`, `user_settings`, and `storage_stats` rows atomically.

**Body:**
```json
{ "name": "Pratik Pandey", "email": "user@example.com", "password": "SecurePass123!" }
```
**Response `201`:** `{ user, accessToken, refreshToken }` — tokens returned in response body.

---

### `POST /auth/login`
**Body:** `{ "email": "...", "password": "..." }`  
**Response `200`:** `{ user, accessToken, refreshToken }` — tokens returned in response body.

---

### `POST /auth/refresh`
Issue a new token pair using the current refresh token. The old refresh token is rotated (invalidated) atomically.

**Body:** `{ "refreshToken": "..." }`  
**Response `200`:** `{ "accessToken": "eyJ...", "refreshToken": "..." }`

---

### `POST /auth/logout`
Revoke refresh token.

**Body:** `{ "refreshToken": "..." }`  
**Response `200`:** `{ "message": "Logged out successfully." }`

---

### `GET /auth/me` 🔒
Get current user profile.  
**Response `200`:** Full user object.

---

### `PATCH /auth/password` 🔒
**Body:** `{ "currentPassword": "...", "newPassword": "..." }`  
**Response `200`:** `{ "message": "Password updated" }`

---

## Module 2 — Files

### `POST /upload/initiate` 🔒
Phase 1: Request presigned S3 PUT URL. Creates a File record with `status = PENDING`.

**Body:**
```json
{ "displayName": "document.pdf", "mimeType": "application/pdf", "size": 2048576, "parentId": null }
```

> `parentId` — INT or `null`. `null` places the file at the root of the user's drive.

**Validation performed server-side (Service layer):**
- `size` must not cause storage quota to be exceeded → `413 QUOTA_EXCEEDED`
- `mimeType` must be in the allowed list → `400 INVALID_MIME_TYPE`
- `displayName` must not conflict with an existing item in the target folder → `409 NAME_CONFLICT`

**Response `201`:**
```json
{ "fileId": 123, "uploadUrl": "https://s3.amazonaws.com/..." }
```

> `fileId` is an **integer** (INT AUTO_INCREMENT).

---

### `POST /upload/complete` 🔒
Phase 2: Confirm upload completed. Backend verifies the S3 object exists, then atomically: sets `status = READY`, increments `StorageStats.usedStorage`, creates a `notifications` record (`type: upload_complete`).

If the S3 object does not exist, returns `422 UPLOAD_NOT_COMPLETED`.

**Body:**
```json
{ "fileId": 123 }
```

> `fileId` is an **integer**.

**Response `200`:** Complete file object.

---

### `GET /files` 🔒
List files in a folder. Only returns items with `status = READY` and `deletedAt IS NULL` (enforced at repository layer).

**Query Params:** `parentId` (INT or omit/null for root), `sortBy`, `sortDir`, `page`, `limit`  
**Response `200`:** Paginated file array. See [Pagination Standard](#pagination-standard) and [Sorting Standard](#sorting-standard).

---

### `GET /files/:id` 🔒
Single file metadata. **Response `200`:** File object.

---

### `GET /files/:id/download-url` 🔒
Presigned S3 GET URL for download. Updates `lastAccessedAt`. Creates `activity_log` entry.

**Response `200`:**
```json
{ "downloadUrl": "https://...", "expiresAt": "..." }
```

---

### `GET /files/:id/preview-url` 🔒
Presigned S3 GET URL for preview (15-min TTL). Updates `lastAccessedAt`.  
**Response `200`:** `{ "previewUrl": "...", "expiresAt": "..." }`

---

### `PATCH /files/:id/rename` 🔒
**Body:** `{ "displayName": "new-name.pdf" }`

**Validation:** `displayName` must not conflict in same folder → `409 NAME_CONFLICT`  
**Response `200`:** Updated file object.

---

### `PATCH /files/:id/move` 🔒
**Body:** `{ "destinationParentId": "int-or-null" }`

**Validation:** `displayName` must not conflict in destination → `409 NAME_CONFLICT`  
**Response `200`:** Updated file object.

---

### `POST /files/:id/copy` 🔒
Copy file to destination. **Auto-renames** if name conflicts: `file.pdf` → `file (copy).pdf` → `file (copy 2).pdf`

**Body:** `{ "destinationParentId": "int-or-null" }`  
**Response `201`:** New file object with resolved `displayName`.

---

### `POST /files/:id/duplicate` 🔒
Duplicate in current folder. Auto-renames: `file.pdf` → `file (copy).pdf`  
**Response `201`:** New file object.

---

### `DELETE /files/:id` 🔒
Soft delete → Trash. Creates `trashItems` record. Updates `storageStats`.  
**Response `200`:** `{ "message": "File moved to trash" }`

---

### `PATCH /files/:id/favorite` 🔒
Toggle favorite. **Response `200`:** `{ "isFavorited": true }`

---

### `GET /files/favorites` 🔒
All favorited files. **Response `200`:** Array of file objects.

---

## Module 3 — Folders

### `POST /folders` 🔒
Create folder.

**Body:** `{ "displayName": "My Projects", "parentId": null }`

**Validation:** `displayName` must not conflict in same parent → `409 NAME_CONFLICT`  
**Response `201`:** Folder object.

---

### `GET /folders` 🔒
List folders at a parent level.  
**Query:** `parentId`, `sortBy`, `sortDir`  
**Response `200`:** Array of folder objects.

---

### `GET /folders/:id` 🔒
Single folder metadata. **Response `200`:** Folder object.

---

### `GET /folders/:id/breadcrumb` 🔒
Ancestor path from root.

**Response `200`:**
```json
{
  "data": [
    { "id": null, "displayName": "My Drive" },
    { "id": 12, "displayName": "Documents" },
    { "id": 47, "displayName": "Projects" }
  ]
}
```

---

### `GET /folders/:id/contents` 🔒
All files and subfolders in one call.  
**Query:** `sortBy`, `sortDir`, `page`, `limit`  
**Response `200`:** `{ folder, folders: [...], files: [...] }`

---

### `PATCH /folders/:id/rename` 🔒
**Body:** `{ "displayName": "New Name" }`

**Validation:** `displayName` must not conflict in same parent → `409 NAME_CONFLICT`  
**Response `200`:** Updated folder object.

---

### `PATCH /folders/:id/move` 🔒
**Body:** `{ "destinationParentId": "int-or-null" }`

**Validation:**
- `displayName` must not conflict in destination → `409 NAME_CONFLICT`
- `destinationParentId` must not be the folder itself or any of its descendants → `422 CIRCULAR_REFERENCE`

**Response `200`:** Updated folder object.

---

### `POST /folders/:id/copy` 🔒
Deep copy folder. Auto-renames if name conflicts: `Projects` → `Projects (copy)` → `Projects (copy 2)`

**Body:** `{ "destinationParentId": "int-or-null" }`  
**Response `202`:** `{ "newFolderId": 48, "message": "Copy in progress" }` *(async for large trees)*

---

### `DELETE /folders/:id` 🔒
Soft delete folder and all contents. Creates `trashItems` record.  
**Response `200`:** `{ "message": "Folder moved to trash" }`

---

## Module 4 — Trash

### `GET /trash` 🔒
All items in user's Trash.  
**Response `200`:** Array of trash items (`itemType`, `originalName`, `deletedAt`, `scheduledPurgeAt`).

---

### `POST /trash/:id/restore` 🔒
Restore to original location. Checks if original parent still exists (restores to root if not).  
**Response `200`:** `{ "message": "Restored successfully" }`

---

### `DELETE /trash/:id` 🔒
Permanently delete one trash item. Deletes S3 object.  
**Response `200`:** `{ "message": "Permanently deleted" }`

---

### `DELETE /trash` 🔒
Empty Trash. Permanently deletes all trashed items and S3 objects.  
**Response `200`:** `{ "deleted": 42 }`

---

## Module 5 — Search

### `GET /search` 🔒

**Query Params:**
| Param | Type | Description |
|---|---|---|
| q | string | Name search term |
| type | string | `file` or `folder` |
| mimeCategory | string | `image`, `video`, `audio`, `document`, `other` |
| extension | string | e.g. `pdf`, `jpg` |
| minSize | int | Bytes |
| maxSize | int | Bytes |
| from | string | ISO date — createdAt after |
| to | string | ISO date — createdAt before |
| parentId | int | Search within this folder (INT); omit or null for all folders |
| sortBy | string | `name`, `size`, `createdAt` |
| sortDir | string | `asc` or `desc` |
| page | int | |
| limit | int | Max 100 |

**Response `200`:** Paginated matching files and folders.

---

## Module 6 — Storage Dashboard

### `GET /storage/stats` 🔒

**Response `200`:**
```json
{
  "data": {
    "usedStorage": 52428800,
    "storageLimit": 104857600,
    "freeStorage": 52428800,
    "usedPercent": 50.0
  }
}
```

> `storageLimit` default is `104857600` bytes (100 MB).  
> `freeStorage = storageLimit - usedStorage`.  
> `usedPercent = (usedStorage / storageLimit) * 100`, rounded to one decimal.

---

## Module 7 — Activity

### `GET /activity` 🔒
**Query:** `page`, `limit` (max 100), `action` (filter)  
**Response `200`:** Paginated activity log array.

---

## Module 8 — Users

### `PATCH /users/me` 🔒
Update profile. **Body:** `{ "firstName": "Jane", "lastName": "Doe" }`  
**Response `200`:** Updated user object.

### `POST /users/me/avatar` 🔒
Request presigned URL for avatar upload (same two-phase flow as files).

---

## Module 9 — Settings *(New in v1.3)*

### `GET /settings` 🔒
Fetch all user settings.

**Response `200`:**
```json
{
  "data": {
    "theme": "dark",
    "defaultView": "grid",
    "defaultSortBy": "name",
    "defaultSortDir": "asc",
    "language": "en"
  }
}
```

---

### `PATCH /settings` 🔒
Update one or more settings in a single call.

**Body (all fields optional):**
```json
{
  "theme": "dark",
  "defaultView": "list",
  "defaultSortBy": "createdAt",
  "defaultSortDir": "desc",
  "language": "en"
}
```

**Validation:**
- `theme`: must be `light`, `dark`, or `system`
- `defaultView`: must be `grid` or `list`
- `defaultSortBy`: must be `name`, `size`, `createdAt`, or `extension`
- `defaultSortDir`: must be `asc` or `desc`
- `language`: must be valid BCP 47 code (stored but has no effect in v1)

**Response `200`:** Updated settings object.

---

## Module 10 — Notifications *(New in v1.3)*

### `GET /notifications` 🔒
Fetch notifications for current user.

**Query Params:**
| Param | Type | Default | Description |
|---|---|---|---|
| unreadOnly | boolean | false | Return only unread |
| page | int | 1 | |
| limit | int | 20 | Max 50 |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "upload_complete",
      "title": "Upload Complete",
      "body": "document.pdf has been uploaded successfully.",
      "isRead": false,
      "metadata": { "fileId": "uuid", "fileName": "document.pdf" },
      "createdAt": "2026-06-30T17:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 },
  "unreadCount": 3
}
```

---

### `PATCH /notifications/:id/read` 🔒
Mark a single notification as read.  
**Response `200`:** `{ "id": "uuid", "isRead": true }`

---

### `PATCH /notifications/read-all` 🔒
Mark all notifications as read.  
**Response `200`:** `{ "updated": 5 }`

---

### `DELETE /notifications/:id` 🔒
Dismiss and delete a single notification.  
**Response `200`:** `{ "message": "Notification dismissed" }`

---

### `DELETE /notifications` 🔒
Clear all read notifications for the current user.  
**Response `200`:** `{ "deleted": 12 }`

---

## Module 11 — Sharing *(P2 / v2)*

### `POST /files/:id/share` 🔒
Generate a shareable link.  
**Body:** `{ "expiresAt": "2026-07-29T00:00:00Z" }`  
**Response `201`:** `{ shareUrl, token, expiresAt }`

### `GET /s/:token` *(Public)*
Access shared file.  
**Response `200`:** File metadata + presigned download URL (if token valid).

---

## Appendix A — Unified File Object Schema

**File example:**
```json
{
  "id": 42,
  "ownerId": "cuid-string",
  "parentId": 7,
  "displayName": "document.pdf",
  "storageKey": "users/cuid-string/files/uuid-v4",
  "mimeType": "application/pdf",
  "size": 2048576,
  "type": "FILE",
  "status": "READY",
  "uploadStartedAt": "2026-06-29T17:55:00Z",
  "deletedAt": null,
  "createdAt": "2026-06-29T18:00:00Z",
  "updatedAt": "2026-06-29T18:00:00Z"
}
```

**Folder example:**
```json
{
  "id": 7,
  "ownerId": "cuid-string",
  "parentId": null,
  "displayName": "My Projects",
  "storageKey": null,
  "mimeType": null,
  "size": 0,
  "type": "FOLDER",
  "status": "READY",
  "uploadStartedAt": null,
  "deletedAt": null,
  "createdAt": "2026-06-29T18:00:00Z",
  "updatedAt": "2026-06-29T18:00:00Z"
}
```

> `id` and `parentId` are **integers** for both files and folders. `ownerId` is a cuid string (User.id).

## Appendix C — Naming Conflict Rules Summary

| Operation | Conflict Behaviour |
|---|---|
| Upload | `409 NAME_CONFLICT` — user must rename manually |
| Create Folder | `409 NAME_CONFLICT` — user must rename manually |
| Rename File | `409 NAME_CONFLICT` — user must choose a different `displayName` |
| Rename Folder | `409 NAME_CONFLICT` — user must choose a different `displayName` |
| Move File | `409 NAME_CONFLICT` — user must resolve manually |
| Move Folder | `409 NAME_CONFLICT` or `422 CIRCULAR_REFERENCE` |
| Copy File | **Auto-rename** → `file (copy).pdf`, `file (copy 2).pdf`, ... |
| Copy Folder | **Auto-rename** → `Folder (copy)`, `Folder (copy 2)`, ... |
| Duplicate File | **Auto-rename** → `file (copy).pdf` |
