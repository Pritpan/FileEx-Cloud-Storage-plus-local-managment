// =============================================================================
// file.routes.js — Route definitions for the Files module
//
// Mount point: /api/v1/files  (registered in app.js)
//
// All file routes require a valid JWT access token.
// The authenticate middleware attaches req.user before any handler runs.
// =============================================================================

import { Router }       from 'express';
import authenticate     from '../../middleware/authenticate.js';
import * as fileController from './file.controller.js';

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/v1/files/upload/initiate
//
// Phase 1 of the two-phase upload flow.
// Validates the upload request, checks quota, creates a PENDING File record,
// and returns a presigned S3 PUT URL.
// The client uploads file bytes directly to S3 using that URL.
//
// See: docs/ARCHITECTURE.md §6.1 (Two-Phase Upload Flow)
// See: docs/API_SPEC.md — POST /files/upload/initiate
// ---------------------------------------------------------------------------
router.post('/upload/initiate', authenticate, fileController.initiateUpload);

// ---------------------------------------------------------------------------
// POST /api/v1/files/upload/complete
//
// Phase 2 of the two-phase upload flow.
// Confirms that the client has uploaded the file to S3. Verifies object
// existence, transitions status PENDING → READY, and increments usedStorage.
//
// See: docs/ARCHITECTURE.md §6.2 (Two-Phase Upload Flow — Confirmation)
// See: docs/API_SPEC.md — POST /files/upload/complete
// ---------------------------------------------------------------------------
router.post('/upload/complete', authenticate, fileController.completeUpload);

// ---------------------------------------------------------------------------
// GET /api/v1/files
//
// Lists immediate children of a folder or the virtual root.
// parentId = null (absent or "null") → root items
// parentId = N                       → children of folder N
//
// See: docs/API_SPEC.md — GET /files
// ---------------------------------------------------------------------------
router.get('/', authenticate, fileController.listFiles);

// ---------------------------------------------------------------------------
// GET /api/v1/files/search
//
// Searches active files and folders by displayName.
// ---------------------------------------------------------------------------
router.get('/search', authenticate, fileController.searchFiles);

// ---------------------------------------------------------------------------
// GET /api/v1/files/recent
//
// Returns the 20 most recently uploaded files for the authenticated user.
// Must be declared before /:id to prevent 'recent' being treated as an id.
// ---------------------------------------------------------------------------
router.get('/recent', authenticate, fileController.getRecentFiles);

// ---------------------------------------------------------------------------
// POST /api/v1/files/folders
//
// Creates a new folder. parentId null = create in virtual root.
// ---------------------------------------------------------------------------
router.post('/folders', authenticate, fileController.createFolder);

// ---------------------------------------------------------------------------
// PATCH /api/v1/files/:id/rename
//
// Renames a file or folder. Only updates displayName.
// ---------------------------------------------------------------------------
router.patch('/:id/rename', authenticate, fileController.renameItem);

// ---------------------------------------------------------------------------
// PATCH /api/v1/files/:id/move
//
// Moves a file or folder to a different parent (or to the root).
// Only updates parentId. storageKey is never touched.
// ---------------------------------------------------------------------------
router.patch('/:id/move', authenticate, fileController.moveItem);

// ---------------------------------------------------------------------------
// GET /api/v1/files/:id/download-url
//
// Returns a temporary presigned S3 GET URL.
// Client downloads bytes directly from S3 — backend never streams.
// ---------------------------------------------------------------------------
router.get('/:id/download-url', authenticate, fileController.getDownloadUrl);

// ---------------------------------------------------------------------------
// GET /api/v1/files/:id/preview-url
//
// Returns a temporary presigned S3 GET URL for in-browser preview.
// MVP delegates to the same S3 GET URL as download.
// Kept separate for future preview-specific behaviour (inline disposition, etc.)
// ---------------------------------------------------------------------------
router.get('/:id/preview-url', authenticate, fileController.getPreviewUrl);

// ---------------------------------------------------------------------------
// GET /api/v1/files/:id/properties
//
// Returns properties/metadata for a single file or folder.
// ---------------------------------------------------------------------------
router.get('/:id/properties', authenticate, fileController.getProperties);

// ---------------------------------------------------------------------------
// DELETE /api/v1/files/:id
//
// Soft deletes a file or folder (moves to trash).
// If a folder, recursively soft deletes all descendants.
// ---------------------------------------------------------------------------
router.delete('/:id', authenticate, fileController.deleteItem);

// ---------------------------------------------------------------------------
// GET /api/v1/trash
//
// Lists all items in the trash (soft-deleted items).
// ---------------------------------------------------------------------------
router.get('/trash', authenticate, fileController.getTrash);

// ---------------------------------------------------------------------------
// POST /api/v1/trash/:id/restore
//
// Restores an item from the trash.
// If a folder, recursively restores all descendants.
// ---------------------------------------------------------------------------
router.post('/trash/:id/restore', authenticate, fileController.restoreItem);

// ---------------------------------------------------------------------------
// DELETE /api/v1/trash/:id
//
// Permanently deletes an item from the trash.
// Deletes S3 objects and updates StorageStats.
// ---------------------------------------------------------------------------
router.delete('/trash/:id', authenticate, fileController.permanentlyDeleteItem);

export default router;
