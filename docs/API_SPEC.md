# Fileex — API Specification

**Version:** 1.4 | **Base URL:** `/api/v1` | **Status:** In Progress | **Last Updated:** 2026-08-05

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
| StorageStats | `id` | `INT` | AUTO_INCREMENT |
| **File** | `id` | **`INT`** | AUTO_INCREMENT — used for both files and folders |

> File IDs and Folder IDs are the **same integer type** — folders are `File` rows with `type = FOLDER`. There is no separate Folder entity.

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
| 422 Unprocessable Entity | Semantic validation failure | S3 object not found |
| 429 Too Many Requests | Rate limit exceeded | Auth endpoints |
| 500 Internal Server Error | Unexpected server error | Unhandled exceptions |
| 503 Service Unavailable | Storage service error | S3 unavailable |

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
| `DEST_FOLDER_NOT_FOUND` | 404 | Destination folder does not exist or is not owned by the requester |
| `NAME_CONFLICT` | 409 | A file or folder with this name already exists in the target folder |
| `FORBIDDEN` | 403 | Operation is not permitted (e.g., wrong owner) |
| `NOT_A_FILE` | 409 | Operation requires a file but a folder ID was provided |
| `MOVE_SELF` | 409 | A folder cannot be moved into itself |
| `MOVE_CYCLE` | 409 | Move would create a circular folder reference |

**Upload**
| Code | HTTP | Description |
|---|---|---|
| `UPLOAD_NOT_COMPLETED` | 422 | S3 object was not found — upload did not complete |
| `QUOTA_EXCEEDED` | 413 | Upload size would exceed the user's storage quota |
| `FILE_ALREADY_READY` | 409 | File has already been confirmed — cannot complete twice |
| `FILE_ALREADY_FAILED` | 409 | Upload previously failed — initiate a new upload |
| `FILE_PENDING` | 409 | File is still in PENDING state |
| `FILE_FAILED` | 409 | File upload failed — object is not in S3 |

**Storage**
| Code | HTTP | Description |
|---|---|---|
| `STORAGE_UNAVAILABLE` | 503 | AWS S3 service is temporarily unavailable |
| `INTERNAL_ERROR` | 500 | Unexpected internal consistency error |

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
- `mimeType` — required
- `size` — must be `> 0`

**Folder (type = `FOLDER`):**
- `storageKey` — must be `NULL`
- `mimeType` — must be `NULL`
- `size` — must be `0`

---

---

## Module 1 — Authentication

### `POST /auth/register`
Register a new user account. Creates `users` and `storage_stats` rows atomically in a single transaction.

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
**Response `200`:** Full user object (hashedPassword excluded).

---

## Module 2 — Files

> All file and folder operations are under the `/files` prefix. Folders are stored in the same `files` table as files (`type = FOLDER`). There is no separate `/folders` module in the implemented backend.

### `POST /files/upload/initiate` 🔒
Phase 1: Request presigned S3 PUT URL. Creates a `File` record with `status = PENDING`.

**Body:**
```json
{ "displayName": "document.pdf", "mimeType": "application/pdf", "size": 2048576, "parentId": null }
```

> `parentId` — INT or `null`. `null` places the file at the root of the user's drive.

**Validation performed server-side (Service layer):**
- `size` must not cause storage quota to be exceeded → `413 QUOTA_EXCEEDED`
- `displayName` must not conflict with an existing item in the target folder → `409 NAME_CONFLICT`
- `parentId` (if supplied) must exist, belong to user, and be a `FOLDER` → `404 FOLDER_NOT_FOUND`

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "fileId": 123,
    "storageKey": "users/cuid/files/uuid",
    "uploadUrl": "https://s3.amazonaws.com/...",
    "expiresIn": 900
  }
}
```

> `fileId` is an **integer** (INT AUTO_INCREMENT). `expiresIn` is in seconds.

---

### `POST /files/upload/complete` 🔒
Phase 2: Confirm upload completed. Backend verifies the S3 object exists, then atomically sets `status = READY` and increments `StorageStats.usedStorage`.

If the S3 object does not exist, sets `status = FAILED` and returns `422 UPLOAD_NOT_COMPLETED`.

**Body:**
```json
{ "fileId": 123 }
```

> `fileId` is an **integer**.

**Response `200`:**
```json
{ "success": true, "message": "Upload completed successfully." }
```

---

### `GET /files` 🔒
List immediate children of a folder (or the virtual root). Returns items with `deletedAt IS NULL`, ordered folders-first then alphabetically.

**Query Params:**
| Param | Type | Description |
|---|---|---|
| `parentId` | INT or omit/`null` | Folder to browse. Omit or `null` for root. |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "parentId": null,
    "items": [ ... ]
  }
}
```

