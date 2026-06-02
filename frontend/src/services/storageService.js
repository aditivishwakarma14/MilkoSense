/**
 * MilkoSense Storage Service
 * Refactored to store all browser data (user details, JWT tokens, session data, UI theme) 
 * inside cookies instead of localStorage.
 */
const storageService = {
  /**
   * Retrieves a parsed value from cookies.
   * @param {string} key - Cookie name.
   * @param {any} defaultValue - Return value if key is not found.
   */
  get(key, defaultValue = null) {
    try {
      const nameEQ = encodeURIComponent(key) + "=";
      const ca = document.cookie.split(';');
      let rawValue = null;
      
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
          rawValue = decodeURIComponent(c.substring(nameEQ.length, c.length));
          break;
        }
      }

      if (rawValue === null) {
        return defaultValue;
      }

      try {
        return JSON.parse(rawValue);
      } catch {
        return rawValue; // Return raw value if it is not valid JSON
      }
    } catch (error) {
      console.error(`[Storage Service Error] Failed to read key: ${key} from cookies`, error);
      return defaultValue;
    }
  },

  /**
   * Saves a value into cookies.
   * @param {string} key - Cookie name.
   * @param {any} value - Value to store (will be JSON serialized).
   */
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      // Store cookie globally with 1 year expiration and SameSite=Lax protection
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(serializedValue)}; path=/; max-age=31536000; SameSite=Lax`;
      return true;
    } catch (error) {
      console.error(`[Storage Service Error] Failed to save key: ${key} to cookies`, error);
      return false;
    }
  },

  /**
   * Removes a key from cookies.
   * @param {string} key - Cookie name.
   */
  remove(key) {
    try {
      document.cookie = `${encodeURIComponent(key)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      return true;
    } catch (error) {
      console.error(`[Storage Service Error] Failed to delete key: ${key} from cookies`, error);
      return false;
    }
  },

  /**
   * Clears all cookies associated with this site.
   */
  clear() {
    try {
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        const c = ca[i];
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
        if (name) {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
      }
      return true;
    } catch (error) {
      console.error('[Storage Service Error] Failed to wipe cookies', error);
      return false;
    }
  }
};

export default storageService;

