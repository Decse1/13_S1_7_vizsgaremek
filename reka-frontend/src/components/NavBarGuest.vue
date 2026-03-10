<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import authStore, { clearAuthState, getToken, onTokenUpdate, hasPermission, isAdmin } from '../stores/auth.js';

const router = useRouter();

</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top px-2">
    <div class="container-fluid d-flex justify-content-between align-items-center">      
      <div class="d-flex align-items-center">
        <router-link class="navbar-brand d-flex align-items-center m-0" to="/">
          <img src="/src/reka_logo_alt.png" alt="Logo" class="logo-img me-2" />
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.logo-img {
  height: 40px;
  object-fit: cover;
}
</style>
