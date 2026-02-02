/**
 * Comprehensive logout utility that clears all user data and state
 * Prevents data leakage across user sessions
 */

/**
 * Clear all localStorage items related to the current session
 */
export const clearAllLocalStorage = () => {
  try {
    // Get all localStorage keys
    const keys = Object.keys(localStorage);
    
    // Clear all keys (comprehensive cleanup)
    keys.forEach(key => {
      // Keep only non-user-specific keys if needed (e.g., app preferences)
      // For security, we clear everything
      localStorage.removeItem(key);
    });
    
    // Also clear sessionStorage
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[Logout] Error clearing storage:', error);
    // Fallback: clear known keys
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberEmail');
    sessionStorage.clear();
  }
};

/**
 * Perform complete logout and redirect to login
 */
export const performLogout = () => {
  // Clear all storage
  clearAllLocalStorage();
  
  // Redirect to login (hard redirect to clear all state)
  window.location.href = '/login';
};
