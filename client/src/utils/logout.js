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
    localStorage.removeItem('rememberEmail');
    sessionStorage.clear();
  }
};

/** Call API to clear HTTP-only auth cookie, then clear storage and redirect to login */
export const performLogout = async () => {
  const { logout } = await import('../api/auth');
  await logout();
  window.location.href = '/login';
};
