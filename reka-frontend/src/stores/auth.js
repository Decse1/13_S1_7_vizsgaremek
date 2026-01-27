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
});

// Load from localStorage on initialization
const loadAuthState = () => {
  try {
    const savedUser = localStorage.getItem('reka_user');
    const savedCeg = localStorage.getItem('reka_ceg');
    const savedToken = localStorage.getItem('reka_token');
    
    if (savedUser && savedToken) {
      authStore.user = JSON.parse(savedUser);
      authStore.ceg = savedCeg ? JSON.parse(savedCeg) : null;
      authStore.token = savedToken;
      authStore.isAuthenticated = true;
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
};

// Update token (for token refresh)
export const updateToken = (newToken) => {
  authStore.token = newToken;
  localStorage.setItem('reka_token', newToken);
  emitTokenUpdate();
};

// Get current token
export const getToken = () => {
  return authStore.token || localStorage.getItem('reka_token');
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
};

// Initialize auth state
loadAuthState();

export default authStore;
