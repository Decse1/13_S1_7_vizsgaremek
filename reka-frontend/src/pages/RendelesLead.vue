<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';

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
          rendeles_id: termek.rendeles_id,
          rendeles_szam: termek.rendeles_szam,
          elado_neve: rendeles.elado.elado_neve,
          elado_id: rendeles.elado.elado_id,
          datum: termek.datum,
          status: termek.status,
          szamla_kesz: termek.szamla_kesz,
          sztorno: termek.sztorno,
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
  
  // Convert map to array and sort by rendeles_szam (descending order)
  return Array.from(orderMap.values()).sort((a, b) => {
    // Sort by rendeles_szam in descending order (e.g., KPK-003, KPK-002, KPK-001)
    return b.rendeles_szam.localeCompare(a.rendeles_szam, undefined, { numeric: true });
  });
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

// Get order status display text
const getOrderStatus = (order) => {
  if (order.sztorno === 1 || order.sztorno === true) {
    return 'Sztornózva';
  }
  return order.status;
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

// Handle invoice download
const downloadInvoice = async () => {
  if (!selectedOrderDetails.value) return;

  try {
    loading.value = true;
    error.value = null;

    // Call the invoice generation/download API
    const response = await axios.post('/Szamla_create', {
      id: selectedOrderDetails.value.rendeles_id
    }, {
      responseType: 'blob'
    });

    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Szamla_${selectedOrderDetails.value.rendeles_szam}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('Számla sikeresen letöltve!');
    
  } catch (err) {
    console.error('Error downloading invoice:', err);
    error.value = 'Hiba történt a számla letöltése során';
    alert('Hiba történt a számla letöltése során. Kérjük, próbálja újra.');
  } finally {
    loading.value = false;
  }
};

// Handle storno invoice download
const downloadStornoInvoice = async () => {
  if (!selectedOrderDetails.value) return;

  try {
    loading.value = true;
    error.value = null;

    // Call the storno invoice API
    const response = await axios.post('/Szamla_storno', {
      id: selectedOrderDetails.value.rendeles_id
    }, {
      responseType: 'blob'
    });

    // Download the storno invoice
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sztorno_Szamla_${selectedOrderDetails.value.rendeles_szam}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('Sztornó számla sikeresen letöltve!');
  } catch (err) {
    console.error('Error downloading storno invoice:', err);
    error.value = 'Hiba történt a sztornó számla letöltése során';
    alert('Hiba történt a sztornó számla letöltése során. Kérjük, próbálja újra.');
  } finally {
    loading.value = false;
  }
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
      <button class="btn btn-teal rounded-pill text-white" @click="fetchOrders" :disabled="loading">
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

    <div v-else-if="groupedOrders.length === 0" class="alert alert-warning">
      Nincsenek leadott rendelések.
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
            <td>{{ getOrderStatus(order) }}</td>
            <td>
              <button 
                class="btn btn-teal text-white btn-sm rounded-pill"
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
                  <p class="mb-0">{{ getOrderStatus(selectedOrderDetails) }}</p>
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
            <div class="modal-footer d-flex justify-content-between">
              <div class="d-flex gap-1">
                <button 
                  v-if="selectedOrderDetails && selectedOrderDetails.szamla_kesz === 1"
                  type="button" 
                  class="btn btn-teal text-white rounded-pill"
                  @click="downloadInvoice"
                >
                  Számla letöltése
                </button>
                <button
                  v-if="selectedOrderDetails && (selectedOrderDetails.sztorno === 1 || selectedOrderDetails.sztorno === true)"
                  type="button" 
                  class="btn btn-danger text-white rounded-pill"
                  @click="downloadStornoInvoice"
                >
                  Sztornó számla letöltése
                </button>
              </div>
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeDetailsModal">
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
  /* Page-specific styles only - common styles moved to global.css */

  .card {
    border: 1px solid #dee2e6;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .card-header {
    border-bottom: 1px solid #dee2e6;
    padding: 1rem;
  }

  tbody tr:last-child {
    border-bottom: none;
  }

  tbody td {
    padding: 0.75rem;
  }

  thead th {
    padding: 0.75rem;
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
