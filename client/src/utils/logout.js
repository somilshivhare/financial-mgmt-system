
export const clearAllLocalStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch (error) {
    console.error('[Logout] Error clearing storage:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberEmail');
    sessionStorage.clear();
  }
};

export const performLogout = () => {
  clearAllLocalStorage();
  
  window.location.href = '/login';
};
