import * as fileService from './file.service.js';
import {
  InitiateUploadSchema,
  CompleteUploadSchema,
  ListFilesQuerySchema,
  CreateFolderSchema,
  RenameSchema,
  MoveSchema,
  SearchQuerySchema,
} from './file.schema.js';

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

const parseId = (rawId) => {
  const id = parseInt(rawId, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const initiateUpload = async (req, res) => {
  const { ok, data, response } = validate(InitiateUploadSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.initiateUpload(data, req.user.id),
  );

  if (result) res.status(201).json(result);
};

export const completeUpload = async (req, res) => {
  const { ok, data, response } = validate(CompleteUploadSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.confirmUpload(data, req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const listFiles = async (req, res) => {
  const { ok, data, response } = validate(ListFilesQuerySchema, req.query);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.listFiles(data, req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const createFolder = async (req, res) => {
  const { ok, data, response } = validate(CreateFolderSchema, req.body);
  if (!ok) return res.status(400).json(response);

  const result = await handleService(res, () =>
    fileService.createFolder(data, req.user.id),
  );

  if (result) res.status(201).json(result);
};

export const renameItem = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
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

export const moveItem = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
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

export const getProperties = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const result = await handleService(res, () =>
    fileService.getProperties(id, req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const deleteItem = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const result = await handleService(res, () =>
    fileService.deleteItem(id, req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const getTrash = async (req, res) => {
  const result = await handleService(res, () =>
    fileService.getTrash(req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const restoreItem = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const result = await handleService(res, () =>
    fileService.restoreItem(id, req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const permanentlyDeleteItem = async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'ID must be a positive integer.' },
    });
  }

  const result = await handleService(res, () =>
    fileService.permanentlyDeleteItem(id, req.user.id),
  );

  if (result) res.status(200).json(result);
};

export const searchFiles = async (req, res) => {
  const parsed = validate(SearchQuerySchema, req.query);
  if (!parsed.ok) return res.status(400).json(parsed.response);

  const result = await handleService(res, () =>
    fileService.searchFiles(parsed.data.q, parsed.data.parentId, req.user.id)
  );

  if (result) res.status(200).json(result);
};

export const getRecentFiles = async (req, res) => {
  const result = await handleService(res, () =>
    fileService.getRecentFiles(req.user.id),
  );

  if (result) res.status(200).json(result);
};

