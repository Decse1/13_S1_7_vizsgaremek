<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore from '../stores/auth.js';

const router = useRouter();

// State
const rendelesek = ref([]);
const loading = ref(false);
const error = ref(null);

// Modal state
const showDetailsModal = ref(false);
const selectedOrderDetails = ref(null);

// Computed
const companyId = computed(() => authStore.ceg?.id);

// Group orders by order number and date
const groupedOrders = computed(() => {
  const orderMap = new Map();
  
  rendelesek.value.forEach(rendeles => {
    rendeles.termekek.forEach(termek => {
      const key = termek.rendeles_szam;
      
      if (!orderMap.has(key)) {
        orderMap.set(key, {
          rendeles_szam: termek.rendeles_szam,
          elado_neve: rendeles.elado.elado_neve,
          elado_id: rendeles.elado.elado_id,
          datum: termek.datum,
          status: termek.status,
          termekek: []
        });
      }
      
      // Only add the product if it's not already in the array
      const order = orderMap.get(key);
      const productExists = order.termekek.some(p => p.termek_neve === termek.termek_neve);
      if (!productExists) {
        order.termekek.push({
          termek_neve: termek.termek_neve,
          rendelt_mennyiseg: termek.rendelt_mennyiseg
        });
      }
    });
  });
  
  // Convert map to array and sort by date (newest first)
  return Array.from(orderMap.values()).sort((a, b) => new Date(b.datum) - new Date(a.datum));
});

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU');
};

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Fetch orders
const fetchOrders = async () => {
  if (!companyId.value) {
    error.value = 'Nincs bejelentkezett cég';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const response = await axios.post('/Leadott_rendeles', {
      cegId: companyId.value
    });

    if (response.data.ok) {
      rendelesek.value = response.data.rendelesek || [];
    } else {
      error.value = response.data.uzenet || 'Hiba történt a rendelések lekérésekor';
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
    error.value = 'Hiba történt a rendelések lekérésekor';
  } finally {
    loading.value = false;
  }
};

// Open order details modal
const openDetailsModal = (order) => {
  selectedOrderDetails.value = order;
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedOrderDetails.value = null;
};

// On mounted
onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <h2 class="mb-0">Leadott rendelések</h2>
      <button class="btn btn-teal text-white" @click="fetchOrders" :disabled="loading">
        <i class="bi bi-arrow-clockwise me-1"></i>
        Frissítés
      </button>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="groupedOrders.length === 0" class="alert alert-info">
      Még nem adtál le rendelést.
    </div>

    <div v-else class="table-responsive">
      <table class="table custom-table">
        <thead>
          <tr>
            <th style="width: 20%;">Rendelésszám</th>
            <th style="width: 20%;">Eladó</th>
            <th style="width: 20%;">Rendelési dátum</th>
            <th style="width: 15%;">Rendelés állapota</th>
            <th style="width: 15%;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(order, index) in groupedOrders" :key="index">
            <td>{{ order.rendeles_szam }}</td>
            <td>{{ order.elado_neve }}</td>
            <td>{{ formatDateTime(order.datum) }}</td>
            <td>{{ order.status }}</td>
            <td>
              <button 
                class="btn btn-teal text-white btn-sm"
                @click="openDetailsModal(order)"
              >
                Megnyitás
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Details Modal -->
    <transition name="modal-fade">
      <div
        v-if="showDetailsModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeDetailsModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Rendelés részletei</h5>
              <button type="button" class="btn-close" @click="closeDetailsModal"></button>
            </div>
            <div class="modal-body" v-if="selectedOrderDetails">
              <div class="row mb-3">
                <div class="col-md-12">
                  <label class="form-label fw-bold">Rendelésszám:</label>
                  <p class="mb-0">{{ selectedOrderDetails.rendeles_szam }}</p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-12">
                  <label class="form-label fw-bold">Eladó:</label>
                  <p class="mb-0">{{ selectedOrderDetails.elado_neve }}</p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Rendelés dátuma:</label>
                  <p class="mb-0">{{ formatDateTime(selectedOrderDetails.datum) }}</p>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Állapot:</label>
                  <p class="mb-0">{{ selectedOrderDetails.status }}</p>
                </div>
              </div>
              
              <h6 class="fw-bold mb-3">Rendelt tétel(ek):</h6>
              
              <div class="products-list">
                <div 
                  v-for="(product, idx) in selectedOrderDetails.termekek" 
                  :key="idx"
                  class="product-item mb-3 p-3 border rounded"
                >
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="flex-grow-1">
                      <strong>{{ product.termek_neve }}</strong>
                    </div>
                    <div class="text-muted">
                      {{ product.rendelt_mennyiseg }} db
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeDetailsModal">
                Bezárás
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
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
    background-color: var(--bs-body-bg);
  }

  .card {
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .card-header {
    border-bottom: 1px solid #dee2e6;
    padding: 1rem;
  }

  table {
    background-color: white;
    border-collapse: collapse;
  }

  thead th {
    background-color: #d3d3d3;
    font-weight: 600;
    border-bottom: 1px solid #000000;
    padding: 0.75rem;
  }

  tbody tr {
    border-bottom: 1px solid #dee2e6;
  }

  tbody tr:last-child {
    border-bottom: none;
  }

  tbody td {
    padding: 0.75rem;
    vertical-align: middle;
  }

  .custom-table {
    --bs-table-bg: white;
    margin-bottom: 0 !important;
  }

  .btn-teal {
    background-color: #00948B !important;
    border-color: #00948B !important;
  }

  .btn-teal:hover,
  .btn-teal:focus {
    background-color: #007a72 !important;
    border-color: #007a72 !important;
  }

  .btn-teal:disabled {
    background-color: #6c757d !important;
    border-color: #6c757d !important;
  }

  .modal-backdrop-custom {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
  }

  .modal-dialog-custom {
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  .custom-modal-content {
    background-color: #ffffff;
    border-radius: 1rem;
    overflow: hidden;
    width: 100%;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
  }

  .custom-modal-content .modal-header,
  .custom-modal-content .modal-footer {
    padding: 0.75rem 1rem;
    flex-shrink: 0;
  }

  .custom-modal-content .modal-body {
    padding: 0.75rem 1rem;
    overflow-y: auto;
    flex: 1 1 auto;
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 0.15s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
  }

  .modal-fade-enter-to,
  .modal-fade-leave-from {
    opacity: 1;
  }

  .custom-modal-content .btn-close {
    width: 2.5rem;
    height: 2.5rem;
    background-color: #e0e0e0;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .custom-modal-content .btn-close:hover {
    background-color: #d0d0d0;
  }

  .custom-modal-content .btn-close:focus {
    outline: none;
    box-shadow: none;
  }

  .spinner-border {
    width: 3rem;
    height: 3rem;
  }

  .product-item {
    background-color: #f8f9fa;
    transition: background-color 0.2s ease;
  }

  .product-item:hover {
    background-color: #e9ecef;
  }

  .modal-footer {
    border-top: 1px solid #dee2e6;
  }
</style>
