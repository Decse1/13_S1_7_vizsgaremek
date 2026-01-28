<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';
</script>

<template>
  <div class="content">
    <h2>Elküldött rendelések</h2>
    <p>Szöveg</p>
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
