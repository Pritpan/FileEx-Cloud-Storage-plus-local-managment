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
  // Sidebar
  sidebarCollapsed:    false,
  toggleSidebar:       ()      => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  collapseSidebar:     ()      => set({ sidebarCollapsed: true }),
  expandSidebar:       ()      => set({ sidebarCollapsed: false }),

  // Upload drawer
  isUploadDrawerOpen:  false,
  setUploadDrawerOpen: (open)  => set({ isUploadDrawerOpen: open }),
  toggleUploadDrawer:  ()      => set((s) => ({ isUploadDrawerOpen: !s.isUploadDrawerOpen })),
}));

export default useUIStore;
