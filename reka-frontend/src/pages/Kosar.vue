<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore from '../stores/auth.js';
import cartStore, { removeFromCart, updateQuantity, getTotalPrice, getTotalPriceWithVAT, clearCart } from '../stores/cart.js';

const router = useRouter();

// Modal state
const showEditModal = ref(false);
const editingItem = ref(null);
const editingQuantity = ref(0);

// Product details modal state
const showProductModal = ref(false);
const selectedProduct = ref(null);

// Categories from database
const categories = ref([]);

// Computed properties
const cartItems = computed(() => cartStore.items);
const companyName = computed(() => cartStore.companyName || 'N/A');
const totalPrice = computed(() => getTotalPrice());
const totalPriceWithVAT = computed(() => getTotalPriceWithVAT());

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('hu-HU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(price));
};

// Edit item quantity
const openEditModal = (item) => {
  editingItem.value = item;
  editingQuantity.value = item.quantity;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingItem.value = null;
  editingQuantity.value = 0;
};

const saveQuantity = () => {
  if (editingItem.value) {
    updateQuantity(editingItem.value.id, editingQuantity.value);
  }
  closeEditModal();
};

const decreaseEditQuantity = () => {
  const minQuantity = editingItem.value.min_vas_menny || 1;
  if (editingQuantity.value > minQuantity) {
    editingQuantity.value--;
  }
};

const increaseEditQuantity = () => {
  editingQuantity.value++;
};

// Remove item from cart
const removeItem = (item) => {
  if (confirm(`Biztosan eltávolítod a kosárból: ${item.nev}?`)) {
    removeFromCart(item.id);
  }
};

// Clear entire cart
const handleClearCart = () => {
  if (confirm('Biztosan törölni szeretnéd a kosár teljes tartalmát?')) {
    clearCart();
  }
};

// Place order (placeholder)
const placeOrder = () => {
  if (cartItems.value.length === 0) {
    alert('A kosár üres!');
    return;
  }
  
  // TODO: Implement order placement logic
  alert('Rendelés leadása még nem implementált!');
};

// Fetch categories from backend
const fetchCategories = async () => {
  if (!authStore.ceg || !authStore.ceg.id) {
    return;
  }

  try {
    const response = await axios.post('/Kategoriak_all', {
      id: authStore.ceg.id
    });
    
    if (response.data.ok && response.data.kategoriak) {
      categories.value = response.data.kategoriak;
    } else {
      categories.value = [];
    }
  } catch (err) {
    console.error('Error fetching categories:', err);
    categories.value = [];
  }
};

// Fetch full product details
const fetchProductDetails = async (item) => {
  if (!cartStore.companyId) {
    return null;
  }

  try {
    const response = await axios.post('/Raktar', {
      id: cartStore.companyId
    });

    if (response.data.ok && response.data.termekek) {
      const product = response.data.termekek.find(p => p.id === item.id);
      return product || item;
    }
  } catch (err) {
    console.error('Error fetching product details:', err);
  }
  
  return item;
};

// Open product details modal
const openProductModal = async (item) => {
  const fullProduct = await fetchProductDetails(item);
  selectedProduct.value = fullProduct;
  showProductModal.value = true;
  
  // Fetch categories if not already loaded
  if (categories.value.length === 0) {
    fetchCategories();
  }
};

const closeProductModal = () => {
  showProductModal.value = false;
  selectedProduct.value = null;
};

