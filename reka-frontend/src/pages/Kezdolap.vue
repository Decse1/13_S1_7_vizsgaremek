<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';

const route = useRoute();
const showError = ref(false);
const errorMessage = ref('');

onMounted(() => {
  // Check for various error types
  if (route.query.error === 'page-not-found') {
    errorMessage.value = 'Az oldal nem található! Átirányítottunk a kezdőlapra.';
    showError.value = true;
  } else if (route.query.error === 'admin-only') {
    errorMessage.value = 'Ez az oldal csak adminisztrátorok számára érhető el!';
    showError.value = true;
  } else if (route.query.error === 'insufficient-permissions') {
    errorMessage.value = 'Nincs megfelelő jogosultságod az oldal megtekintéséhez!';
    showError.value = true;
  }
  
  // Auto-hide error after 5 seconds if shown
  if (showError.value) {
    setTimeout(() => {
      showError.value = false;
    }, 5000);
  }
});

const closeError = () => {
  showError.value = false;
};
</script>

<template>
  <div class="content">
    <!-- Error Alert -->
    <div
      v-if="showError"
      class="alert alert-danger alert-dismissible fade show d-flex justify-content-between align-items-center mb-4"
      role="alert"
      data-test="error-alert"
    >
      <div>
        <strong>Hiba!</strong> <span data-test="error-message">{{ errorMessage }}</span>
      </div>
      <button type="button" class="btn-close" aria-label="Bezárás" @click="closeError"></button>
    </div>

    <h2>Kezdőlap</h2>
    <p>Üdv a kezdőlapon!</p>
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
