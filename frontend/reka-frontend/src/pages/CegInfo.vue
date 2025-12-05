<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';

const route = useRoute();
const showError = ref(false);
const errorMessage = ref('');

const closeError = () => {
  showError.value = false;
};
</script>

<template>
  <div class="content">
    <h2>Cégadatok</h2>
    <p>Cég neve: {{ authStore.ceg.nev }}</p>
    <p>Cég azonosítója: {{ authStore.ceg.id }}</p>
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
