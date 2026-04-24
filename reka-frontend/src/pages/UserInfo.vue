<script setup>
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">Felhasználói adatok</h2>
      </div>
    </div>
    <p>Felhasználónév: {{ authStore.user.nev }}</p>
    <p>Telefonszám: {{ authStore.user.telefon }}</p>
    <div class="mb-3">
      <strong>Jogosultságok:</strong>
      <ul class="mt-2">
        <li v-if="isAdmin()" class="text-primary">
          Teljeskörű hozzáférés
        </li>
        <li v-if="authStore.user.jogkor?.rendeles_osszkesz">
          Rendelés összekészítése
        </li>
        <li v-if="authStore.user.jogkor?.rendeles_lead">
          Rendelés leadása
        </li>
        <li v-if="authStore.user.jogkor?.szamla_keszit">
          Számla készítése
        </li>
        <li v-if="authStore.user.jogkor?.raktar_kezel">
          Raktár kezelése
        </li>
      </ul>
    </div>
    <p>Telephely címe: {{ authStore.user.telephely_cim }}</p>
    <p>Cég neve: {{ authStore.ceg.nev }}</p>
    <p>Adószám: {{ authStore.ceg.adoszam }}</p>
    
  </div>
</template>

<style scoped>

</style>
