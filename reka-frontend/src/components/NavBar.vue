<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import authStore, { clearAuthState, getToken, onTokenUpdate, hasPermission, isAdmin } from '../stores/auth.js';
import cartStore, { getItemCount } from '../stores/cart.js';

const router = useRouter();
const sidebarOpen = ref(false);
const dropdownOpen = ref(false);
const dropdownRef = ref(null);
const tokenExpiry = ref(null);
const countdown = ref('');
let countdownInterval = null;
let unsubscribeTokenUpdate = null;

const userName = computed(() => {
  return authStore.user?.nev || 'Felhasználó';
});

const cartItemCount = computed(() => {
  cartStore.items;
  return getItemCount();
});

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const updateCountdown = () => {
  if (!tokenExpiry.value) {
    countdown.value = '';
    return;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = tokenExpiry.value - now;

  if (timeLeft <= 0) {
    countdown.value = '(0:00)';
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    return;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  countdown.value = `(${minutes}:${seconds.toString().padStart(2, '0')})`;
};

const initTokenExpiry = () => {
  const token = getToken();
  if (token) {
    const decoded = decodeToken(token);
    if (decoded && decoded.exp) {
      tokenExpiry.value = decoded.exp;
      updateCountdown();
      
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
      countdownInterval = setInterval(updateCountdown, 1000);
    }
  }
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

const handleLogout = () => {
  clearAuthState();
  closeDropdown();
  router.push('/bejelentkezes');
};

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  initTokenExpiry();
  
  unsubscribeTokenUpdate = onTokenUpdate(() => {
    initTokenExpiry();
  });
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  // Unsubscribe from token updates
  if (unsubscribeTokenUpdate) {
    unsubscribeTokenUpdate();
  }
});
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top px-2">
    <div class="container-fluid d-flex justify-content-between align-items-center">
      
      <div class="d-flex align-items-center">
        <button class="btn d-lg-none me-2" data-test="sb-menu-open" @click="toggleSidebar">
          <span class="navbar-toggler-icon"></span>
        </button>

        <router-link class="navbar-brand d-flex align-items-center m-0" data-test="logo-home" to="">
          <img src="/src/reka_logo_alt.png" alt="Logo" class="logo-img me-2" />
        </router-link>
      </div>

      <div class="d-flex align-items-center position-relative" ref="dropdownRef" data-test="pf-menu">
        <img 
          src="/src/pfp.png" 
          alt="Profile" 
          class="profile-img rounded-circle d-lg-none"
          data-test="pf-menu-open-pfp" 
          @click="toggleDropdown"
          style="cursor: pointer;"
        />

        <div class="d-none d-lg-flex align-items-center" @click="toggleDropdown" data-test="pf-menu-open-name" style="cursor: pointer;">
          <img src="/src/pfp.png" alt="Profile" class="profile-img rounded-circle me-2" />
          <span>{{ userName }} <span class="token-countdown">{{ countdown }}</span></span>
        </div>

        <div class="profile-dropdown" :class="{ show: dropdownOpen }">
          <div class="d-lg-none dropdown-countdown"><span class="username-text">{{ userName }}</span> {{ countdown }}</div>
          <router-link to="/userinfo" class="dropdown-item" data-test="pf-menu-pfinfo" @click="closeDropdown">Profiladatok</router-link>
          <a href="#" class="dropdown-item logout" data-test="pf-menu-logout" @click.prevent="handleLogout">Kijelentkezés</a>
          <router-link to="/aszf" class="dropdown-item" data-test="pf-menu-terms" @click="closeDropdown">Felhasználási feltételek</router-link>
        </div>
      </div>

    </div>
  </nav>

  <div class="sidebar bg-light" :class="{ show: sidebarOpen } " data-test="sb-menu">
    <!-- router-link to="/kezdolap" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-home">Kezdőlap</router-link -->
    <router-link v-if="hasPermission('rendeles_lead')" to="/store" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-store">Áruház</router-link>
    <router-link v-if="hasPermission('raktar_kezel') || hasPermission('rendeles_osszkesz')" to="/raktar" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-warehouse">Raktárkezelés</router-link>
    <router-link to="/partnersegek" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-partnerships">Partnerségek</router-link>
    <router-link v-if="hasPermission('rendeles_osszkesz') || hasPermission('szamla_keszit')" to="/rendelesek/beerkezett" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-receivedorders">Beérkezett rendelések</router-link>
    <router-link v-if="hasPermission('rendeles_lead')" to="/rendelesek/leadott" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-sentorders">Leadott rendelések</router-link>
    <router-link to="/ceginfo" @click="closeSidebar" class="sidebar-item" data-test="sb-menu-companyinfo">Cégem</router-link>
    <router-link v-if="hasPermission('rendeles_lead')" to="/kosar" @click="closeSidebar" class="sidebar-item cart-link" data-test="sb-menu-cart">
      <span>Kosár</span>
      <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
    </router-link>
  </div>

  <div class="overlay" :class="{ show: sidebarOpen }" @click="closeSidebar"></div>
</template>

<style scoped>
.logo-img {
  height: 40px;
  object-fit: cover;
}

.profile-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
}

.sidebar {
  height: 105vh;
  width: 250px;
  position: fixed;
  top: 56px;
  left: 0;
  background-color: #f8f9fa;
  padding-top: 0.9rem;
  padding-left: 0.3rem;
  padding-right: 0.3rem;
  transition: transform 0.3s ease-in-out;
}

.sidebar a {
  display: block;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
}

@media (max-width: 991.98px) {
  .sidebar {
    transform: translateX(-100%);
    z-index: 1040;
  }
  .sidebar.show {
    transform: translateX(0);
  }
}

.sidebar a.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  border-radius: 30px; /* pill shape */
  transition: background-color 0.2s;
}

.cart-link {
  justify-content: space-between;
}

.cart-badge {
  min-width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #0d9c93;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  padding: 0 8px;
  flex-shrink: 0;
}

.sidebar-item:hover {
  background-color: #e9ecef;
}

.sidebar a.router-link-exact-active.sidebar-item {
  background-color: #048c85; /* your teal color */
  color: #fff;
  font-weight: 600;
}

.sidebar a.router-link-exact-active.sidebar-item .cart-badge {
  background-color: #fff;
  color: #000;
}

.overlay {
  display: none;
  position: fixed;
  top: 66px;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1020;
}

.overlay.show {
  display: block;
}

.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
  z-index: 1050;
}

.profile-dropdown.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.profile-dropdown .dropdown-item {
  display: block;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
}

.profile-dropdown .dropdown-item:first-child {
  border-radius: 8px 8px 0 0;
}

.profile-dropdown .dropdown-item:last-child {
  border-radius: 0 0 8px 8px;
}

.profile-dropdown .dropdown-item:hover {
  background-color: #f8f9fa;
}

.profile-dropdown .dropdown-item.logout {
  color: #dc3545;
  font-weight: 500;
}

.profile-dropdown .dropdown-item.logout:hover {
  background-color: #fff5f5;
}

.token-countdown {
  font-size: 0.85em;
  color: #6c757d;
  font-weight: normal;
}

.dropdown-countdown {
  padding: 0.75rem 1rem;
  font-size: 0.85em;
  color: #6c757d;
  font-weight: normal;
  border-bottom: 1px solid #e9ecef;
  border-radius: 8px 8px 0 0;
  text-align: center;
}

.dropdown-countdown .username-text {
  display: block;
  font-size: 1.25em;
  color: #333;
  font-weight: 500;
}
</style>
