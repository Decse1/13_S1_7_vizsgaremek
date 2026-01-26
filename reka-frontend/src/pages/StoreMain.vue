<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import authStore from '../stores/auth.js';

const router = useRouter();
const partnerek = ref([]);
const loading = ref(false);
const error = ref('');

const fetchBuyerPartnerships = async () => {
  loading.value = true;
  error.value = '';

  const cegId = authStore.ceg?.id;

  if (!cegId) {
    error.value = 'Nincs bejelentkezve vagy hiányzik a cég azonosító';
    loading.value = false;
    return;
  }

  try {
    const response = await axios.post('http://localhost:3000/api/Partnerek_en_vevo', {
      id: cegId
    });

    if (response.data.ok) {
      partnerek.value = response.data.partnerek;
    } else {
      partnerek.value = [];
    }
  } catch (err) {
    console.error('Hiba a vevői partnerségek lekérdezése során:', err);
    error.value = err.response?.data?.uzenet || 'Hiba történt a partnerségek betöltése során';
    partnerek.value = [];
  } finally {
    loading.value = false;
  }
};

const goToStore = (cegId) => {
  router.push(`/store/${cegId}`);
};

onMounted(() => {
  fetchBuyerPartnerships();
});
</script>

<template>
  <div class="content">
    <h2>Áruház</h2>
    <h4>Szerződött partnerek készletei</h4>

    <!-- Loading spinner -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="alert alert-warning" role="alert">
      {{ error }}
    </div>

    <!-- Partnership tiles -->
    <div v-else>
      <div v-if="partnerek.length === 0" class="text-muted">
        Nincsenek megjeleníthető vevői partnerek
      </div>
      <div v-else class="partner-grid">
        <button
          v-for="partner in partnerek"
          :key="partner.id"
          class="partner-tile"
          @click="goToStore(partner.cId)"
        >
          <span class="partner-name">{{ partner.nev }}</span>
        </button>
      </div>
    </div>
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
    background-color: lightgray;
  }

  .partner-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }

  /* Tablet and desktop - more columns */
  @media (min-width: 576px) {
    .partner-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1.25rem;
    }
  }

  @media (min-width: 992px) {
    .partner-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1.5rem;
    }
  }

  .partner-tile {
    background-color: #e0e0e0;
    border: none;
    border-radius: 1rem;
    padding: 2rem 1rem;
    min-height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .partner-tile:hover {
    background-color: #d0d0d0;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .partner-tile:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .partner-name {
    font-weight: 600;
    font-size: 1rem;
    color: #000;
    text-align: center;
    word-wrap: break-word;
    line-height: 1.3;
  }

  @media (min-width: 768px) {
    .partner-tile {
      min-height: 150px;
    }

    .partner-name {
      font-size: 1.1rem;
    }
  }
</style>