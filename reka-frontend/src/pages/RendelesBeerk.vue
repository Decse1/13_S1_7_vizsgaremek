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
const editableProducts = ref([]);

// Computed
const companyId = computed(() => authStore.ceg?.id);

// Check if all products are checked
const allProductsChecked = computed(() => {
  return editableProducts.value.length > 0 && 
         editableProducts.value.every(product => product.checked);
});

// Check if current order is fulfilled
const isOrderFulfilled = computed(() => {
  return selectedOrderDetails.value?.status === 'Teljesítve';
});

// Group orders by order number and date
const groupedOrders = computed(() => {
  // Use a single Map to prevent duplicates across all buyers
  const orderMap = new Map();
  
  rendelesek.value.forEach(rendeles => {
    rendeles.tételek.forEach(tetel => {
      const key = tetel.rendeles_id;
      if (!orderMap.has(key)) {
        orderMap.set(key, {
          rendeles_id: tetel.rendeles_id,
          rendeles_szam: tetel.rendeles_szam,
          datum: tetel.datum,
          szallitasi_nev: tetel.szallitasi_nev,
          vevo_neve: rendeles.vevo.vevo_neve,
          vevo_id: rendeles.vevo.vevo_id,
          status: tetel.status,
          termekek: [],
          productSet: new Set() // Track unique products
        });
      }
      
      // Create a unique key for each product to prevent duplicates
      const productKey = `${tetel.termek_neve}-${tetel.rendelt_mennyiseg}`;
      const order = orderMap.get(key);
      
      if (!order.productSet.has(productKey)) {
        order.productSet.add(productKey);
        order.termekek.push({
          termek_neve: tetel.termek_neve,
          rendelt_mennyiseg: tetel.rendelt_mennyiseg,
          termek_id: tetel.termek_id
        });
      }
    });
  });
  
  // Convert Map to array, remove productSet, and sort by rendeles_szam (descending)
  return Array.from(orderMap.values()).map(order => {
    const { productSet, ...orderWithoutSet } = order;
    return orderWithoutSet;
  }).sort((a, b) => {
    // Sort by rendeles_szam in descending order (e.g., AB0000006, AB0000005, AB0000004)
    return b.rendeles_szam.localeCompare(a.rendeles_szam, undefined, { numeric: true });
  });
});

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(price));
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU');
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
    const response = await axios.post('/Beerkezett_rendeles', {
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

// Open order details modal
const openDetailsModal = (order) => {
  selectedOrderDetails.value = order;
  // Initialize editable products with checkboxes and editable quantities
  editableProducts.value = order.termekek.map(termek => ({
    ...termek,
    checked: false,
    editedQuantity: termek.rendelt_mennyiseg
  }));
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedOrderDetails.value = null;
  editableProducts.value = [];
};

// Handle order fulfillment
const fulfillOrder = async () => {
  if (!allProductsChecked.value) {
    return;
  }

  try {
    loading.value = true;

    // Prepare the data for the API call
    const orderData = {
      id: selectedOrderDetails.value.rendeles_id,
      termekek: editableProducts.value.map(product => ({
        mennyiseg: product.editedQuantity,
        termek_id: product.termek_id
      }))
    };

    const response = await axios.post('/Rendeles_statusz_frissit', orderData);

    if (response.data.ok) {
      // Close modal
      closeDetailsModal();
      
      // Refresh orders list
      await fetchOrders();
      
      // Show success message (you can add a toast/notification here)
      alert('Rendelés sikeresen teljesítve!');
    } else {
      error.value = response.data.uzenet || 'Hiba történt a rendelés teljesítése során';
    }
  } catch (err) {
    console.error('Error fulfilling order:', err);
    error.value = 'Hiba történt a rendelés teljesítése során';
  } finally {
    loading.value = false;
  }
};

// Handle invoice generation
const generateInvoice = async () => {
  // Verify order is actually fulfilled
  if (!isOrderFulfilled.value) {
    error.value = 'A számla csak teljesített rendeléshez generálható';
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // Call the invoice generation API
    const response = await axios.post('/Szamla_create', {
      id: selectedOrderDetails.value.rendeles_id
    }, {
      responseType: 'blob' // Important for handling PDF response
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

    // Show success message
    alert('Számla sikeresen legenerálva és letöltve!');
    
  } catch (err) {
    console.error('Error generating invoice:', err);
    error.value = 'Hiba történt a számla generálása során';
    alert('Hiba történt a számla generálása során. Kérjük, próbálja újra.');
  } finally {
    loading.value = false;
  }
};

// Handle order deletion
const deleteOrder = async () => {
  // Show confirmation dialog
  const confirmed = confirm(
    `Biztosan törölni szeretné a(z) ${selectedOrderDetails.value.rendeles_szam} rendelést?`
  );
  
  if (!confirmed) {
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    // Call the deletion API
    const response = await axios.post('/Rendeles_delete', {
      rendelesId: selectedOrderDetails.value.rendeles_id
    });

    if (response.data.ok) {
      // Check if we need to generate a storno invoice
      if (response.data.action === 'generate_pdf_required') {
        // Generate storno invoice
        try {
          const szornoResponse = await axios.post('/Szamla_storno', {
            id: selectedOrderDetails.value.rendeles_id
          }, {
            responseType: 'blob'
          });

          // Download the storno invoice
          const blob = new Blob([szornoResponse.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Sztorno_Szamla_${selectedOrderDetails.value.rendeles_szam}.pdf`;
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          alert('Rendelés sztornózva és sztornó számla legenerálva!');
        } catch (szornoErr) {
          console.error('Error generating storno invoice:', szornoErr);
          alert('Rendelés sztornózva, de hiba történt a sztornó számla generálása során.');
        }
      } else {
        // Physical deletion - no invoice needed
        alert(response.data.uzenet || 'Rendelés sikeresen törölve!');
      }

      // Close modal and refresh orders list
      closeDetailsModal();
      await fetchOrders();
      
    } else {
      error.value = response.data.uzenet || 'Hiba történt a rendelés törlése során';
      alert(error.value);
    }
  } catch (err) {
    console.error('Error deleting order:', err);
    error.value = 'Hiba történt a rendelés törlése során';
    alert('Hiba történt a rendelés törlése során. Kérjük, próbálja újra.');
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
      <h2 class="mb-0">Beérkezett rendelések</h2>
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

    <div v-else-if="groupedOrders.length === 0" class="alert alert-warning">
      Nincsenek beérkezett rendelések.
    </div>

    <div v-else class="table-responsive">
      <table class="table custom-table">
        <thead>
          <tr>
            <th style="width: 15%;">Rendelési azon.</th>
            <th style="width: 25%;">Megrendelő</th>
            <th style="width: 20%;">Rendelési dátum</th>
            <th style="width: 15%;">Rendelés állapota</th>
            <th style="width: 15%;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in groupedOrders" :key="order.rendeles_id">
            <td>{{ order.rendeles_szam }}</td>
            <td>{{ order.vevo_neve }}</td>
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
              <h5 class="modal-title">{{ selectedOrderDetails.rendeles_szam }} rendelés</h5>
              <button type="button" class="btn-close" @click="closeDetailsModal"></button>
            </div>
            <div class="modal-body" v-if="selectedOrderDetails">
              <div class="row mb-3">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Cég:</label>
                  <p class="mb-0">{{ selectedOrderDetails.vevo_neve }}</p>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Megrendelő:</label>
                  <p class="mb-0">{{ selectedOrderDetails.szallitasi_nev }}</p>
                </div>
              </div>
              <div class="row mb-3">
                <div class="col-md-12">
                  <label class="form-label fw-bold">Rendelés dátuma:</label>
                  <p class="mb-0">{{ formatDateTime(selectedOrderDetails.datum) }}</p>
                </div>
              </div>
              
              <h6 class="fw-bold mb-3">Rendelt tétel(ek):</h6>
              
              <div class="products-list">
                <div 
                  v-for="(product, idx) in editableProducts" 
                  :key="idx"
                  class="product-item mb-3 p-3 border rounded"
                >
                  <div class="d-flex align-items-center gap-3">
                    <div class="form-check" v-if="!isOrderFulfilled">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        v-model="product.checked"
                        :id="'product-' + idx"
                      />
                    </div>
                    <label :for="isOrderFulfilled ? '' : 'product-' + idx" class="form-check-label flex-grow-1 mb-0" :class="{ 'cursor-default': isOrderFulfilled }">
                      {{ product.termek_neve }}
                    </label>
                    <div class="d-flex align-items-center gap-2">
                      <input 
                        type="number" 
                        class="form-control form-control-sm quantity-input" 
                        v-model.number="product.editedQuantity"
                        min="0"
                        style="width: 100px;"
                        :disabled="isOrderFulfilled"
                        :readonly="isOrderFulfilled"
                      />
                      <span class="text-muted">db<!-- {{ product.editedQuantity > 1 ? 'db' : 'kg' }} --></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer d-flex justify-content-between">
              <div class="d-flex gap-2">
                <button 
                  v-if="!isOrderFulfilled"
                  type="button" 
                  class="btn btn-teal text-white"
                  @click="fulfillOrder"
                  :disabled="!allProductsChecked"
                >
                  Rendelés teljesítése
                </button>
                <button 
                  v-else
                  type="button" 
                  class="btn btn-teal text-white"
                  @click="generateInvoice"
                >
                  Számla generálása
                </button>
                <button 
                  type="button" 
                  class="btn btn-danger text-white"
                  @click="deleteOrder"
                >
                  Törlés
                </button>
              </div>
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

  .form-check-input {
    width: 1.25rem;
    height: 1.25rem;
    cursor: pointer;
  }

  .form-check-label {
    cursor: pointer;
    font-weight: 500;
  }

  .cursor-default {
    cursor: default !important;
  }

  .quantity-input {
    border: 1px solid #ced4da;
  }

  .quantity-input:focus {
    border-color: #00948B;
    box-shadow: 0 0 0 0.2rem rgba(0, 148, 139, 0.25);
  }

  .modal-footer {
    border-top: 1px solid #dee2e6;
  }
</style>
