<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from '../axios.js'
  import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';

  // product list from database
  const items = ref([])
  const loading = ref(false)
  const error = ref('')

  const search = ref('')

  // Categories from database
  const categories = ref([])

  const filteredItems = computed(() =>
    items.value.filter((item) =>
      item.nev.toLowerCase().includes(search.value.toLowerCase())
    )
  )

  // Check if company has active subscription
  const hasSubscription = computed(() => {
    return authStore.ceg && authStore.ceg.elofiz === 1
  })

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!authStore.ceg || !authStore.ceg.id) {
      error.value = 'Nincs bejelentkezve cég!'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await axios.post('/Raktar', {
        id: authStore.ceg.id
      })

      if (response.data.ok) {
        items.value = response.data.termekek
      } else {
        error.value = response?.data?.uzenet || 'Hiba történt a termékek betöltése közben'
        items.value = []
      }
    } catch (err) {
      console.error('Axios error:', err)
      error.value = response?.data?.uzenet || 'Hiba történt a szerver kapcsolat során!'
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
  onMounted(() => {
    fetchProducts()
    fetchCategories()
  })

  // Modal state and form model for new product
  const showAddModal = ref(false)
  const showEditModal = ref(false)
  const showDetailsModal = ref(false)
  const formError = ref('')
  const selectedProduct = ref(null)
  const newProduct = ref({
    name: '',
    stock: 0,
    kiszereles: '',
    category: '',
    cikkszam: '',
    min_vas_menny: 1,
    leiras: '',
    ar: 0,
    afa_kulcs: 27
  })

  const editProduct = ref({
    id: null,
    name: '',
    stock: 0,
    kiszereles: '',
    category: '',
    cikkszam: '',
    min_vas_menny: 1,
    leiras: '',
    ar: 0,
    afa_kulcs: 27
  })

  // Store original values to prevent modification
  const originalProductValues = ref({
    name: '',
    cikkszam: ''
  })

  const edit = (item) => {
    if (!hasSubscription.value) {
      alert('A termékek szerkesztése csak aktív RÉKA előfizetéssel érhető el!')
      return
    }
    editProduct.value = {
      id: item.id,
      name: item.nev,
      stock: item.mennyiseg,
      kiszereles: item.kiszereles,
      category: item.kategoria,
      cikkszam: item.cikkszam,
      min_vas_menny: item.min_vas_menny,
      leiras: item.leiras,
      ar: item.ar,
      afa_kulcs: item.afa_kulcs
    }
    // Store original values for validation
    originalProductValues.value = {
      name: item.nev,
      cikkszam: item.cikkszam
    }
    formError.value = ''
    showEditModal.value = true
  }

  const showDetails = (item) => {
    selectedProduct.value = item
    showDetailsModal.value = true
  }

  const closeDetailsModal = () => {
    showDetailsModal.value = false
    selectedProduct.value = null
  }

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const category = categories.value.find(cat => cat.id === categoryId)
    return category ? category.nev : 'N/A'
  }

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('hu-HU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(price))
  }

  const openAddModal = () => {
    if (!hasSubscription.value) {
      alert('Új termék felvétele csak aktív RÉKA előfizetéssel érhető el!')
      return
    }
    else if (!hasPermission('raktar_kezel')) {
      alert('Új termék felvétele csak megfelelő jogosultsággal rendelkező felhasználók számára érhető el!')
      return
    }
    newProduct.value = {
      name: '',
      stock: 0,
      kiszereles: '',
      category: '',
      cikkszam: '',
      min_vas_menny: 1,
      leiras: '',
      ar: 0,
      afa_kulcs: 27
    }
    formError.value = ''
    showAddModal.value = true
  }

  const closeAddModal = () => {
    showAddModal.value = false
    formError.value = ''
  }

  const closeEditModal = () => {
    showEditModal.value = false
    formError.value = ''
  }

  const saveNewProduct = async () => {
    // Validate form fields
    formError.value = ''

    if (!newProduct.value.name || newProduct.value.name.trim() === '') {
      formError.value = 'A terméknév megadása kötelező!'
      return
    }

    if (!newProduct.value.cikkszam || newProduct.value.cikkszam.trim() === '') {
      formError.value = 'A cikkszám megadása kötelező!'
      return
    }

    if (!newProduct.value.kiszereles || newProduct.value.kiszereles.trim() === '') {
      formError.value = 'A kiszerelés megadása kötelező!'
      return
    }

    if (!newProduct.value.leiras || newProduct.value.leiras.trim() === '') {
      formError.value = 'A termék leírása kötelező!'
      return
    }

    if (!newProduct.value.category) {
      formError.value = 'A kategória kiválasztása kötelező!'
      return
    }

    if (newProduct.value.stock < 0) {
      formError.value = 'A készlet nem lehet negatív szám!'
      return
    }

    if (newProduct.value.min_vas_menny < 1) {
      formError.value = 'A minimum vásárlási mennyiség legalább 1 kell legyen!'
      return
    }

    if (newProduct.value.ar < 1) {
      formError.value = 'Az ár legalább 1 Ft kell legyen!'
      return
    }

    if (newProduct.value.afa_kulcs < 0) {
      formError.value = 'Az áfakulcs nem lehet negatív!'
      return
    }

    // Check if user is logged in
    if (!authStore.ceg || !authStore.ceg.id) {
      formError.value = 'Nincs bejelentkezve cég!'
      return
    }

    // If all validations pass, send to backend
    try {
      const response = await axios.post('/Termek_ad', {
        tulajdonos: authStore.ceg.id,
        nev: newProduct.value.name,
        cikkszam: newProduct.value.cikkszam,
        mennyiseg: newProduct.value.stock,
        kiszereles: newProduct.value.kiszereles,
        min_vas_menny: newProduct.value.min_vas_menny,
        leiras: newProduct.value.leiras,
        ar: newProduct.value.ar,
        kategoria: newProduct.value.category,
        afa_kulcs: newProduct.value.afa_kulcs
      })

      if (response.data.ok) {
        // Success - refresh the page
        window.location.reload()
      } else {
        formError.value = response?.data?.uzenet || 'Hiba történt a termék mentése során'
      }
    } catch (err) {
      console.error('Error saving product:', err)
      formError.value = response?.data?.uzenet || 'Hiba történt a szerver kapcsolat során!'
    }
  }

  const saveEditProduct = async () => {
    // Validate form fields
    formError.value = ''

    // Prevent modification of name and cikkszam
    if (editProduct.value.name !== originalProductValues.value.name) {
      formError.value = 'A terméknév nem módosítható!'
      return
    }

    if (editProduct.value.cikkszam !== originalProductValues.value.cikkszam) {
      formError.value = 'A cikkszám nem módosítható!'
      return
    }

    if (!editProduct.value.name || editProduct.value.name.trim() === '') {
      formError.value = 'A terméknév megadása kötelező!'
      return
    }

    if (!editProduct.value.cikkszam || editProduct.value.cikkszam.trim() === '') {
      formError.value = 'A cikkszám megadása kötelező!'
      return
    }

    if (!editProduct.value.kiszereles || editProduct.value.kiszereles.trim() === '') {
      formError.value = 'A kiszerelés megadása kötelező!'
      return
    }

    if (!editProduct.value.leiras || editProduct.value.leiras.trim() === '') {
      formError.value = 'A termék leírása kötelező!'
      return
    }

    if (!editProduct.value.category) {
      formError.value = 'A kategória kiválasztása kötelező!'
      return
    }

    if (editProduct.value.stock < 0) {
      formError.value = 'A készlet nem lehet negatív szám!'
      return
    }

    if (editProduct.value.min_vas_menny < 1) {
      formError.value = 'A minimum vásárlási mennyiség legalább 1 kell legyen!'
      return
    }

    if (editProduct.value.ar < 1) {
      formError.value = 'Az ár legalább 1 Ft kell legyen!'
      return
    }

    if (editProduct.value.afa_kulcs < 0) {
      formError.value = 'Az áfakulcs nem lehet negatív!'
      return
    }

    // Check if user is logged in
    if (!authStore.ceg || !authStore.ceg.id) {
      formError.value = 'Nincs bejelentkezve cég!'
      return
    }

    // If all validations pass, send to backend
    try {
      const response = await axios.post('/Termek_update', {
        id: editProduct.value.id,
        tulajdonos: authStore.ceg.id,
        nev: editProduct.value.name,
        cikkszam: editProduct.value.cikkszam,
        mennyiseg: editProduct.value.stock,
        kiszereles: editProduct.value.kiszereles,
        min_vas_menny: editProduct.value.min_vas_menny,
        leiras: editProduct.value.leiras,
        ar: editProduct.value.ar,
        kategoria: editProduct.value.category,
        afa_kulcs: editProduct.value.afa_kulcs
      })

      if (response.data.ok) {
        // Success - refresh the page
        window.location.reload()
      } else {
        formError.value = response?.data?.uzenet || 'Hiba történt a termék frissítése során'
      }
    } catch (err) {
      console.error('Error updating product:', err)
      formError.value = response?.data?.uzenet || 'Hiba történt a szerver kapcsolat során!'
    }
  }
