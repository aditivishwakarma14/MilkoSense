import apiClient from './apiClient';
import storageService from './storageService';

/**
 * MilkoSense Auth Service
 * Handles registration, login, and OTP verification via backend API.
 */
const authService = {

  // ─── Registration Step 1: Send OTP ───────────────────────────────────────
  async register({ name, email, password }) {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      return response;
    } catch (error) {
      console.error('[Auth Service] Register failed:', error);
      throw error;
    }
  },

  // ─── Registration Step 2: Verify OTP ─────────────────────────────────────
  async verifyRegisterOtp({ email, otp }) {
    try {
      const response = await apiClient.post('/auth/verify-register-otp', { email, otp });
      if (response.success && response.data) {
        storageService.set('milkosense_user', response.data.user);
        storageService.set('milkosense_auth_token', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('[Auth Service] Verify register OTP failed:', error);
      throw error;
    }
  },

  // ─── Login Step 1: Send OTP ──────────────────────────────────────────────
  async login({ email, password }) {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      return response;
    } catch (error) {
      console.error('[Auth Service] Login failed:', error);
      throw error;
    }
  },

  // ─── Login Step 2: Verify OTP ────────────────────────────────────────────
  async verifyLoginOtp({ email, otp }) {
    try {
      const response = await apiClient.post('/auth/verify-login-otp', { email, otp });
      if (response.success && response.data) {
        storageService.set('milkosense_user', response.data.user);
        storageService.set('milkosense_auth_token', response.data.token);
      }
      return response;
    } catch (error) {
      console.error('[Auth Service] Verify login OTP failed:', error);
      throw error;
    }
  },

  // ─── Logout ──────────────────────────────────────────────────────────────
  logout() {
    storageService.remove('milkosense_user');
    storageService.remove('milkosense_auth_token');
    return true;
  },

  // ─── Current User ────────────────────────────────────────────────────────
  getCurrentUser() {
    return storageService.get('milkosense_user', null);
  },

  isAuthenticated() {
    return !!storageService.get('milkosense_auth_token', null);
  }
};

export default authService;
