import api from '@/lib/axios';
import { FILES } from '@/constants/api';

export const explorerService = {
  getFiles: async (folderId) => {
    const params = folderId !== null && folderId !== undefined
      ? { parentId: folderId }
      : {};

    const { data } = await api.get(FILES.LIST, { params });
    return data.data.items;
  },

  getProperties: async (id) => {
    const { data } = await api.get(FILES.PROPERTIES(id));
    return data.data;
  },

  createFolder: async ({ displayName, parentId }) => {
    const { data } = await api.post(FILES.FOLDERS, { displayName, parentId });
    return data.data;
  },

  renameFile: async ({ id, displayName }) => {
    const { data } = await api.patch(FILES.RENAME(id), { displayName });
    return data.data;
  },

  moveFile: async ({ id, parentId }) => {
    const { data } = await api.patch(FILES.MOVE(id), { parentId });
    return data.data;
  },

  deleteFile: async ({ id }) => {
    const { data } = await api.delete(FILES.DELETE(id));
    return data.data;
  },
};
