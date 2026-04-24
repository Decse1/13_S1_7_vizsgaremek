<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';

const router = useRouter();

const rendelesek = ref([]);
const loading = ref(false);
const error = ref(null);

const showDetailsModal = ref(false);
const selectedOrderDetails = ref(null);
const editableProducts = ref([]);

const companyId = computed(() => authStore.ceg?.id);

const allProductsChecked = computed(() => {
  return editableProducts.value.length > 0 && 
         editableProducts.value.every(product => product.checked);
});

const isOrderFulfilled = computed(() => {
  return selectedOrderDetails.value?.status === 'Teljesítve';
});

const groupedOrders = computed(() => {
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
          sztorno: tetel.sztorno,
          termekek: [],
          productSet: new Set()
        });
      }
      
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
  
  return Array.from(orderMap.values()).map(order => {
    const { productSet, ...orderWithoutSet } = order;
    return orderWithoutSet;
  }).sort((a, b) => {
    const dateA = new Date(a.datum || 0).getTime();
    const dateB = new Date(b.datum || 0).getTime();

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return b.rendeles_szam.localeCompare(a.rendeles_szam, undefined, { numeric: true });
  });
});

const formatPrice = (price) => {
  return new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(price));
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU');
};

const getOrderStatus = (order) => {
  if (order.sztorno === 1 || order.sztorno === true) {
    return 'Sztornózva';
  }
  return order.status;
};

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

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('hu-HU', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const openDetailsModal = (order) => {
  selectedOrderDetails.value = order;
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

const fulfillOrder = async () => {
  if (!hasPermission('rendeles_osszkesz')) {
    alert('Nincsen megfelelő jogosultsága ehhez a funkcióhoz.');
    return;
  }

  if (!allProductsChecked.value) {
    return;
  }

  try {
    loading.value = true;

    const orderData = {
      id: selectedOrderDetails.value.rendeles_id,
      termekek: editableProducts.value.map(product => ({
        mennyiseg: product.editedQuantity,
        termek_id: product.termek_id
      }))
    };

    const response = await axios.post('/Rendeles_statusz_frissit', orderData);

    if (response.data.ok) {
      closeDetailsModal();
      
      await fetchOrders();
      
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

const generateInvoice = async () => {
  if (!hasPermission('szamla_keszit')) {
    alert('Nincsen megfelelő jogosultsága ehhez a funkcióhoz.');
    return;
  }

  if (!isOrderFulfilled.value) {
    error.value = 'A számla csak teljesített rendeléshez generálható';
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await axios.post('/Szamla_create', {
      id: selectedOrderDetails.value.rendeles_id
    }, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Szamla_${selectedOrderDetails.value.rendeles_szam}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert('Számla sikeresen legenerálva és letöltve!');
    
  } catch (err) {
    console.error('Error generating invoice:', err);
    error.value = 'Hiba történt a számla generálása során';
    alert('Hiba történt a számla generálása során. Kérjük, próbálja újra.');
  } finally {
    loading.value = false;
  }
};

const downloadStornoInvoice = async () => {
  if (!hasPermission('szamla_keszit')) {
    alert('Nincsen megfelelő jogosultsága ehhez a funkcióhoz.');
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await axios.post('/Szamla_storno', {
      id: selectedOrderDetails.value.rendeles_id
    }, {
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sztorno_Szamla_${selectedOrderDetails.value.rendeles_szam}.pdf`;
    document.body.appendChild(link);
    link.click();
    
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

const deleteOrder = async () => {
  if (!isAdmin()) {
    alert('Nincs jogosultsága a rendelés törléséhez. Minden jogosultság szükséges ehhez a művelethez.');
    return;
  }

  const confirmed = confirm(
    `Biztosan törölni szeretné a(z) ${selectedOrderDetails.value.rendeles_szam} rendelést?`
  );
  
  if (!confirmed) {
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await axios.post('/Rendeles_delete', {
      rendelesId: selectedOrderDetails.value.rendeles_id
    });

    if (response.data.ok) {
      if (response.data.action === 'generate_pdf_required') {
        try {
          const szornoResponse = await axios.post('/Szamla_storno', {
            id: selectedOrderDetails.value.rendeles_id
          }, {
            responseType: 'blob'
          });

          const blob = new Blob([szornoResponse.data], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Sztorno_Szamla_${selectedOrderDetails.value.rendeles_szam}.pdf`;
          document.body.appendChild(link);
          link.click();
          
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          alert('Rendelés sztornózva és sztornó számla legenerálva!');
        } catch (szornoErr) {
          console.error('Error generating storno invoice:', szornoErr);
          alert('Rendelés sztornózva, de hiba történt a sztornó számla generálása során.');
        }
      } else {
        alert(response.data.uzenet || 'Rendelés sikeresen törölve!');
      }

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

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <h2 class="mb-0">Beérkezett rendelések</h2>
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
      Nincsenek beérkezett rendelések.
    </div>

    <div v-else class="table-responsive">
      <table class="table custom-table">
        <thead>
          <tr>
            <th style="width: 15%;">Rendelésszám</th>
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
                <div class="col-md-6">
                  <label class="form-label fw-bold">Rendelés dátuma:</label>
                  <p class="mb-0">{{ formatDateTime(selectedOrderDetails.datum) }}</p>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Rendelés állapota:</label>
                  <p class="mb-0">{{ getOrderStatus(selectedOrderDetails) }}</p>
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
                    <div class="form-check" v-if="hasPermission('rendeles_osszkesz') && !isOrderFulfilled">
                      <input 
                        class="form-check-input" 
                        type="checkbox" 
                        v-model="product.checked"
                        :id="'product-' + idx"
                      />
                    </div>
                    <label :for="(isOrderFulfilled || !hasPermission('rendeles_osszkesz')) ? '' : 'product-' + idx" class="form-check-label flex-grow-1 mb-0" :class="{ 'cursor-default': isOrderFulfilled || !hasPermission('rendeles_osszkesz') }">
                      {{ product.termek_neve }}
                    </label>
                    <div class="d-flex align-items-center gap-2">
                      <input 
                        type="number" 
                        class="form-control form-control-sm quantity-input custom-input" 
                        v-model.number="product.editedQuantity"
                        min="0"
                        style="width: 100px;"
                        :disabled="isOrderFulfilled || !hasPermission('rendeles_osszkesz')"
                        :readonly="isOrderFulfilled || !hasPermission('rendeles_osszkesz')"
                      />
                      <span class="text-muted">db</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer d-flex justify-content-between flex-wrap row-gap-2">
              <div class="d-flex flex-wrap row-gap-2">
                <button 
                  v-if="hasPermission('rendeles_osszkesz') && !isOrderFulfilled && !(selectedOrderDetails.sztorno === 1 || selectedOrderDetails.sztorno === true)"
                  type="button" 
                  class="btn btn-teal text-white rounded-pill"
                  @click="fulfillOrder"
                  :disabled="!allProductsChecked"
                >
                  Rendelés teljesítése
                </button>
                <button 
                  v-if="hasPermission('szamla_keszit') && isOrderFulfilled"
                  type="button" 
                  class="btn btn-teal text-white rounded-pill"
                  @click="generateInvoice"
                >
                  Számla generálása
                </button>
                <button
                  v-if="hasPermission('szamla_keszit') && (selectedOrderDetails.sztorno === 1 || selectedOrderDetails.sztorno === true)"
                  type="button" 
                  class="btn btn-danger text-white rounded-pill"
                  @click="downloadStornoInvoice"
                >
                  Sztornó számla letöltése
                </button>
                <button
                  v-if="isAdmin() && !(selectedOrderDetails.sztorno === 1 || selectedOrderDetails.sztorno === true)"
                  type="button" 
                  class="btn btn-danger text-white rounded-pill"
                  @click="deleteOrder"
                >
                  Törlés
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

  @media (max-width: 650px) {
    .modal-footer {
      justify-content: flex-end !important;
      gap: 0.5rem;
    }

    .modal-footer > div {
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .custom-modal-content .modal-footer .btn + .btn {
      margin-left: 0 !important;
    }
  }

  @media (max-width: 570px) {
    .custom-table thead th:nth-child(3),
    .custom-table thead th:nth-child(4),
    .custom-table tbody td:nth-child(3),
    .custom-table tbody td:nth-child(4) {
      display: none;
    }
  }
</style>
