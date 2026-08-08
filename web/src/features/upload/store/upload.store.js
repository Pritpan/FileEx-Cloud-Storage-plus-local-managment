import { create } from 'zustand';

/**
 * upload.store.js
 *
 * Manages client-side upload state. 
 * Does NOT communicate with the backend.
 *
 * Upload Status:
 * - PENDING
 * - INITIATING
 * - UPLOADING
 * - COMPLETING
 * - COMPLETED
 * - FAILED
 */

export const useUploadStore = create((set, get) => ({
  uploads: [],

  addUpload: (upload) =>
    set((state) => ({
      uploads: [...state.uploads, upload],
    })),

  updateProgress: (id, progress) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, progress } : u
      ),
    })),

  updateStatus: (id, status) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, status } : u
      ),
    })),

  setError: (id, error) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, status: 'FAILED', error } : u
      ),
    })),

  removeUpload: (id) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    })),

  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status !== 'COMPLETED'),
    })),
}));
