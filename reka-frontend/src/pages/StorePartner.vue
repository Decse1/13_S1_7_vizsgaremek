<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from '../axios.js'
  import authStore from '../stores/auth'
  import cartStore, { addToCart as addItemToCart, addToCartWithClear } from '../stores/cart'

  const route = useRoute()
  const router = useRouter()

  // product list from database
  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  const partnerCompany = ref(null)
  const hasPartnership = ref(false)

  const search = ref('')

  // Categories from database
  const categories = ref([])

  // Track quantities for each product
  const quantities = ref({})

  // Modal state
  const showProductModal = ref(false)
  const selectedProduct = ref(null)
  
  // Confirmation modal state
  const showConfirmModal = ref(false)
  const pendingCartItem = ref(null)
  const pendingQuantity = ref(0)
  const confirmMessage = ref('')

  const filteredItems = computed(() =>
    items.value.filter((item) =>
      item.nev.toLowerCase().includes(search.value.toLowerCase())
    )
  )

  // Check if partnership exists
  const checkPartnership = async () => {
    if (!authStore.ceg || !authStore.ceg.id) {
      error.value = 'Nincs bejelentkezve cég!'
      return false
    }

    const partnerId = parseInt(route.params.id)
    if (isNaN(partnerId)) {
      error.value = 'Érvénytelen partner azonosító!'
      return false
    }

    loading.value = true
    error.value = ''

    try {
      // Check buyer partnerships (where logged in company is the buyer)
      const response = await axios.post('/Partnerek_en_vevo', {
        id: authStore.ceg.id
      })

      if (response.data.ok && response.data.partnerek) {
        // Find if the partner company exists in the list
        const partner = response.data.partnerek.find(p => p.cId === partnerId)
        
        if (partner) {
          hasPartnership.value = true
          partnerCompany.value = partner
          return true
        } else {
          hasPartnership.value = false
          error.value = 'Nincs partneri kapcsolat ezzel a céggel!'
          return false
        }
      } else {
        hasPartnership.value = false
        error.value = 'Nincs partneri kapcsolat ezzel a céggel!'
        return false
      }
    } catch (err) {
      console.error('Partnership check error:', err)
      error.value = 'Hiba történt a partnerség ellenőrzése során!'
      hasPartnership.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  // Fetch products from backend
  const fetchProducts = async () => {
    const partnerId = parseInt(route.params.id)
    if (isNaN(partnerId)) {
      error.value = 'Érvénytelen partner azonosító!'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await axios.post('/Raktar', {
        id: partnerId
      })

      if (response.data.ok) {
        items.value = response.data.termekek
        // Initialize quantities with min_vas_menny for each product
        items.value.forEach(item => {
          quantities.value[item.id] = item.min_vas_menny || 1
        })
      } else {
        error.value = response.data.uzenet || 'Hiba történt a termékek betöltése közben'
        items.value = []
      }
    } catch (err) {
      console.error('Axios error:', err)
      error.value = 'Hiba történt a szerver kapcsolat során!'
    } finally {
      loading.value = false
    }
  }

  // Fetch categories from backend
  const fetchCategories = async () => {
    if (!authStore.ceg || !authStore.ceg.id) {
      return
    }

    try {
      const response = await axios.post('/Kategoriak_all', {
        id: authStore.ceg.id
      })
      
      if (response.data.ok && response.data.kategoriak) {
        categories.value = response.data.kategoriak
      } else {
        categories.value = []
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      categories.value = []
    }
  }

  // Load products on component mount
  onMounted(async () => {
    const isPartner = await checkPartnership()
    if (isPartner) {
      fetchProducts()
      fetchCategories()
    }
  })

  const decreaseQuantity = (item) => {
    const minQuantity = item.min_vas_menny || 1
    if (quantities.value[item.id] > minQuantity) {
      quantities.value[item.id]--
    }
  }

  const increaseQuantity = (item) => {
    quantities.value[item.id]++
  }

  const updateQuantity = (item, value) => {
    const minQuantity = item.min_vas_menny || 1
    const numValue = parseInt(value) || minQuantity
    quantities.value[item.id] = Math.max(numValue, minQuantity)
  }

  const addToCart = (item) => {
    const quantity = quantities.value[item.id]
    const partnerId = parseInt(route.params.id)
    const companyName = partnerCompany.value ? partnerCompany.value.nev : 'Partner'
    
    const result = addItemToCart(item, quantity, partnerId, companyName)
    
    if (result.requiresConfirmation) {
      // Show confirmation modal
      pendingCartItem.value = item
      pendingQuantity.value = quantity
      confirmMessage.value = result.message
      showConfirmModal.value = true
    } else if (result.success) {
      alert(result.message)
    } else {
      alert(result.message || 'Hiba történt!')
    }
  }

  const confirmAddToCart = () => {
    if (pendingCartItem.value) {
      const partnerId = parseInt(route.params.id)
      const companyName = partnerCompany.value ? partnerCompany.value.nev : 'Partner'
      
      const result = addToCartWithClear(pendingCartItem.value, pendingQuantity.value, partnerId, companyName)
      
      if (result.success) {
        alert(result.message)
      } else {
        alert(result.message || 'Hiba történt!')
      }
    }
    
    closeConfirmModal()
  }

  const closeConfirmModal = () => {
    showConfirmModal.value = false
    pendingCartItem.value = null
    pendingQuantity.value = 0
    confirmMessage.value = ''
  }

  const openProductModal = (item) => {
    selectedProduct.value = item
    showProductModal.value = true
  }

  const closeProductModal = () => {
    showProductModal.value = false
    selectedProduct.value = null
  }

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category ? category.nev : 'N/A'
  }
</script>

<template>
  <div class="content">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">
          <template v-if="partnerCompany">
            {{ partnerCompany.nev }} készlete ({{ partnerCompany.adoszamm }})
          </template>
          <template v-else>
            Partner készlete
          </template>
        </h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="search"
            type="text"
            class="form-control custom-input rounded-5"
            placeholder="Keresés"
          />
        </div>
      </div>
    </div>

    <!-- First table -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-warning" role="alert">
      {{ error }}
    </div>

    <table v-else class="table custom-table" style="border-bottom: 1px solid black;">
      <thead>
        <tr>
          <th style="width: 40%;">Terméknév</th>
          <!-- th style="width: 20%;">Kategória</th -->
          <th style="width: 20%;">Ár (nettó)</th>
          <th style="width: 25%;">Mennyiség</th>
          <th style="width: 15%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredItems.length === 0">
          <td colspan="4" class="text-center">Nincs megjeleníthető termék</td>
        </tr>
        <tr v-for="(item, index) in filteredItems" :key="item.id || index">
          <td>
            <span class="product-name-link" @click="openProductModal(item)">
              {{ item.nev }}
            </span>
          </td>
          <!-- td>asd</td -->
          <td>{{ item.ar }} Ft</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <button 
                class="btn btn-sm btn-outline-secondary"
                @click="decreaseQuantity(item)"
                :disabled="quantities[item.id] <= (item.min_vas_menny || 1)"
              >
                <i class="bi bi-dash"></i>
              </button>
              <input 
                type="number" 
                class="form-control form-control-sm text-center quantity-input"
                :value="quantities[item.id]"
                @input="updateQuantity(item, $event.target.value)"
                :min="item.min_vas_menny || 1"
                style="width: 70px;"
              />
              <button 
                class="btn btn-sm btn-outline-secondary"
                @click="increaseQuantity(item)"
              >
                <i class="bi bi-plus"></i>
              </button>
            </div>
          </td>
          <td>
            <button class="btn btn-sm btn-teal text-white" @click="addToCart(item)">
              Kosárba
            </button>
          </td>
        </tr>
      </tbody>
    </table>

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
                <p class="mb-0">{{ selectedProduct.ar }} Ft</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">ÁFA kulcs</label>
                <p class="mb-0">{{ selectedProduct.afa_kulcs }}%</p>
              </div>
              <div class="mb-3">
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
              <div class="mb-3">
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

    <!-- Confirmation Modal -->
    <transition name="modal-fade">
      <div
        v-if="showConfirmModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeConfirmModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Figyelmeztetés</h5>
              <button type="button" class="btn-close" @click="closeConfirmModal"></button>
            </div>
            <div class="modal-body">
              <p>{{ confirmMessage }}</p>
              <p class="mb-0"><strong>Folytatod?</strong></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeConfirmModal">
                Mégse
              </button>
              <button type="button" class="btn btn-teal text-white" @click="confirmAddToCart">
                Igen, törlöm a kosarat
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
  body {
    background-color: lightgray;
  }

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

  .quantity-input {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .quantity-input::-webkit-outer-spin-button,
  .quantity-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
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

  .table-container {
    margin: 40px auto;
    background-color: #f5f5f5;
    border-radius: 6px;
    padding: 10px;
  }

  .custom-table {
    --bs-table-bg: lightgray;
  }

  .custom-input {
    border: 2px solid #ccc;
    background-color: white;
    outline: none;
    transition: border-color 0.2s;
  }

  .custom-input:focus {
    border-color: #00948B;
    background-color: white;
    box-shadow: none;
  }

  .modal-backdrop {
    display: none;
  }

  .btn-teal {
    background-color: #00948B !important;
    border-color: #00948B !important;
  }

  .btn-teal:hover,
  .btn-teal:focus {
    background-color: #007a72 !important; /* a bit darker on hover */
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

  /* Modal open/close animation */
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

  /* Space between footer buttons */
  .custom-modal-content .modal-footer .btn + .btn {
    margin-left: 0.5rem;
  }

  /* Style for close button with gray shadow */
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
