import { reactive } from 'vue';

// Authentication store using reactive state
const authStore = reactive({
  isAuthenticated: false,
  user: null,
  ceg: null,
});

// Load from localStorage on initialization
const loadAuthState = () => {
  try {
    const savedUser = localStorage.getItem('reka_user');
    const savedCeg = localStorage.getItem('reka_ceg');
    
    if (savedUser && savedCeg) {
      authStore.user = JSON.parse(savedUser);
      authStore.ceg = JSON.parse(savedCeg);
      authStore.isAuthenticated = true;
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
    clearAuthState();
  }
};

// Save authentication state
export const setAuthState = (user, ceg) => {
  authStore.isAuthenticated = true;
  authStore.user = user;
  authStore.ceg = ceg;
  
  localStorage.setItem('reka_user', JSON.stringify(user));
  localStorage.setItem('reka_ceg', JSON.stringify(ceg));
};

// Clear authentication state
export const clearAuthState = () => {
  authStore.isAuthenticated = false;
  authStore.user = null;
  authStore.ceg = null;
  
  localStorage.removeItem('reka_user');
  localStorage.removeItem('reka_ceg');
};

// Initialize auth state
loadAuthState();

export default authStore;