> Pagination and sorting query params are reserved for a future release. Current implementation returns all immediate children.

---

### `POST /files/folders` 🔒
Create a new folder.

**Body:** `{ "displayName": "My Projects", "parentId": null }`

**Validation:** `displayName` must not conflict in same parent → `409 NAME_CONFLICT`  
**Response `201`:** Folder object (see Appendix A).

---

### `GET /files/:id/download-url` 🔒
Generates a temporary presigned S3 GET URL. The backend never streams file bytes.

**Validation:** File must exist, belong to user, be `type = FILE`, and `status = READY`.

**Response `200`:**
```json
{ "success": true, "url": "https://...", "expiresIn": 900 }
```

> `expiresIn` is in seconds (900 = 15 minutes).

---

### `GET /files/:id/preview-url` 🔒
Generates a temporary presigned S3 GET URL for in-browser preview. MVP behaviour is identical to download-url. Future versions will add `Content-Disposition: inline` and image transforms.

**Validation:** Same as download-url.

**Response `200`:**
```json
{ "success": true, "url": "https://...", "expiresIn": 900 }
```

---

### `PATCH /files/:id/rename` 🔒
Rename a file or folder. Updates `displayName` only.

**Body:** `{ "displayName": "new-name.pdf" }`

**Validation:** `displayName` must not conflict in same folder → `409 NAME_CONFLICT`  
**Response `200`:** Updated file/folder object (see Appendix A).

---

### `PATCH /files/:id/move` 🔒
Move a file or folder to a different parent. Updates `parentId` only. `storageKey` is never changed.

**Body:** `{ "parentId": 123 }` or `{ "parentId": null }` to move to root.

**Validation:**
- `displayName` must not conflict in destination → `409 NAME_CONFLICT`
- Cannot move a folder into itself → `409 MOVE_SELF`
- Cannot move a folder into any of its own descendants → `409 MOVE_CYCLE`

**Response `200`:** Updated file/folder object (see Appendix A).

---

## Module 3 — Storage Dashboard

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

---

## Future (v2) — Unimplemented Features

The following endpoints are planned but not yet implemented. They are kept here for design reference.

---

### Auth (v2)

#### `PATCH /auth/password` 🔒
**Body:** `{ "currentPassword": "...", "newPassword": "..." }`  
**Response `200`:** `{ "message": "Password updated" }`

---

### Files (v2)

#### `GET /files/:id`
Single file metadata. **Response `200`:** File object.

#### `DELETE /files/:id` 🔒
Soft delete → Trash (sets `deletedAt`). Does not create a separate trash record.  
**Response `200`:** `{ "message": "File moved to trash" }`

#### `POST /files/:id/copy` 🔒
Copy file to destination. **Auto-renames** if name conflicts: `file.pdf` → `file (copy).pdf`

**Body:** `{ "parentId": null }`  
**Response `201`:** New file object.

#### `POST /files/:id/duplicate` 🔒
Duplicate in current folder. Auto-renames: `file.pdf` → `file (copy).pdf`  
**Response `201`:** New file object.

#### `PATCH /files/:id/favorite` 🔒
Toggle favorite. **Response `200`:** `{ "isFavorited": true }`

#### `GET /files/favorites` 🔒
All favorited files. **Response `200`:** Array of file objects.

---

### Folder Breadcrumb & Contents (v2)

#### `GET /files/:id/breadcrumb` 🔒
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

#### `GET /files/:id/contents` 🔒
All files and subfolders inside a folder in one call.  
**Query:** `sortBy`, `sortDir`, `page`, `limit`  
**Response `200`:** `{ folder, items: [...] }`

#### `POST /files/:id/copy` 🔒 (Folder)
Deep copy folder. Auto-renames if name conflicts.

