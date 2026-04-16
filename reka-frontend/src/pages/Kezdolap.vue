<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

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

    <h1 class="home-title" data-test="homepage-title">Üdvözlünk a RÉKA-rendszerében! <br><br>Válassza ki a keresett menüpontot a menüben vagy az oldalsávról</h1>
  </div>
</template>

<style scoped>
.content {
  min-height: calc(100vh - 80px);
  display: grid;
  place-items: center;
  position: relative;
  padding: 1rem;
}

.alert {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: min(900px, calc(100% - 2rem));
}

.home-title {
  margin: 0;
  text-align: center;
}
</style>
