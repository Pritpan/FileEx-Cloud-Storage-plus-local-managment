# Fileex — API Specification

**Version:** 1.3 | **Base URL:** `/api/v1` | **Status:** Planning | **Last Updated:** 2026-06-30

---

## Conventions

### Request / Response Format
- All bodies: `application/json`
- All timestamps: ISO 8601 (`2026-06-29T18:00:00Z`)
- All IDs: UUID v4 strings
- File sizes: bytes (integer)

### Authentication
Protected routes require `Authorization: Bearer <accessToken>` header.

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
  "pagination": { "page": 1, "limit": 50, "total": 200, "totalPages": 4 }
}
```

**Error:**
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "File not found" }
}
```

### Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| VALIDATION_ERROR | 400 | Invalid request body/params |
| UNAUTHORIZED | 401 | Missing or invalid access token |
| FORBIDDEN | 403 | Authenticated but no permission |
| NOT_FOUND | 404 | Resource does not exist |
| NAME_CONFLICT | 409 | A file/folder with this name exists in this folder |
| QUOTA_EXCEEDED | 413 | Upload would exceed storage quota |
| CIRCULAR_REFERENCE | 422 | Move would create a circular folder reference |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Module 1 — Authentication

### `POST /auth/register`
Register a new user account. Creates `users`, `user_settings`, and `storage_stats` rows atomically.

**Body:**
```json
{ "email": "user@example.com", "password": "SecurePass123!", "firstName": "John", "lastName": "Doe" }
```
**Response `201`:** `{ user, accessToken }` + sets HTTP-only refresh cookie.

---

### `POST /auth/login`
**Body:** `{ "email": "...", "password": "..." }`  
**Response `200`:** `{ user, accessToken }` + sets HTTP-only refresh cookie.

---

### `POST /auth/refresh`
Issue new access token using refresh cookie.  
**Response `200`:** `{ "accessToken": "eyJ..." }`

---

### `POST /auth/logout`
Revoke refresh token. **Response `200`:** `{ "message": "Logged out" }`

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

**Validation performed server-side:**
- `size` must not cause storage quota to be exceeded → `413 QUOTA_EXCEEDED`
- `mimeType` must be in allowed list → `400 VALIDATION_ERROR`
- `displayName` must not conflict with existing item in target folder → `409 NAME_CONFLICT`

**Response `201`:**
```json
{ "fileId": 123, "uploadUrl": "https://s3.amazonaws.com/..." }
```

---

### `POST /upload/complete` 🔒
Phase 2: Confirm upload completed. Backend verifies object exists in S3, updates `status = READY`, updates `StorageStats.usedStorage`, creates `notifications` record (type: `upload_complete`).  

**Body:**
```json
{ "fileId": 123 }
```
**Response `200`:** Complete file object.

---

### `GET /files` 🔒
List files in a folder.

**Query Params:** `folderId` (null = root), `sortBy` (`name`|`size`|`createdAt`|`extension`), `sortDir` (`asc`|`desc`), `page`, `limit`  
**Response `200`:** Paginated file array.

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
**Body:** `{ "name": "new-name.pdf" }`

**Validation:** `name` must not conflict in same folder → `409 NAME_CONFLICT`  
**Response `200`:** Updated file object.

---

### `PATCH /files/:id/move` 🔒
**Body:** `{ "destinationFolderId": "uuid-or-null" }`

**Validation:** `name` must not conflict in destination → `409 NAME_CONFLICT`  
**Response `200`:** Updated file object.

---

### `POST /files/:id/copy` 🔒
Copy file to destination. **Auto-renames** if name conflicts: `file.pdf` → `file (copy).pdf` → `file (copy 2).pdf`

**Body:** `{ "destinationFolderId": "uuid-or-null" }`  
**Response `201`:** New file object with resolved name.

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

**Body:** `{ "name": "My Projects", "parentId": "uuid-or-null", "color": "#6366f1" }`

**Validation:** `name` must not conflict in same parent → `409 NAME_CONFLICT`  
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
    { "id": null, "name": "My Drive" },
    { "id": "uuid-1", "name": "Documents" },
    { "id": "uuid-2", "name": "Projects" }
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
**Body:** `{ "name": "New Name" }`

**Validation:** `name` must not conflict in same parent → `409 NAME_CONFLICT`  
**Response `200`:** Updated folder object.

---

### `PATCH /folders/:id/move` 🔒
**Body:** `{ "destinationParentId": "uuid-or-null" }`

**Validation:**
- `name` must not conflict in destination → `409 NAME_CONFLICT`
- `destinationParentId` must not be the folder itself or any of its descendants → `422 CIRCULAR_REFERENCE`

**Response `200`:** Updated folder object.

---

### `POST /folders/:id/copy` 🔒
Deep copy folder. Auto-renames if name conflicts: `Projects` → `Projects (copy)` → `Projects (copy 2)`

**Body:** `{ "destinationParentId": "uuid-or-null" }`  
**Response `202`:** `{ "newFolderId": "uuid", "message": "Copy in progress" }` *(async for large trees)*

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
| folderId | string | Search within folder |
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
    "quotaBytes": 5368709120,
    "usedBytes": 1073741824,
    "freeBytes": 4294967296,
    "usedPercent": 20.0,
    "breakdown": {
      "imageBytes": 536870912,
      "videoBytes": 268435456,
      "audioBytes": 134217728,
      "documentBytes": 67108864,
      "otherBytes": 67108864
    },
    "fileCount": 142
  }
}
```

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

```json
{
  "id": 1,
  "ownerId": "uuid",
  "parentId": null,
  "displayName": "document.pdf",
  "storageKey": "users/uuid/files/uuid",
  "mimeType": "application/pdf",
  "size": 2048576,
  "type": "FILE",
  "status": "READY",
  "uploadStartedAt": "2026-06-29T17:55:00Z",
  "createdAt": "2026-06-29T18:00:00Z",
  "updatedAt": "2026-06-29T18:00:00Z"
}
```

*Note: For folders, `storageKey` is null, `mimeType` is null, `size` is 0, and `type` is FOLDER.*

## Appendix C — Naming Conflict Rules Summary

| Operation | Conflict Behaviour |
|---|---|
| Upload | `409 NAME_CONFLICT` — user must rename manually |
| Create Folder | `409 NAME_CONFLICT` — user must rename manually |
| Rename File | `409 NAME_CONFLICT` — user must choose a different name |
| Rename Folder | `409 NAME_CONFLICT` — user must choose a different name |
| Move File | `409 NAME_CONFLICT` — user must resolve manually |
| Move Folder | `409 NAME_CONFLICT` or `422 CIRCULAR_REFERENCE` |
| Copy File | **Auto-rename** → `file (copy).pdf`, `file (copy 2).pdf`, ... |
| Copy Folder | **Auto-rename** → `Folder (copy)`, `Folder (copy 2)`, ... |
| Duplicate File | **Auto-rename** → `file (copy).pdf` |
