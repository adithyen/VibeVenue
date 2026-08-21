// ============================================================
//  VIBEVENUE — UI STORE (Zustand)
//  Manages toast notifications, modals, global UI state & theme
// ============================================================

import { create } from 'zustand';

// Apply theme to <html> element and persist
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vv-theme', theme);
};

const savedTheme = localStorage.getItem('vv-theme') || 'light';
applyTheme(savedTheme);

const useUIStore = create((set, get) => ({
  // ---- Theme ----
  theme: savedTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    set({ theme: next });
  },

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
