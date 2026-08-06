import { create } from 'zustand';

/**
 * ui.store — Global UI state
 *
 * Holds transient UI state that must be shared across multiple components
 * (e.g. sidebar collapse, upload drawer visibility).
 *
 * Do not store feature-specific state here — keep it in feature-local state.
 */
const useUIStore = create((set) => ({
  isSidebarOpen:   true,
  isUploadDrawerOpen: false,

  toggleSidebar:       ()      => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setSidebarOpen:      (open)  => set({ isSidebarOpen: open }),
  toggleUploadDrawer:  ()      => set((s) => ({ isUploadDrawerOpen: !s.isUploadDrawerOpen })),
  setUploadDrawerOpen: (open)  => set({ isUploadDrawerOpen: open }),
}));

export default useUIStore;
