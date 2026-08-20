import { create } from 'zustand';

const useExplorerStore = create((set) => ({
  viewMode: 'grid',
  sortBy: 'name',
  sortDir: 'asc',
  selectedIds: [],

  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (key) => set({ sortBy: key }),
  setSortDir: (dir) => set({ sortDir: dir }),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),
}));

export default useExplorerStore;
