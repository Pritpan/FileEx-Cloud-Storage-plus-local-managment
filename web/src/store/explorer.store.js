import { create } from 'zustand';

/**
 * explorer.store — File Explorer UI state
 *
 * Holds ephemeral explorer UI state that needs to survive across
 * navigation within the explorer (e.g. sort settings, view mode).
 *
 * Do NOT store file listing data here — use React Query for server state.
 */
const useExplorerStore = create((set) => ({
  viewMode:     'grid',   // 'grid' | 'list'
  sortBy:       'name',   // 'name' | 'createdAt' | 'size'
  sortDir:      'asc',    // 'asc' | 'desc'
  selectedIds:  [],       // array of selected file/folder IDs

  setViewMode:     (mode) => set({ viewMode: mode }),
  setSortBy:       (key)  => set({ sortBy: key }),
  setSortDir:      (dir)  => set({ sortDir: dir }),
  setSelectedIds:  (ids)  => set({ selectedIds: ids }),
  clearSelection:  ()     => set({ selectedIds: [] }),
}));

export default useExplorerStore;
