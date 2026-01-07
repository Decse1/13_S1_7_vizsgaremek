<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';

const route = useRoute();
const showError = ref(false);
const errorMessage = ref('');

// add computed text for elofiz: explicit checks for 1/'1' -> yes, 0/'0' -> no
const elofizText = computed(() => {
  const v = authStore?.ceg?.elofiz;
  if (v === 1 || v === '1') return 'igen';
  if (v === 0 || v === '0') return 'nem';
  return 'no';
});

const closeError = () => {
  showError.value = false;
};
</script>

<template>
  <div class="content">
    <h2>Cégadatok</h2>
    <p>Cég azonosítója: {{ authStore.ceg.id }}</p>
    <p>Cég neve: {{ authStore.ceg.nev }}</p>
    <p>Adószám: {{ authStore.ceg.adoszam }}</p>
    <p>Adószám (EU): {{ authStore.ceg.euAdoszam || "nincsen megadva"}}</p>
    <p>Székhely: {{ authStore.ceg.cim }}</p>
    <p>Email: {{ authStore.ceg.email }}</p>
    <p>Telefonszám: {{ authStore.ceg.telefon }}</p>
    <h2>Előfizetés állapota</h2>
    <p>Előfizet-e a RÉKA vállalatirányítási rendszerére: {{ elofizText }}</p>
    <!-- && authStore.user.kategoria == 1 -->
    <button v-if="authStore.ceg.elofiz == 0"
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="activateReka"
      >
        <span class="d-none d-sm-none d-md-none d-lg-inline">RÉKA-előfizetés bekapcsolása</span>
    </button>
    <button v-if="authStore.ceg.elofiz == 1"
        class="btn btn-danger add-btn rounded-5 d-flex align-items-center"
        @click="deactivateReka"
      >
        <span class="d-none d-sm-none d-md-none d-lg-inline">RÉKA-előfizetés kikapcsolása</span>
    </button>
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

  .btn-teal {
    background-color: #00948B !important;
    border-color: #00948B !important;
  }

  .btn-teal:hover,
  .btn-teal:focus {
    background-color: #007a72 !important; /* a bit darker on hover */
    border-color: #007a72 !important;
  }
</style>
