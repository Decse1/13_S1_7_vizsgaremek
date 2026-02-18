<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
</script>

<template>
  <div class="content">
    <h2>Cím</h2>
    <p>Szöveg</p>
    <br>
    <p>Ár: 10000 Ft</p>
    <p v-if="authStore.ceg">
      {{ authStore.ceg.nev }}, ID: {{ authStore.ceg.id }}
    </p>
    <p v-else>Nincs bejelentkezve</p>
  </div>
</template>

<style scoped>
  /* Desktop margin */
  @media (min-width: 992px) {
    .content {
      margin-left: 250px;
      padding: 2rem;
      margin-top: 56px;
    }
  }

  /* Mobile margin */
  @media (max-width: 991.98px) {
    .content {
      margin-left: 0;
      padding: 2rem;
      margin-top: 56px;
    }
  }

  body {
    background-color: lightgray(--bs-body-bg);;
  }
</style>