**Body:** `{ "parentId": null }`  
**Response `202`:** `{ "newFolderId": 48, "message": "Copy in progress" }` *(async for large trees)*

---

### Trash (v2)

> Trash uses the `deletedAt` column on the `files` table. There is no separate `trash_items` table.

#### `GET /trash` 🔒
All items in user's Trash (`WHERE deletedAt IS NOT NULL`).  
**Response `200`:** Array of file/folder objects with `deletedAt` populated.

#### `POST /trash/:id/restore` 🔒
Restore to original location. Checks if original parent still exists (restores to root if not).  
**Response `200`:** `{ "message": "Restored successfully" }`

#### `DELETE /trash/:id` 🔒
Permanently delete one trash item. Deletes S3 object.  
**Response `200`:** `{ "message": "Permanently deleted" }`

#### `DELETE /trash` 🔒
Empty Trash. Permanently deletes all trashed items and S3 objects.  
**Response `200`:** `{ "deleted": 42 }`

---

### Search (v2)

#### `GET /search` 🔒

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
| parentId | int | Search within this folder; omit or null for all folders |
| sortBy | string | `name`, `size`, `createdAt` |
| sortDir | string | `asc` or `desc` |
| page | int | |
| limit | int | Max 100 |

**Response `200`:** Paginated matching files and folders.

---

### Activity (v2)

#### `GET /activity` 🔒
**Query:** `page`, `limit` (max 100), `action` (filter)  
**Response `200`:** Paginated activity log array.

---

### Users (v2)

#### `PATCH /users/me` 🔒
Update profile. **Body:** `{ "firstName": "Jane", "lastName": "Doe" }`  
**Response `200`:** Updated user object.

#### `POST /users/me/avatar` 🔒
Request presigned URL for avatar upload (same two-phase flow as files).

---

### Settings (v2)

#### `GET /settings` 🔒
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

#### `PATCH /settings` 🔒
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

---

### Notifications (v2)

#### `GET /notifications` 🔒

#### `PATCH /notifications/:id/read` 🔒

#### `PATCH /notifications/read-all` 🔒

#### `DELETE /notifications/:id` 🔒

#### `DELETE /notifications` 🔒

---

### Sharing (v2)

#### `POST /files/:id/share` 🔒
Generate a shareable link.  
**Body:** `{ "expiresAt": "2026-07-29T00:00:00Z" }`  
**Response `201`:** `{ shareUrl, token, expiresAt }`

#### `GET /s/:token` *(Public)*
Access shared file.  
**Response `200`:** File metadata + presigned download URL (if token valid).

---

## Appendix A — Safe File Object Schema

The API response shape strips internal fields (`storageKey`, `ownerId`, `deletedAt`) from raw database records. Both files and folders use the same shape.

**File example:**
```json
{
  "id": 42,
  "parentId": 7,
  "displayName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 2048576,
  "type": "FILE",
  "status": "READY",
  "createdAt": "2026-06-29T18:00:00Z",
  "updatedAt": "2026-06-29T18:00:00Z"
}
```

**Folder example:**
```json
{
  "id": 7,
  "parentId": null,
  "displayName": "My Projects",
  "mimeType": null,
  "size": 0,
  "type": "FOLDER",
  "status": "READY",
  "createdAt": "2026-06-29T18:00:00Z",
  "updatedAt": "2026-06-29T18:00:00Z"
}
```

> `id` and `parentId` are **integers** for both files and folders. `storageKey` and `ownerId` are internal fields and are never included in API responses.

## Appendix B — Naming Conflict Rules Summary

| Operation | Conflict Behaviour |
|---|---|
| Upload | `409 NAME_CONFLICT` — user must rename manually |
| Create Folder | `409 NAME_CONFLICT` — user must rename manually |
| Rename File/Folder | `409 NAME_CONFLICT` — user must choose a different `displayName` |
| Move File/Folder | `409 NAME_CONFLICT` — user must resolve manually |
| Move Folder (cycle) | `409 MOVE_CYCLE` |
| Copy File *(v2)* | **Auto-rename** → `file (copy).pdf`, `file (copy 2).pdf`, ... |
| Copy Folder *(v2)* | **Auto-rename** → `Folder (copy)`, `Folder (copy 2)`, ... |
| Duplicate File *(v2)* | **Auto-rename** → `file (copy).pdf` |
