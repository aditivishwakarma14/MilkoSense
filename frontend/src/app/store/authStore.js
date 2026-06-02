import { create } from 'zustand';
import authService from '../../services/authService';

/**
 * Auth Store — Global auth state using Zustand.
 * Reads from localStorage on init, provides reactive user/auth state.
 */
const useAuthStore = create((set, get) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),

  // Call after successful login/register OTP verification
  setUser(user) {
    set({ user, isAuthenticated: true });
  },

  // Refresh from localStorage (useful on mount)
  hydrate() {
    set({
      user: authService.getCurrentUser(),
      isAuthenticated: authService.isAuthenticated(),
    });
  },

  // Logout
  logout() {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
