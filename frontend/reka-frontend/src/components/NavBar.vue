<script setup>
import { ref } from 'vue';

const sidebarOpen = ref(false);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};
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
      <div class="d-flex align-items-center">
        <img src="/src/pfp.png" alt="Profile" class="profile-img rounded-circle d-lg-none" />

        <div class="d-none d-lg-flex align-items-center">
          <img src="/src/pfp.png" alt="Profile" class="profile-img rounded-circle me-2" />
          <span>Tóth Réka</span>
        </div>
      </div>

    </div>
  </nav>

  <!-- Sidebar -->
  <div class="sidebar bg-light" :class="{ show: sidebarOpen }">
    <router-link to="/kezdolap" @click="closeSidebar" class="sidebar-item">Kezdőlap</router-link>
    <router-link to="/" @click="closeSidebar" class="sidebar-item">Áruház</router-link>
    <router-link to="/raktar" @click="closeSidebar" class="sidebar-item">Raktárkezelés</router-link>
    <router-link to="/" @click="closeSidebar" class="sidebar-item">Cégem</router-link>
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
  height: 100vh;
  width: 250px;
  position: fixed;
  top: 56px;
  left: 0;
  background-color: #f8f9fa;
  padding-top: 0.6rem;
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
  border-radius: 30px;
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
  top: 56px;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 1030;
}

.overlay.show {
  display: block;
}
</style>
