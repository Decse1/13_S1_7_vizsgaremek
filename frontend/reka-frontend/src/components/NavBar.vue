<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import authStore, { clearAuthState } from '../stores/auth.js';

const router = useRouter();
const sidebarOpen = ref(false);
const dropdownOpen = ref(false);
const dropdownRef = ref(null);

const userName = computed(() => {
  return authStore.user?.nev || 'Felhasználó';
});

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
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top px-2">
    <div class="container-fluid d-flex justify-content-between align-items-center">
      
      <!-- Left: Hamburger + Logo -->
      <div class="d-flex align-items-center">
        <button class="btn d-lg-none me-2" @click="toggleSidebar">
          <span class="navbar-toggler-icon"></span>
        </button>

        <router-link class="navbar-brand d-flex align-items-center m-0" to="/">
          <img src="/src/reka_logo_alt.png" alt="Logo" class="logo-img me-2" />
        </router-link>
      </div>

      <!-- Right: Profile -->
      <div class="d-flex align-items-center position-relative" ref="dropdownRef">
        <img 
          src="/src/pfp.png" 
          alt="Profile" 
          class="profile-img rounded-circle d-lg-none" 
          @click="toggleDropdown"
          style="cursor: pointer;"
        />

        <div class="d-none d-lg-flex align-items-center" @click="toggleDropdown" style="cursor: pointer;">
          <img src="/src/pfp.png" alt="Profile" class="profile-img rounded-circle me-2" />
          <span>{{ userName }}</span>
        </div>

        <!-- Dropdown Menu -->
        <div class="profile-dropdown" :class="{ show: dropdownOpen }">
          <router-link to="/userinfo" class="dropdown-item" @click="closeDropdown">Profiladatok</router-link>
          <a href="#" class="dropdown-item logout" @click.prevent="handleLogout">Kijelentkezés</a>
        </div>
      </div>

    </div>
  </nav>

  <!-- Sidebar -->
  <div class="sidebar bg-light" :class="{ show: sidebarOpen }">
    <router-link to="/kezdolap" @click="closeSidebar" class="sidebar-item">Kezdőlap</router-link>
    <router-link to="/" @click="closeSidebar" class="sidebar-item">Áruház</router-link>
    <router-link to="/raktar" @click="closeSidebar" class="sidebar-item">Raktárkezelés</router-link>
    <router-link to="/partnersegek" @click="closeSidebar" class="sidebar-item">Partnerségek</router-link>
    <router-link to="/ceginfo" @click="closeSidebar" class="sidebar-item">Cégem</router-link>
    <router-link to="/" @click="closeSidebar" class="sidebar-item">Beállítások</router-link>
  </div>

  <!-- Overlay -->
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

/* Sidebar styling */
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

/*
.sidebar a:hover {
  background-color: #e9ecef;
  border-radius: 4px;
}
*/

/* Mobile: collapsed by default */
@media (max-width: 991.98px) {
  .sidebar {
    transform: translateX(-100%);
    z-index: 1040;
  }
  .sidebar.show {
    transform: translateX(0);
  }
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem 1rem;
  color: #333;
  text-decoration: none;
  border-radius: 30px; /* pill shape */
  transition: background-color 0.2s;
}

.sidebar-item:hover {
  background-color: #e9ecef;
}

/* ACTIVE (exact match) */
.router-link-exact-active.sidebar-item {
  background-color: #048c85; /* your teal color */
  color: #fff;
  font-weight: 600;
}

/* Overlay */
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

/* Profile Dropdown */
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
</style>
