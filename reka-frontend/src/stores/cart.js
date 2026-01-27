import { reactive } from 'vue';
import authStore from './auth.js';

// Cart store using reactive state
const cartStore = reactive({
  companyId: null, // ID of the company we're buying from
  companyName: null, // Name of the company for display
  items: [], // Array of cart items
  initialized: false
});

// Load cart from localStorage for the current user
const loadCart = () => {
  if (!authStore.isAuthenticated || !authStore.ceg || !authStore.ceg.id) {
    cartStore.companyId = null;
    cartStore.companyName = null;
    cartStore.items = [];
    cartStore.initialized = true;
    return;
  }

  try {
    const cartKey = `reka_cart_${authStore.ceg.id}`;
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      cartStore.companyId = cart.companyId || null;
      cartStore.companyName = cart.companyName || null;
      cartStore.items = cart.items || [];
    } else {
      cartStore.companyId = null;
      cartStore.companyName = null;
      cartStore.items = [];
    }
  } catch (error) {
    console.error('Error loading cart:', error);
    cartStore.companyId = null;
    cartStore.companyName = null;
    cartStore.items = [];
  }
  
  cartStore.initialized = true;
};

// Save cart to localStorage
const saveCart = () => {
  if (!authStore.isAuthenticated || !authStore.ceg || !authStore.ceg.id) {
    return;
  }

  try {
    const cartKey = `reka_cart_${authStore.ceg.id}`;
    const cart = {
      companyId: cartStore.companyId,
      companyName: cartStore.companyName,
      items: cartStore.items
    };
    localStorage.setItem(cartKey, JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart:', error);
  }
};

// Clear the cart
export const clearCart = () => {
  cartStore.companyId = null;
  cartStore.companyName = null;
  cartStore.items = [];
  saveCart();
};

// Add item to cart
export const addToCart = (item, quantity, companyId, companyName) => {
  if (!authStore.isAuthenticated || !authStore.ceg || !authStore.ceg.id) {
    console.error('User must be logged in to add items to cart');
    return { success: false, message: 'Jelentkezz be a kosár használatához!' };
  }

  // Check if this is from a different company
  if (cartStore.companyId && cartStore.companyId !== companyId) {
    return { 
      success: false, 
      requiresConfirmation: true,
      message: `A kosárban jelenleg ${cartStore.companyName} termékei vannak. Ha folytatod, a kosár tartalma törlődik.`,
      companyName: cartStore.companyName
    };
  }

  // Set company if this is the first item
  if (!cartStore.companyId) {
    cartStore.companyId = companyId;
    cartStore.companyName = companyName;
  }

  // Check if item already exists in cart
  const existingItemIndex = cartStore.items.findIndex(i => i.id === item.id);
  
  if (existingItemIndex !== -1) {
    // Update quantity
    cartStore.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cartStore.items.push({
      id: item.id,
      nev: item.nev,
      ar: item.ar,
      afa_kulcs: item.afa_kulcs,
      kiszereles: item.kiszereles,
      cikkszam: item.cikkszam,
      min_vas_menny: item.min_vas_menny,
      quantity: quantity
    });
  }

  saveCart();
  return { success: true, message: 'Termék hozzáadva a kosárhoz!' };
};

// Add item to cart after confirmation (clears existing cart)
export const addToCartWithClear = (item, quantity, companyId, companyName) => {
  clearCart();
  return addToCart(item, quantity, companyId, companyName);
};

// Remove item from cart
export const removeFromCart = (itemId) => {
  const index = cartStore.items.findIndex(i => i.id === itemId);
  if (index !== -1) {
    cartStore.items.splice(index, 1);
  }

  // Clear company info if cart is empty
  if (cartStore.items.length === 0) {
    cartStore.companyId = null;
    cartStore.companyName = null;
  }

  saveCart();
};

// Update item quantity
export const updateQuantity = (itemId, quantity) => {
  const item = cartStore.items.find(i => i.id === itemId);
  if (item) {
    const minQuantity = item.min_vas_menny || 1;
    item.quantity = Math.max(quantity, minQuantity);
    saveCart();
  }
};

// Get total item count
export const getItemCount = () => {
  return cartStore.items.reduce((total, item) => total + item.quantity, 0);
};

// Get total price (nettó)
export const getTotalPrice = () => {
  return cartStore.items.reduce((total, item) => {
    return total + (item.ar * item.quantity);
  }, 0);
};

// Get total price (bruttó)
export const getTotalPriceWithVAT = () => {
  return cartStore.items.reduce((total, item) => {
    const priceWithVAT = item.ar * (1 + item.afa_kulcs / 100);
    return total + (priceWithVAT * item.quantity);
  }, 0);
};

// Initialize cart when the module is loaded
loadCart();

// Watch for authentication changes
import { watch } from 'vue';
watch(() => authStore.isAuthenticated, (newValue) => {
  if (!newValue) {
    // User logged out, clear cart
    cartStore.companyId = null;
    cartStore.companyName = null;
    cartStore.items = [];
    cartStore.initialized = false;
  } else {
    // User logged in, load their cart
    loadCart();
  }
});

export default cartStore;
