<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import axios from '../axios.js'
  import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
  import cartStore, { addToCart as addItemToCart, addToCartWithClear } from '../stores/cart'
  import Icons from '../components/Icons.vue'

  const route = useRoute()
  const router = useRouter()

  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  const partnerCompany = ref(null)
  const hasPartnership = ref(false)

  const search = ref('')

  const categories = ref([])

  const quantities = ref({})

  const showProductModal = ref(false)
  const selectedProduct = ref(null)
  
  const showConfirmModal = ref(false)
  const pendingCartItem = ref(null)
  const pendingQuantity = ref(0)
  const confirmMessage = ref('')

  const filteredItems = computed(() =>
    items.value.filter((item) =>
      item.nev.toLowerCase().includes(search.value.toLowerCase())
    )
  )

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
      const response = await axios.post('/Partnerek_en_vevo', {
        id: authStore.ceg.id
      })

      if (response.data.ok && response.data.partnerek) {
        const partner = response.data.partnerek.find(p => p.cId === partnerId)
        
        if (partner) {
          hasPartnership.value = true
          partnerCompany.value = partner
          
          try {
            const cegResponse = await axios.get('/Ceg_osszes')
            
            if (cegResponse.data.ok && cegResponse.data.cegek) {
              const partnerCegData = cegResponse.data.cegek.find(c => c.id === partnerId)
              
              if (partnerCegData && !partnerCegData.elofiz) {
                hasPartnership.value = false
                error.value = 'Ez a cég jelenleg nem rendelkezik előfizetéssel, így nem tud termékeket értékesíteni!'
                return false
              }
            }
          } catch (err) {
            console.error('Subscription check error:', err)
            error.value = 'Hiba történt az előfizetés ellenőrzése során!'
            hasPartnership.value = false
            return false
          }
          
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
        items.value.forEach(item => {
          quantities.value[item.id] = item.min_vas_menny || 1
        })
      } else {
        error.value = response.data.uzenet || 'Hiba történt a termékek betöltése közben'
        items.value = []
      }
    } catch (err) {
      console.error('Axios error:', err)
      if (err.response && err.response.status === 404) {
        error.value = 'A partnernek nincsenek termékei a raktáron'
      } else {
        error.value = 'Hiba történt a szerver kapcsolat során!'
      }
    } finally {
      loading.value = false
    }
  }

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

  onMounted(async () => {
    const isPartner = await checkPartnership()
    if (isPartner) {
      fetchProducts()
      fetchCategories()
      
      if (partnerCompany.value && partnerCompany.value.nev) {
        document.title = `${partnerCompany.value.nev} készlete | RÉKA`
      }
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
    const partnershipId = partnerCompany.value ? partnerCompany.value.id : null
    const companyName = partnerCompany.value ? partnerCompany.value.nev : 'Partner'
    
    const result = addItemToCart(item, quantity, partnerId, companyName, partnershipId)
    
    if (result.requiresConfirmation) {
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
      const partnershipId = partnerCompany.value ? partnerCompany.value.id : null
      const companyName = partnerCompany.value ? partnerCompany.value.nev : 'Partner'
      
      const result = addToCartWithClear(pendingCartItem.value, pendingQuantity.value, partnerId, companyName, partnershipId)
      
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

  const getCategoryName = (categoryId) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category ? category.nev : 'N/A'
  }
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0 header-container">
        <button 
          class="btn btn-secondary text-white me-3 back-button"
          @click="router.back()"
          title="Vissza"
        >
          <Icons name="chevronleft" size="1.25rem" />
        </button>
        
        <h2 class="me-3 mb-0 title-text">
          <template v-if="partnerCompany">
            {{ partnerCompany.nev }} készlete ({{ partnerCompany.adoszam }})
          </template>
          <template v-else>
            Partner készlete
          </template>
        </h2>
      </div>

      <div class="input-group search-input ms-md-auto" style="width: clamp(100px, 40vw, 300px);">
        <input
          v-model="search"
          type="text"
          class="form-control custom-input rounded-5"
          placeholder="Keresés"
        />
      </div>
    </div>

    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-warning" role="alert">
      {{ error }}
    </div>

    <div v-else>
      <div v-if="filteredItems.length === 0" class="text-center mt-4">
        Nincs megjeleníthető termék
      </div>

      <div v-else class="product-grid mt-3">
        <div
          v-for="(item, index) in filteredItems"
          :key="item.id || index"
          class="product-bubble"
          @click="openProductModal(item)"
        >
          <div class="product-name">{{ item.nev }}</div>
          <div class="product-price">{{ item.ar }} Ft/db</div>

          <button
            class="btn btn-sm btn-teal text-white rounded-pill w-100"
            @click.stop="addToCart(item)"
          >
            <i class="bi bi-cart me-1"></i>Kosárba
          </button>

          <div class="quantity-row" @click.stop>
            <button
              class="btn btn-sm btn-outline-secondary rounded-pill qty-btn"
              @click.stop="decreaseQuantity(item)"
              :disabled="quantities[item.id] <= (item.min_vas_menny || 1)"
            >
              <i class="bi bi-dash"></i>
            </button>

            <input
              type="number"
              class="form-control form-control-sm text-center quantity-input custom-input"
              :value="quantities[item.id]"
              @click.stop
              @input="updateQuantity(item, $event.target.value)"
              :min="item.min_vas_menny || 1"
            />

            <button
              class="btn btn-sm btn-outline-secondary rounded-pill qty-btn"
              @click.stop="increaseQuantity(item)"
            >
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

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
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeProductModal">
                Bezárás
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

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
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeConfirmModal">
                Mégse
              </button>
              <button type="button" class="btn btn-danger text-white rounded-pill" @click="confirmAddToCart">
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
  .cursor-pointer {
    cursor: pointer;
  }

  .cursor-pointer:hover {
    opacity: 0.8;
  }

  .table-container {
    margin: 40px auto;
    background-color: #f5f5f5;
    border-radius: 6px;
    padding: 10px;
  }

  .product-name-link {
    color: #0066cc;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .product-name-link:hover {
    color: #004499;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 1px solid #007bff;
    border-radius: 0.5rem;
    background-color: white;
    color: #007bff;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .quantity-btn:hover {
    background-color: #007bff;
    color: white;
  }

  @media (min-width: 992px) {
    .content {
      margin-left: 250px;
      padding: 2rem;
      margin-top: 56px;
    }
  }

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

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .product-bubble {
    background-color: #f0f0f0;
    border-radius: 1.1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    min-height: 185px;
    justify-content: space-between;
    cursor: pointer;
    transition: background-color 0.18s ease;
  }

  .product-bubble:hover {
    background-color: #e5e5e5;
  }

  .product-name {
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    min-height: 2.4em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .product-price {
    font-weight: 600;
    text-align: center;
  }

  .quantity-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .quantity-input {
    width: 50%;
  }

  .quantity-input::-webkit-outer-spin-button,
  .quantity-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .quantity-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .qty-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-backdrop {
    display: none;
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

  .back-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    padding: 0;
    border-radius: 50%;
  }

  @media (max-width: 767.98px) {
    .header-container {
      flex-direction: column;
      align-items: flex-start !important;
      width: 100%;
    }

    .back-button {
      margin-bottom: 0.75rem;
      margin-right: 0 !important;
    }

    .title-text {
      margin-bottom: 0.75rem;
      margin-right: 0 !important;
    }

    .search-input {
      width: 100% !important;
      max-width: 100% !important;
      margin-top: 0.5rem;
      margin-left: 0 !important;
    }
  }

  @media (min-width: 768px) {
    .header-container {
      flex-direction: row;
      align-items: center;
    }
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

  @media (max-width: 575.98px) {
    .product-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
    }

    .product-bubble {
      padding: 0.8rem;
      min-height: 170px;
    }

    .product-name {
      font-size: 0.98rem;
    }

    .product-price {
      font-size: 0.95rem;
    }
  }
</style>