</script>

<template>
  <div class="content">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0" data-test="page-title">Raktár</h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="search"
            type="text"
            class="form-control custom-input rounded-5"
            placeholder="Keresés"
            data-test="search-input"
          />
        </div>
      </div>

      <button
        v-if="hasSubscription && hasPermission('raktar_kezel')"
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="openAddModal"
        data-test="add-product-btn"
      >
        <Icons name="plus" size="1.5rem"/>
        <span class="d-none d-sm-inline ms-2">Új termék felvétele</span>
      </button>
      <div v-else-if="!hasSubscription" class="alert alert-warning mb-0 py-2 px-3 rounded-5" role="alert" data-test="subscription-required-warning">
        <i class="bi bi-lock-fill me-2"></i>Előfizetés szükséges
      </div>
    </div>

    <!-- First table -->
    <div v-if="loading" class="text-center my-4" data-test="loading-spinner">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-warning" role="alert" data-test="error-message">
      {{ error }}
    </div>

    <table v-else class="table custom-table" style="border-bottom: 1px solid black;" data-test="products-table">
      <thead>
        <tr>
          <th style="width: 60%;" data-test="table-header-name">Terméknév</th>
          <!-- th style="width: 20%;">Kategória</th -->
          <th style="width: 25%;" data-test="table-header-price">Ár (nettó)</th>
          <th class="text-end" style="width: 12%;" data-test="table-header-stock">Készlet</th>
          <th style="width: 2.5%;" data-test="table-header-actions"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredItems.length === 0">
          <td colspan="5" class="text-center" data-test="no-products-message">Nincs megjeleníthető termék</td>
        </tr>
        <tr v-for="(item, index) in filteredItems" :key="item.id || index" :data-test="`product-row-${item.id}`">
          <td :data-test="`product-name-${item.id}`">
            <span class="product-name-link" @click="showDetails(item)" :data-test="`product-name-link-${item.id}`">
              {{ item.nev }}
            </span>
          </td>
          <!-- td>asd</td -->
          <td :data-test="`product-price-${item.id}`">{{ item.ar }} Ft</td>
          <td class="text-end" :data-test="`product-stock-${item.id}`">{{ item.mennyiseg }} {{ item.kiszereles }}</td>
          <td>
            <span v-if="hasSubscription && hasPermission('raktar_kezel')" class="cursor-pointer" @click="edit(item)" :data-test="`edit-product-btn-${item.id}`">
              <Icons name="pencil" size="1.25rem" />
            </span>
            <i v-else-if="!hasSubscription" class="bi bi-lock-fill text-muted" style="cursor: not-allowed;" title="Előfizetés szükséges" data-test="edit-locked-icon"/>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add product modal -->
    <transition name="modal-fade">
      <div
        v-if="showAddModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeAddModal"
        data-test="add-product-modal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-test="add-modal-title">Új termék felvétele</h5>
              <button type="button" class="btn-close" @click="closeAddModal" data-test="add-modal-close-btn"></button>
            </div> 
            <div class="modal-body">
              <form id="product-form" @submit.prevent="saveNewProduct">
                <div class="mb-3">
                  <label class="form-label">Terméknév</label>
                  <input
                    v-model="newProduct.name"
                    type="text"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                    data-test="add-product-name-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Készlet (db)</label>
                  <input
                    v-model.number="newProduct.stock"
                    type="number"
                    min="1"
                    class="form-control custom-input"
                    required
                    data-test="add-product-stock-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Cikkszám</label>
                  <input
                    v-model="newProduct.cikkszam"
                    type="text"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                    data-test="add-product-cikkszam-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kiszerelése</label>
                  <input
                    v-model="newProduct.kiszereles"
                    type="text"
                    class="form-control custom-input"
                    maxlength="10"
                    required
                    data-test="add-product-kiszereles-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Minimum vásárlási mennyiség</label>
                  <input
                    v-model.number="newProduct.min_vas_menny"
                    type="number"
                    min="1"
                    class="form-control custom-input"
                    required
                    data-test="add-product-min-quantity-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék leírása</label>
                  <input
                    v-model="newProduct.leiras"
                    type="text"
                    class="form-control custom-input"
                    required
                    data-test="add-product-description-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Ár (magyar forint, nettó)</label>
                  <input
                    v-model.number="newProduct.ar"
                    type="number"
                    min="1"
                    class="form-control custom-input"
                    required
                    data-test="add-product-price-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kategóriája</label>
                  <select
                    v-model="newProduct.category"
                    class="form-select custom-input"
                    required
                    data-test="add-product-category-select"
                  >
                    <option value="" disabled>Válasszon kategóriát...</option>
                    <option 
                      v-for="category in categories" 
                      :key="category.id" 
                      :value="category.id"
                      :data-test="`add-product-category-${category.id}`"
                    >
                      {{ category.nev }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Áfakulcs</label>
                  <input
                    v-model.number="newProduct.afa_kulcs"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    required
                    data-test="add-product-vat-input"
                  />
                </div>
              </form>
              <!-- Error message display -->
              <div v-if="formError" class="alert alert-danger mt-3 mb-0" role="alert" data-test="add-product-error">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ formError }}
              </div>
            </div>            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeAddModal" data-test="add-modal-cancel-btn">
                Mégse
              </button>
              <button type="submit" class="btn btn-primary btn-teal rounded-pill" form="product-form" data-test="add-modal-save-btn">
                Mentés
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- Edit product modal -->
    <transition name="modal-fade">
      <div
        v-if="showEditModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeEditModal"
        data-test="edit-product-modal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-test="edit-modal-title">Termék módosítása</h5>
              <button type="button" class="btn-close" @click="closeEditModal" data-test="edit-modal-close-btn"></button>
            </div> 
            <div class="modal-body">
              <form id="edit-product-form" @submit.prevent="saveEditProduct">
                <div class="mb-3">
                  <label class="form-label">Terméknév</label>
                  <input
                    v-model="editProduct.name"
                    type="text"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                    disabled
                    data-test="edit-product-name-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Készlet (db)</label>
                  <input
                    v-model.number="editProduct.stock"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    required
                    data-test="edit-product-stock-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Cikkszám</label>
                  <input
                    v-model="editProduct.cikkszam"
                    type="text"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                    disabled
                    data-test="edit-product-cikkszam-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kiszerelése</label>
                  <input
                    v-model="editProduct.kiszereles"
                    type="text"
                    class="form-control custom-input"
                    maxlength="10"
                    required
                    data-test="edit-product-kiszereles-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Minimum vásárlási mennyiség</label>
                  <input
                    v-model.number="editProduct.min_vas_menny"
                    type="number"
                    min="1"
                    class="form-control custom-input"
                    required
                    data-test="edit-product-min-quantity-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék leírása</label>
                  <input
                    v-model="editProduct.leiras"
                    type="text"
                    class="form-control custom-input"
                    required
                    data-test="edit-product-description-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Ár (magyar forint, nettó)</label>
                  <input
                    v-model.number="editProduct.ar"
                    type="number"
                    min="1"
                    class="form-control custom-input"
                    required
                    data-test="edit-product-price-input"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kategóriája</label>
                  <select
                    v-model="editProduct.category"
                    class="form-select custom-input"
                    required
                    data-test="edit-product-category-select"
                  >
                    <option value="" disabled>Válasszon kategóriát...</option>
                    <option 
                      v-for="category in categories" 
                      :key="category.id" 
                      :value="category.id"
                    >
                      {{ category.nev }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Áfakulcs</label>
                  <input
                    v-model.number="editProduct.afa_kulcs"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    required
                    data-test="edit-product-vat-input"
                  />
                </div>
              </form>
              <!-- Error message display -->
              <div v-if="formError" class="alert alert-danger mt-3 mb-0" role="alert" data-test="edit-product-error">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ formError }}
              </div>
            </div>            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeEditModal" data-test="edit-modal-cancel-btn">
                Mégse
              </button>
              <button type="submit" class="btn btn-primary btn-teal rounded-pill" form="edit-product-form" data-test="edit-modal-save-btn">
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
        v-if="showDetailsModal && selectedProduct"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeDetailsModal"
        data-test="details-product-modal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-test="details-modal-title">{{ selectedProduct.nev }}</h5>
              <button type="button" class="btn-close" @click="closeDetailsModal" data-test="details-modal-close-btn"></button>
            </div> 
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label fw-bold">Leírás</label>
                <p class="mb-0" data-test="details-product-description">{{ selectedProduct.leiras || 'Nincs leírás megadva' }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Ár (nettó)</label>
                <p class="mb-0" data-test="details-product-price">{{ formatPrice(selectedProduct.ar) }} Ft</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">ÁFA kulcs</label>
                <p class="mb-0" data-test="details-product-vat">{{ selectedProduct.afa_kulcs }}%</p>
              </div>
              <div class="mb-3" v-if="selectedProduct.kategoria">
                <label class="form-label fw-bold">Termékkategória</label>
                <p class="mb-0" data-test="details-product-category">{{ getCategoryName(selectedProduct.kategoria) }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Cikkszám</label>
                <p class="mb-0" data-test="details-product-cikkszam">{{ selectedProduct.cikkszam }}</p>
              </div>
              <div class="mb-3">
                <label class="form-label fw-bold">Minimum vásárlási mennyiség</label>
                <p class="mb-0" data-test="details-product-min-quantity">{{ selectedProduct.min_vas_menny || 1 }} {{ selectedProduct.kiszereles }}</p>
              </div>
              <div class="mb-3" v-if="selectedProduct.mennyiseg !== undefined">
                <label class="form-label fw-bold">Jelenleg készleten</label>
                <p class="mb-0" data-test="details-product-stock">{{ selectedProduct.mennyiseg }} {{ selectedProduct.kiszereles }}</p>
              </div>
            </div>            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeDetailsModal" data-test="details-modal-close-btn-footer">
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

  .cursor-pointer {
    cursor: pointer;
    color: #000;
    transition: opacity 0.2s;
    display: inline-flex;
    align-items: center;
    vertical-align: middle;
    position: relative;
    top: -2px;
  }

  .cursor-pointer:hover {
    opacity: 0.6;
  }

  .table-container {
    margin: 40px auto;
    background-color: #f5f5f5;
    border-radius: 6px;
    padding: 10px;
  }

  .modal-backdrop {
    display: none;
  }

  /* Clickable product name styling */
  .product-name-link {
    color: #00948B;
    cursor: pointer;
    text-decoration: underline;
    transition: opacity 0.2s;
  }

  .product-name-link:hover {
    opacity: 0.7;
  }
</style>
