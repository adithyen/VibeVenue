// ============================================================
//  EVENTFLOW — UI STORE (Zustand)
//  Manages toast notifications, modals, and global UI state
// ============================================================

import { create } from 'zustand';

const useUIStore = create((set, get) => ({
  // ---- Toast Notifications ----
  toasts: [],

  addToast: ({ type = 'info', title, message, duration = 4000 }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast = { id, type, title, message, duration };
    set(state => ({ toasts: [...state.toasts, toast] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
  },

  clearToasts: () => set({ toasts: [] }),

  // ---- Modal System ----
  modal: null, // { type, data }

  openModal: (type, data = {}) => set({ modal: { type, data } }),
  closeModal: () => set({ modal: null }),

  // ---- Sidebar ----
  sidebarCollapsed: false,
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  // ---- Mobile ----
  mobileMenuOpen: false,
  toggleMobileMenu: () => set(state => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
}));

export default useUIStore;
