<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
import cartStore, { removeFromCart, updateQuantity, getTotalPrice, getTotalPriceWithVAT, clearCart, updateItemPrice } from '../stores/cart.js';
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
  checkAndUpdatePrices();
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
          <th style="width: 35%;">Termék neve</th>
          <th style="width: 15%;">Cikkszám</th>
          <th style="width: 15%;">Egységár (nettó)</th>
          <th style="width: 10%;">Mennyiség</th>
          <th style="width: 20%;">Összesen (nettó)</th>
          <th style="width: 2.5%;"></th>
          <th style="width: 2.5%;"></th>
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
            <span class="action-icon" @click="openEditModal(item)" title="Szerkesztés">
              <Icons name="pencil" size="1.25rem" />
            </span>
          </td>
          <td>
            <span class="action-icon trash-icon" @click="removeItem(item)" title="Törlés">
              <Icons name="trash" size="1.25rem" />
            </span>
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
      <button class="btn btn-teal text-white btn-lg rounded-pill" @click="placeOrder">
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
                    class="btn btn-sm btn-outline-secondary rounded-pill"
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
  /* Page-specific styles only - common styles moved to global.css */

  .total-row {
    background-color: #f8f9fa;
    font-weight: 500;
  }

  .total-row td {
    border-top: 2px solid #000000;
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

  .trash-icon {
    color: #c00;
  }

  .trash-icon:hover {
    opacity: 0.6;
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

  .alert {
    border-radius: 0.5rem;
  }

  .alert ul {
    padding-left: 1.5rem;
  }

  .alert ul li {
    margin-bottom: 0.5rem;
  }
</style>
