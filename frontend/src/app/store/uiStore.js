import { create } from 'zustand';
import storageService from '../../services/storageService';

const useUiStore = create((set, get) => ({
  // Defaults to 'light' mode
  theme: storageService.get('milkosense_theme', 'light'),
  sidebarOpen: false,
  toasts: [],

  // Theme action: Swaps light and dark modes
  toggleTheme: () => {
    const nextTheme = get().theme === 'light' ? 'dark' : 'light';
    storageService.set('milkosense_theme', nextTheme);
    
    // Apply styling token globally to HTML root element
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    
    set({ theme: nextTheme });
  },

  // Initialize theme class on startup
  initTheme: () => {
    const currentTheme = get().theme;
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  },

  setSidebar: (open) => {
    set({ sidebarOpen: open });
  },

  // Trigger temporary, elegant alerts on operations success/error
  addToast: (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  }
}));

export default useUiStore;
