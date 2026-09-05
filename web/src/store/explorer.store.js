import { create } from 'zustand';

const useExplorerStore = create((set) => ({
  viewMode: 'grid',
  sortBy: 'name',
  sortDir: 'asc',
  selectedIds: [],
  lastCloudPath: '/explorer',
  lastLocalPath: '/local',
  localFsPath: null,
  localBreadcrumbs: [{ label: 'This PC', path: null }],

  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (key) => set({ sortBy: key }),
  setSortDir: (dir) => set({ sortDir: dir }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
  setLastCloudPath: (path) => set({ lastCloudPath: path }),
  setLastLocalPath: (path) => set({ lastLocalPath: path }),
  setLocalFsPath: (path) => set({ localFsPath: path }),
  setLocalBreadcrumbs: (crumbs) => set({ localBreadcrumbs: crumbs }),
}));

export default useExplorerStore;
