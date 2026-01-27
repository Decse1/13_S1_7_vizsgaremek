import { reactive } from 'vue';

// Event emitter for token updates
const tokenUpdateCallbacks = [];

export const onTokenUpdate = (callback) => {
  tokenUpdateCallbacks.push(callback);
  // Return unsubscribe function
  return () => {
    const index = tokenUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      tokenUpdateCallbacks.splice(index, 1);
    }
  };
};

const emitTokenUpdate = () => {
  tokenUpdateCallbacks.forEach(callback => callback());
};

// Authentication store using reactive state
const authStore = reactive({
  isAuthenticated: false,
  user: null,
  ceg: null,
  token: null,
  tokenExpiry: null,
});

// Auto logout timer
let autoLogoutTimer = null;

// Setup auto logout (30 seconds for testing, change to 600000 for 10 minutes in production)
const setupAutoLogout = () => {
  // Clear existing timer
  if (autoLogoutTimer) {
    clearTimeout(autoLogoutTimer);
  }

  // Set timer for 10 minutes (600000ms)
  const TIMEOUT_DURATION = 600000;
  
  autoLogoutTimer = setTimeout(() => {
    console.log('Session expired - logging out');
    clearAuthState();
    // Redirect to login page if router is available
    if (typeof window !== 'undefined' && window.location.pathname !== '/bejelentkezes') {
      window.location.href = '/bejelentkezes';
    }
  }, TIMEOUT_DURATION);
  
  // Store expiry time
  authStore.tokenExpiry = Date.now() + TIMEOUT_DURATION;
};

// Clear auto logout timer
const clearAutoLogout = () => {
  if (autoLogoutTimer) {
    clearTimeout(autoLogoutTimer);
    autoLogoutTimer = null;
  }
  authStore.tokenExpiry = null;
};

// Load from localStorage on initialization
const loadAuthState = () => {
  try {
    const savedUser = localStorage.getItem('reka_user');
    const savedCeg = localStorage.getItem('reka_ceg');
    const savedToken = localStorage.getItem('reka_token');
    const savedExpiry = localStorage.getItem('reka_token_expiry');
    
    if (savedUser && savedToken) {
      // Check if token has expired
      if (savedExpiry && Date.now() > parseInt(savedExpiry)) {
        console.log('Stored token has expired');
        clearAuthState();
        return;
      }
      
      authStore.user = JSON.parse(savedUser);
      authStore.ceg = savedCeg ? JSON.parse(savedCeg) : null;
      authStore.token = savedToken;
      authStore.isAuthenticated = true;
      
      // Calculate remaining time and setup auto logout
      if (savedExpiry) {
        const remainingTime = parseInt(savedExpiry) - Date.now();
        if (remainingTime > 0) {
          autoLogoutTimer = setTimeout(() => {
            console.log('Session expired - logging out');
            clearAuthState();
            if (typeof window !== 'undefined' && window.location.pathname !== '/bejelentkezes') {
              window.location.href = '/bejelentkezes';
            }
          }, remainingTime);
          authStore.tokenExpiry = parseInt(savedExpiry);
        } else {
          clearAuthState();
        }
      } else {
        // If no expiry stored, setup new auto logout
        setupAutoLogout();
      }
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
    clearAuthState();
  }
};

// Save authentication state with JWT token
export const setAuthState = (user, ceg, token) => {
  authStore.isAuthenticated = true;
  authStore.user = user;
  authStore.ceg = ceg;
  
  // Only update token if provided, otherwise keep existing
  if (token !== undefined) {
    authStore.token = token;
    localStorage.setItem('reka_token', token);
    emitTokenUpdate();
  }
  
  localStorage.setItem('reka_user', JSON.stringify(user));
  localStorage.setItem('reka_ceg', JSON.stringify(ceg));
  
  // Setup auto logout timer and save expiry
  setupAutoLogout();
  localStorage.setItem('reka_token_expiry', authStore.tokenExpiry.toString());
};

// Update token (for token refresh)
export const updateToken = (newToken) => {
  authStore.token = newToken;
  localStorage.setItem('reka_token', newToken);
  emitTokenUpdate();
  
  // Reset auto logout timer when token is refreshed
  setupAutoLogout();
  localStorage.setItem('reka_token_expiry', authStore.tokenExpiry.toString());
};

// Get current token
export const getToken = () => {
  return authStore.token || localStorage.getItem('reka_token');
};

// Reset activity timer (call this on user activity)
export const resetActivityTimer = () => {
  if (authStore.isAuthenticated) {
    setupAutoLogout();
    if (authStore.tokenExpiry) {
      localStorage.setItem('reka_token_expiry', authStore.tokenExpiry.toString());
    }
  }
};

// Clear authentication state
export const clearAuthState = () => {
  authStore.isAuthenticated = false;
  authStore.user = null;
  authStore.ceg = null;
  authStore.token = null;
  
  localStorage.removeItem('reka_user');
  localStorage.removeItem('reka_ceg');
  localStorage.removeItem('reka_token');
  localStorage.removeItem('reka_token_expiry');
  
  // Clear auto logout timer
  clearAutoLogout();
};

// Initialize auth state
loadAuthState();

export default authStore;