// Get category name by ID
const getCategoryName = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  return category ? category.nev : 'N/A';
};
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <h2 class="mb-0">Kosár</h2>
      <button 
        v-if="cartItems.length > 0" 
        class="btn btn-outline-danger"
        @click="handleClearCart"
      >
        Kosár ürítése
      </button>
    </div>
    
    <p v-if="cartItems.length > 0" class="mb-3">
      <strong>Rendelés leadása ennek a cégnek:</strong> {{ companyName }}
    </p>

    <table class="table custom-table" style="border-bottom: 1px solid black;">
      <thead>
        <tr>
          <th style="width: 35%;">Termék neve</th>
          <th style="width: 15%;">Cikkszám</th>
          <th style="width: 15%;">Egységár (nettó)</th>
          <th style="width: 10%;">Mennyiség</th>
          <th style="width: 15%;">Összesen (nettó)</th>
          <th style="width: 5%;"></th>
          <th style="width: 5%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="cartItems.length === 0">
          <td colspan="7" class="text-center">A kosár tartalma jelenleg üres!</td>
        </tr>
        <tr v-for="item in cartItems" :key="item.id">
          <td>
            <span class="product-name-link" @click="openProductModal(item)">
              {{ item.nev }}
            </span>
          </td>
          <td>{{ item.cikkszam }}</td>
          <td>{{ formatPrice(item.ar) }} Ft</td>
          <td>{{ item.quantity }} {{ item.kiszereles }}</td>
          <td>{{ formatPrice(item.ar * item.quantity) }} Ft</td>
          <td>
            <i class="bi bi-pencil action-icon" @click="openEditModal(item)" title="Szerkesztés"></i>
          </td>
          <td>
            <i class="bi bi-trash action-icon" @click="removeItem(item)" title="Törlés"></i>
          </td>
        </tr>
        <tr v-if="cartItems.length > 0" class="total-row">
          <td colspan="4" class="text-end"><strong>Végösszeg (nettó):</strong></td>
          <td colspan="3"><strong>{{ formatPrice(totalPrice) }} Ft</strong></td>
        </tr>
        <tr v-if="cartItems.length > 0" class="total-row">
          <td colspan="4" class="text-end"><strong>Végösszeg (bruttó):</strong></td>
          <td colspan="3"><strong>{{ formatPrice(totalPriceWithVAT) }} Ft</strong></td>
        </tr>
      </tbody>
    </table>

    <div v-if="cartItems.length > 0" class="mt-3">
      <button class="btn btn-teal text-white btn-lg" @click="placeOrder">
        Rendelés leadása
      </button>
    </div>

    <!-- Edit Quantity Modal -->
    <transition name="modal-fade">
      <div
        v-if="showEditModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeEditModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Mennyiség szerkesztése</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div>
            <div class="modal-body" v-if="editingItem">
              <p><strong>Termék:</strong> {{ editingItem.nev }}</p>
              <div class="mb-3">
                <label class="form-label">Mennyiség ({{ editingItem.kiszereles }})</label>
                <div class="d-flex align-items-center gap-2">
                  <button 
                    class="btn btn-sm btn-outline-secondary"
                    @click="decreaseEditQuantity"
                    :disabled="editingQuantity <= (editingItem.min_vas_menny || 1)"
                  >
                    <i class="bi bi-dash"></i>
                  </button>
                  <input 
                    type="number" 
                    class="form-control form-control-sm text-center quantity-input"
                    v-model.number="editingQuantity"
                    :min="editingItem.min_vas_menny || 1"
                    style="width: 100px;"
                  />
                  <button 
                    class="btn btn-sm btn-outline-secondary"
                    @click="increaseEditQuantity"
                  >
                    <i class="bi bi-plus"></i>
                  </button>
                </div>
                <small class="text-muted">
                  Minimum: {{ editingItem.min_vas_menny || 1 }} {{ editingItem.kiszereles }}
                </small>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">
                Mégse
              </button>
              <button type="button" class="btn btn-teal text-white" @click="saveQuantity">
                Mentés
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Product Details Modal -->
    <transition name="modal-fade">
      <div
        v-if="showProductModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeProductModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ selectedProduct.nev }}</h5>
              <button type="button" class="btn-close" @click="closeProductModal"></button>
            </div>
            <div class="modal-body" v-if="selectedProduct">
              <div class="mb-3">
                <label class="form-label fw-bold">Leírás</label>
                <p class="mb-0">{{ selectedProduct.leiras || 'Nincs leírás megadva' }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Ár (nettó)</label>
                <p class="mb-0">{{ formatPrice(selectedProduct.ar) }} Ft</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">ÁFA kulcs</label>
                <p class="mb-0">{{ selectedProduct.afa_kulcs }}%</p>
              </div>
              <div class="mb-3" v-if="selectedProduct.kategoria">
                <label class="form-label fw-bold">Termékkategória</label>
                <p class="mb-0">{{ getCategoryName(selectedProduct.kategoria) }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Cikkszám</label>
                <p class="mb-0">{{ selectedProduct.cikkszam }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Minimum vásárlási mennyiség</label>
                <p class="mb-0">{{ selectedProduct.min_vas_menny || 1 }} {{ selectedProduct.kiszereles }}</p>
              </div>
              <div class="mb-3" v-if="selectedProduct.mennyiseg !== undefined">
                <label class="form-label fw-bold">Jelenleg készleten</label>
                <p class="mb-0">{{ selectedProduct.mennyiseg }} {{ selectedProduct.kiszereles }}</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeProductModal">
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
    background-color: lightgray(--bs-body-bg);
  }

  table {
    background-color: white;
    border-collapse: collapse;
  }

  thead th {
    background-color: #d3d3d3;
    font-weight: 600;
    border-bottom: 1px solid #000000;
  }

  tbody tr {
    border-bottom: 1px solid #000000;
  }

  tbody td {
    padding-top: 0.6rem;
    padding-bottom: 0.6rem;
    vertical-align: middle;
  }

  .total-row {
    background-color: #f8f9fa;
    font-weight: 500;
  }

  .total-row td {
    border-top: 2px solid #000000;
  }

  .action-icon {
    cursor: pointer;
    font-size: 1.1rem;
    transition: color 0.2s ease;
  }

  .action-icon:hover {
    color: #00948B;
  }

  .bi-trash:hover {
    color: #dc3545 !important;
  }

  .product-name-link {
    color: #0066cc;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s ease;
  }

  .product-name-link:hover {
    color: #004499;
  }

  .quantity-input {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .quantity-input::-webkit-outer-spin-button,
  .quantity-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .custom-table {
    --bs-table-bg: lightgray;
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
    max-width: 500px;
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

  .custom-modal-content .modal-footer .btn + .btn {
    margin-left: 0.5rem;
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

  .custom-modal-content .btn-close:active {
    outline: none;
    box-shadow: none;
  }
</style>
