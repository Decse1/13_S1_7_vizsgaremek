<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';
</script>

<template>
  <div class="content">
    <h2>Kosár</h2>
    <p>Rendelés leadása ennek a cégnek: Placeholder Kft.</p>

    <!--
    <table class="table custom-table" style="border-bottom: 1px solid black;">
      <thead>
        <tr>
          <th style="width: 45%;">Termék neve</th>
          <th style="width: 33%;">Egységár</th>
          <th class="text-end" style="width: 17%;">Mennyiség</th>
          <th style="width: 2.5%;"></th>
          <th style="width: 2.5%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredSellerItems.length === 0">
          <td colspan="5" class="text-center">A kosár tartalma jelenleg üres!</td>
        </tr>
        <tr v-for="(item, index) in filteredSellerItems" :key="item.id || index">
          <td>{{ item.nev }}</td>
          <td>{{ item.kiszereles }}</td>
          <td class="text-end">{{ item.mennyiseg }} nap</td>
          <td><i class="bi bi-pencil" @click="edit(item)"/></td>
          <td><i class="bi bi-trash" @click="remove(item)"/></td>
        </tr>
      </tbody>
    </table>
    -->
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
