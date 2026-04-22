<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
import cartStore, { removeFromCart, updateQuantity, getTotalPrice, getTotalPriceWithVAT, clearCart, updateItemPrice, getVATAmountsByRate } from '../stores/cart.js';
import Icons from '../components/Icons.vue';

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

// Price update notifications
const priceUpdates = ref([]);
const isUnder510 = ref(false);

const updateResponsiveState = () => {
  isUnder510.value = window.innerWidth < 510;
};

// Computed properties
const cartItems = computed(() => cartStore.items);
const companyName = computed(() => cartStore.companyName || 'N/A');
const totalPrice = computed(() => getTotalPrice());
const totalPriceWithVAT = computed(() => getTotalPriceWithVAT());
const vatAmountsByRate = computed(() => getVATAmountsByRate());
const emptyCartColspan = computed(() => (isUnder510.value ? 3 : 9));
const totalLabelColspan = computed(() => (isUnder510.value ? 2 : 6));
const totalValueColspan = computed(() => (isUnder510.value ? 1 : 3));

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

// Place order
const placeOrder = async () => {
  if (cartItems.value.length === 0) {
    alert('A kosár üres!');
    return;
  }

  if (!cartStore.partnershipId) {
    alert('Hiba: Hiányzó partnerség információ!');
    return;
  }

  if (!authStore.user || !authStore.user.id) {
    alert('Hiba: Hiányzó felhasználó információ!');
    return;
  }

  if (!cartStore.companyId) {
    alert('Hiba: Hiányzó cég információ!');
    return;
  }

  try {
    // Check if the seller company has an active subscription
    const companiesResponse = await axios.get('/Ceg_osszes');
    
    if (!companiesResponse.data.ok || !companiesResponse.data.cegek) {
      alert('Hiba: Nem sikerült ellenőrizni a cég előfizetési státuszát!');
      return;
    }

    const sellerCompany = companiesResponse.data.cegek.find(c => c.id === cartStore.companyId);
    
    if (!sellerCompany) {
      alert('Hiba: Az eladó cég nem található!');
      return;
    }

    if (!sellerCompany.elofiz) {
      alert(`Hiba: A(z) ${sellerCompany.nev} cég nem rendelkezik aktív RÉKA előfizetéssel. A rendelés leadása nem lehetséges!`);
      return;
    }

    // Transform cart items to the expected format
    const termekek = cartItems.value.map(item => ({
      termekId: item.id,
      mennyiseg: item.quantity,
      nev: item.nev,
      ar: item.ar,
      afa_kulcs: item.afa_kulcs
    }));

    // Prepare order data
    const orderData = {
      partnerseg: cartStore.partnershipId, // Partnership ID
      sz_cim: authStore.user.id, // Billing address (User ID)
      termekek: termekek
    };

    // Send order to backend
    const response = await axios.post('/Rendeles_ad', orderData);

    if (response.data.ok) {
      alert(`Rendelés sikeresen leadva! Rendelésszám: ${response.data.rendelesSzam}`);
      clearCart();
      router.push('/rendelesek/leadott'); // Redirect to orders page
    } else {
      alert(`Hiba a rendelés leadásakor: ${response.data.uzenet || 'Ismeretlen hiba'}`);
    }
  } catch (error) {
    console.error('Error placing order:', error);
    if (error.response && error.response.data && error.response.data.uzenet) {
      alert(`Hiba: ${error.response.data.uzenet}`);
    } else {
      alert('Hiba történt a rendelés leadása során. Kérjük, próbálja újra!');
    }
  }
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

// Check and update prices
const checkAndUpdatePrices = async () => {
  if (cartItems.value.length === 0 || !cartStore.companyId) {
    return;
  }

  try {
    const response = await axios.post('/Raktar', {
      id: cartStore.companyId
    });

    if (response.data.ok && response.data.termekek) {
      const currentProducts = response.data.termekek;
      const updates = [];

      cartItems.value.forEach(cartItem => {
        const currentProduct = currentProducts.find(p => p.id === cartItem.id);
        
        if (currentProduct) {
          // Check if price or VAT rate has changed
          if (currentProduct.ar !== cartItem.ar || currentProduct.afa_kulcs !== cartItem.afa_kulcs) {
            updates.push({
              nev: cartItem.nev,
              oldPrice: cartItem.ar,
              newPrice: currentProduct.ar,
              oldVat: cartItem.afa_kulcs,
              newVat: currentProduct.afa_kulcs
            });
            
            // Update the cart item
            updateItemPrice(cartItem.id, currentProduct.ar, currentProduct.afa_kulcs);
          }
        }
      });

      // Show notification if there were updates
      if (updates.length > 0) {
        priceUpdates.value = updates;
        
        // Create notification message
        let message = 'Az alábbi termékek ára megváltozott:\n\n';
        updates.forEach(update => {
          message += `${update.nev}:\n`;
          message += `  Régi ár: ${formatPrice(update.oldPrice)} Ft (${update.oldVat}% ÁFA)\n`;
          message += `  Új ár: ${formatPrice(update.newPrice)} Ft (${update.newVat}% ÁFA)\n\n`;
        });
      }
    }
  } catch (err) {
    console.error('Error checking prices:', err);
  }
};

// On component mount, check prices
onMounted(() => {
  updateResponsiveState();
  window.addEventListener('resize', updateResponsiveState);
  checkAndUpdatePrices();
});

onUnmounted(() => {
  window.removeEventListener('resize', updateResponsiveState);
});
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <h2 class="mb-0">Kosár</h2>
      <button
        v-if="cartItems.length > 0"
        class="btn btn-danger add-btn rounded-5 d-flex align-items-center"
        @click="handleClearCart"
        data-test="empty-cart-btn"
      >
        <Icons name="trash" size="1.35rem"/>
        <span class="d-none d-sm-inline ms-2">Kosár ürítése</span>
      </button>
    </div>

    <!-- Price Update Alert -->
    <div v-if="priceUpdates.length > 0" class="alert alert-warning alert-dismissible fade show" role="alert">
      <strong><i class="bi bi-exclamation-triangle-fill me-2"></i>Árak frissítve!</strong>
      <p class="mb-2">Az alábbi termékek ára megváltozott:</p>
      <ul class="mb-0">
        <li v-for="(update, index) in priceUpdates" :key="index">
          <strong>{{ update.nev }}:</strong><br>
          <small>
            Régi ár: {{ formatPrice(update.oldPrice) }} Ft ({{ update.oldVat }}% ÁFA) → 
            Új ár: {{ formatPrice(update.newPrice) }} Ft ({{ update.newVat }}% ÁFA)
          </small>
        </li>
      </ul>
      <button type="button" class="btn-close" @click="priceUpdates = []" aria-label="Close"></button>
    </div>
    
    <p v-if="cartItems.length > 0" class="mb-3">
      <strong>Rendelés leadása ennek a cégnek:</strong> {{ companyName }}
    </p>

    <table class="table custom-table" style="border-bottom: 1px solid black;">
      <thead>
        <tr>
          <th class="col-name" style="width: 35%;">Termék neve</th>
          <th class="col-cikkszam hide-under-510" style="width: 15%;">Cikkszám</th>
          <th class="col-qty" style="width: 10%;">Mennyiség</th>
          <th class="col-unit-price hide-under-510" style="width: 15%;">Egységár (nettó)</th>
          <th class="col-vat-rate hide-under-510" style="width: 8%;">ÁFA%</th>
          <th class="col-vat-value hide-under-510" style="width: 10%;">ÁFA</th>
          <th class="col-total" style="width: 20%;">Összesen (bruttó)</th>
          <th class="col-action" style="width: 2.5%;"></th>
          <th class="col-action" style="width: 2.5%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="cartItems.length === 0">
          <td :colspan="emptyCartColspan" class="text-center">A kosár tartalma jelenleg üres!</td>
        </tr>
        <tr v-for="item in cartItems" :key="item.id">
          <td class="col-name">
            <div class="product-cell">
              <span class="product-name-link" @click="openProductModal(item)">
                {{ item.nev }}
              </span>

              <!-- Mobile-only actions under the product name -->
              <div class="product-actions-mobile">
                <button type="button" class="action-button action-edit-button" @click="openEditModal(item)" title="Szerkesztés">
                  <Icons name="pencil" size="1.1rem" />
                </button>
                <button type="button" class="action-button action-delete-button" @click="removeItem(item)" title="Törlés">
                  <Icons name="trash" size="1.1rem" />
                </button>
              </div>
            </div>
          </td>
          <td class="col-cikkszam hide-under-510">{{ item.cikkszam }}</td>
          <td class="col-qty">{{ item.quantity }} {{ item.kiszereles }}</td>
          <td class="col-unit-price hide-under-510">{{ formatPrice(item.ar) }} Ft</td>
          <td class="col-vat-rate hide-under-510">{{ item.afa_kulcs }}%</td>
          <td class="col-vat-value hide-under-510">{{ formatPrice(item.ar * item.quantity * item.afa_kulcs / 100) }} Ft</td>
          <td class="col-total">{{ formatPrice(item.ar * item.quantity * (1 + item.afa_kulcs / 100)) }} Ft</td>

          <!-- Desktop/tablet actions in their own columns -->
          <td class="product-actions-desktop col-action">
            <button type="button" class="action-button action-edit-button" @click="openEditModal(item)" title="Szerkesztés">
              <Icons name="pencil" size="1.25rem" />
            </button>
          </td>
          <td class="product-actions-desktop col-action">
            <button type="button" class="action-button action-delete-button" @click="removeItem(item)" title="Törlés">
              <Icons name="trash" size="1.25rem" />
            </button>
          </td>
        </tr>
        <tr v-if="cartItems.length > 0" class="total-row">
          <td :colspan="totalLabelColspan" class="text-end"><strong>Végösszeg (nettó):</strong></td>
          <td :colspan="totalValueColspan"><strong>{{ formatPrice(totalPrice) }} Ft</strong></td>
        </tr>
        <tr v-for="vat in vatAmountsByRate" :key="vat.rate" class="vat-row">
          <td :colspan="totalLabelColspan" class="text-end"><strong>ÁFA összege ({{ vat.rate }}%):</strong></td>
          <td :colspan="totalValueColspan"><strong>{{ formatPrice(vat.amount) }} Ft</strong></td>
        </tr>
        <tr v-if="cartItems.length > 0" class="total-row">
          <td :colspan="totalLabelColspan" class="text-end"><strong>Végösszeg (bruttó):</strong></td>
          <td :colspan="totalValueColspan"><strong>{{ formatPrice(totalPriceWithVAT) }} Ft</strong></td>
        </tr>
      </tbody>
    </table>

    <div v-if="cartItems.length > 0" class="mt-3 place-order-wrapper">
      <button class="btn btn-teal text-white btn-lg rounded-pill place-order-btn" @click="placeOrder">
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
              <p><strong>Egységár (nettó):</strong> {{ formatPrice(editingItem.ar) }} Ft</p>
              <p><strong>ÁFA-kulcs:</strong> {{ editingItem.afa_kulcs }}%</p>
              <div class="mb-3">
                <label class="form-label">Mennyiség ({{ editingItem.kiszereles }})</label>
                <div class="d-flex align-items-center gap-2">
                  <button 
                    class="btn btn-sm btn-outline-secondary rounded-pill"
                    @click="decreaseEditQuantity"
                    :disabled="editingQuantity <= (editingItem.min_vas_menny || 1)"
                  >
                    <i class="bi bi-dash"></i>
                  </button>
                  <input 
                    type="number" 
                    class="form-control form-control-sm text-center quantity-input custom-input"
                    v-model.number="editingQuantity"
                    :min="editingItem.min_vas_menny || 1"
                    style="width: 100px;"
                  />
                  <button 
                    class="btn btn-sm btn-outline-secondary rounded-pill"
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
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeEditModal">
                Mégse
              </button>
              <button type="button" class="btn btn-teal rounded-pill text-white" @click="saveQuantity">
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
                <label class="form-label fw-bold">ÁFA-kulcs</label>
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
  /* Page-specific styles only - common styles moved to global.css */

  .total-row {
    background-color: #f8f9fa;
    font-weight: 500;
  }

  .total-row td {
    border-top: 2px solid #000000;
  }

  .vat-row {
    background-color: #f8f9fa;
    font-weight: 500;
  }

  .vat-row td {
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .action-icon {
    cursor: pointer;
    transition: opacity 0.2s;
    color: #000;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
  }

  .action-icon:hover {
    opacity: 0.6;
  }

  .action-button {
    border: 0;
    background: transparent;
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 0;
    line-height: 1;
    cursor: pointer;
    transition: opacity 0.2s, background-color 0.2s, border-color 0.2s, color 0.2s;
    vertical-align: middle;
    height: 1.25rem;
    width: 1.25rem;
  }

  .action-button :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .action-button:hover {
    opacity: 0.7;
  }

  .product-actions-desktop .action-delete-button {
    color: #dc3545;
  }

  .trash-icon {
    color: #c00;
  }

  .trash-icon:hover {
    opacity: 0.6;
  }

  .product-name-link {
    color: #00948b;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .product-name-link:hover {
    color: #007a72;
    text-decoration: none;
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

  .alert {
    border-radius: 0.5rem;
  }

  .alert ul {
    padding-left: 1.5rem;
  }

  .alert ul li {
    margin-bottom: 0.5rem;
  }

  .product-cell {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  /* Hidden on desktop by default */
  .product-actions-mobile {
    display: none;
    gap: 0.75rem;
    align-items: center;
  }

  /* Visible on desktop by default */
  .product-actions-desktop {
    white-space: nowrap;
    vertical-align: middle;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    padding-left: 0.25rem !important;
    padding-right: 0.25rem !important;
  }

  .product-actions-desktop .action-button {
    display: block;
  }

  .place-order-wrapper {
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 564.98px) {
    .place-order-wrapper {
      justify-content: stretch;
    }

    .place-order-btn {
      width: 100%;
    }
  }

  @media (max-width: 575.98px) {
    /* Show actions under product name on mobile */
    .product-actions-mobile {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .action-button {
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 0;
      width: 2.15rem;
      height: 2.15rem;
      flex: 0 0 2.15rem;
    }

    .action-edit-button {
      background-color: #00948B;
      border-color: #00948B;
      color: #fff;
    }

    .action-delete-button {
      background-color: #dc3545;
      border-color: #dc3545;
      color: #fff;
    }

    .action-edit-button:hover,
    .action-delete-button:hover {
      opacity: 0.9;
    }

    /* Hide the separate action columns on mobile */
    .product-actions-desktop {
      display: none;
    }

    /* Hide the header columns that belong to desktop action cells to avoid blank space */
    table.custom-table thead th:nth-last-child(1),
    table.custom-table thead th:nth-last-child(2) {
      display: none;
    }
  }

  @media (max-width: 509.98px) {
    .hide-under-510 {
      display: none;
    }

    .col-name {
      width: 52% !important;
    }

    .col-qty {
      width: 20% !important;
      white-space: nowrap;
    }

    .col-total {
      width: 28% !important;
      white-space: nowrap;
    }

    .col-action {
      display: none !important;
    }

    .product-cell {
      gap: 0.5rem;
    }

    .product-actions-mobile {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.35rem;
    }
  }
</style>
