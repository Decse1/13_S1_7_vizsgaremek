<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';

const route = useRoute();
const showError = ref(false);
const errorMessage = ref('');

onMounted(() => {
  if (route.query.error === 'page-not-found') {
    errorMessage.value = 'Az oldal nem található! Átirányítottunk a kezdőlapra.';
    showError.value = true;
    
    // Auto-hide error after 5 seconds
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
    >
      <div>
        <strong>Hiba!</strong> {{ errorMessage }}
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
