// =============================================================================
// file.controller.js
//
// Responsibility: HTTP only — parse request, call service, send response.
// Controllers never contain business logic.
//
// Helpers (validate / handleService) are intentionally private to this file.
// They mirror the same pattern used in auth.controller.js.
// =============================================================================

import * as fileService from './file.service.js';
import {
  InitiateUploadSchema,
  CompleteUploadSchema,
  ListFilesQuerySchema,
  CreateFolderSchema,
  RenameSchema,
  MoveSchema,
} from './file.schema.js';

// ---------------------------------------------------------------------------
// validate — run a Zod schema against req.body.
// Returns { ok: true, data } or { ok: false, response } (ready to send).
// ---------------------------------------------------------------------------
const validate = (schema, body) => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          issues: parsed.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
      },
    };
  }
  return { ok: true, data: parsed.data };
};

// ---------------------------------------------------------------------------
// handleService — call a service function and catch typed errors.
// Returns the result, or sends an error response and returns null.
// ---------------------------------------------------------------------------
const handleService = async (res, fn) => {
  try {
    const result = await fn();
    return result;
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: { code: err.code || 'INTERNAL_ERROR', message: err.message },
    });
    return null;
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/files/upload/initiate
// Protected — authenticate middleware runs before this handler.
// req.user is attached by authenticate and contains the authenticated user.
// ---------------------------------------------------------------------------
export const initiateUpload = async (req, res) => {
  const { ok, data, response } = validate(InitiateUploadSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.initiateUpload(data, req.user.id),
  );

  if (result) res.status(201).json(result);
};

// ---------------------------------------------------------------------------
// POST /api/v1/files/upload/complete
// Protected — authenticate middleware runs before this handler.
// ---------------------------------------------------------------------------
export const completeUpload = async (req, res) => {
  const { ok, data, response } = validate(CompleteUploadSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.confirmUpload(data, req.user.id),
  );

  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// GET /api/v1/files
// Protected — authenticate middleware runs before this handler.
// Validates req.query (not req.body) — parentId is a query parameter.
// ---------------------------------------------------------------------------
export const listFiles = async (req, res) => {
  const { ok, data, response } = validate(ListFilesQuerySchema, req.query);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.listFiles(data, req.user.id),
  );

  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// POST /api/v1/files/folders
// ---------------------------------------------------------------------------
export const createFolder = async (req, res) => {
  const { ok, data, response } = validate(CreateFolderSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.createFolder(data, req.user.id),
  );

  if (result) res.status(201).json(result);
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/files/:id/rename
// ---------------------------------------------------------------------------
export const renameItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const { ok, data, response } = validate(RenameSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.renameItem(id, data, req.user.id),
  );

  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/files/:id/move
// ---------------------------------------------------------------------------
export const moveItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const { ok, data, response } = validate(MoveSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.moveItem(id, data, req.user.id),
  );

  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// Helper: parse and validate :id route parameter.
// Extracted to avoid duplicating the same guard in every handler below.
// ---------------------------------------------------------------------------
const parseId = (rawId) => {
  const id = parseInt(rawId, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// ---------------------------------------------------------------------------
// GET /api/v1/files/:id/download-url
// ---------------------------------------------------------------------------
export const getDownloadUrl = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const result = await handleService(res, () =>
    fileService.getDownloadUrl(id, req.user.id),
  );

  if (result) res.status(200).json(result);
};

// ---------------------------------------------------------------------------
// GET /api/v1/files/:id/preview-url
// ---------------------------------------------------------------------------
export const getPreviewUrl = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const result = await handleService(res, () =>
    fileService.getPreviewUrl(id, req.user.id),
  );

  if (result) res.status(200).json(result);
};
