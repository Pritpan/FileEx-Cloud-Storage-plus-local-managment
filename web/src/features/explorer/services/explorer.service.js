import api from '@/lib/axios';
import { FILES } from '@/constants/api';

/**
 * explorerService.js
 *
 * Pure communication layer for the Files API.
 * No React, no Query — just Axios calls that return data.
 * Called exclusively from TanStack Query hooks.
 */
export const explorerService = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /**
   * Fetches the immediate children of a folder, or root items.
   * @param {number|null} folderId  - null for the virtual root, folder ID otherwise.
   * @returns {Promise<Array>}      - Resolved array of file/folder items.
   */
  getFiles: async (folderId) => {
    // Backend schema (ListFilesQuerySchema):
    //   absent / "null"  → root  (no parentId needed)
    //   "123"            → folder 123
    // Axios drops null params by default, so for root we simply omit the param.
    const params = folderId !== null && folderId !== undefined
      ? { parentId: folderId }
      : {};

    const { data } = await api.get(FILES.LIST, { params });
    // Response: { success: true, data: { parentId, items: [...] } }
    return data.data.items;
  },

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Creates a new folder.
   * @param {{ displayName: string, parentId: number|null }} payload
   * @returns {Promise<object>} The created folder item.
   */
  createFolder: async ({ displayName, parentId }) => {
    const { data } = await api.post(FILES.FOLDERS, { displayName, parentId });
    return data.data;
  },

  /**
   * Renames a file or folder.
   * @param {{ id: number, displayName: string }} payload
   * @returns {Promise<object>} The updated item.
   */
  renameFile: async ({ id, displayName }) => {
    const { data } = await api.patch(FILES.RENAME(id), { displayName });
    return data.data;
  },

  /**
   * Moves a file or folder to a different parent.
   * @param {{ id: number, parentId: number|null }} payload
   * @returns {Promise<object>} The updated item.
   */
  moveFile: async ({ id, parentId }) => {
    const { data } = await api.patch(FILES.MOVE(id), { parentId });
    return data.data;
  },

  /**
   * Soft-deletes a file or folder (moves to Trash).
   * @param {{ id: number }} payload
   * @returns {Promise<object>}
   */
  deleteFile: async ({ id }) => {
    const { data } = await api.delete(FILES.DELETE(id));
    return data;
  },
};
