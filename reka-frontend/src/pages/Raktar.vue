<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'
  import authStore from '../stores/auth'

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

  // Fetch products from backend
  const fetchProducts = async () => {
    if (!authStore.ceg || !authStore.ceg.id) {
      error.value = 'Nincs bejelentkezve cég!'
      return
    }

    loading.value = true
    error.value = ''

    try {
      const response = await axios.post('http://localhost:3000/api/Raktar', {
        id: authStore.ceg.id
      })

      if (response.data.ok) {
        items.value = response.data.termekek
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
      const response = await axios.post('http://localhost:3000/api/Kategoriak_all', {
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

  const edit = (item) => {
    console.log('Edit:', item)
  }

  const remove = (item) => {
    console.log('Delete:', item)
  }

  // Modal state and form model for new product
  const showAddModal = ref(false)
  const formError = ref('')
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

  const openAddModal = () => {
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
      const response = await axios.post('http://localhost:3000/api/Termek_ad', {
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
        formError.value = response.data.uzenet || 'Hiba történt a termék mentése során'
      }
    } catch (err) {
      console.error('Error saving product:', err)
      formError.value = 'Hiba történt a szerver kapcsolat során!'
    }
  }
</script>

<template>
  <div class="content">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">Raktár</h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="search"
            type="text"
            class="form-control custom-input rounded-5"
            placeholder="Keresés"
          />
        </div>
      </div>

      <button
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="openAddModal"
      >
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-inline ms-2">Új termék felvétele</span>
      </button>
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
          <th style="width: 60%;">Terméknév</th>
          <!-- th style="width: 20%;">Kategória</th -->
          <th style="width: 23%;">Ár (nettó)</th>
          <th class="text-end" style="width: 12%;">Készlet</th>
          <th style="width: 2.5%;"></th>
          <th style="width: 2.5%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredItems.length === 0">
          <td colspan="5" class="text-center">Nincs megjeleníthető termék</td>
        </tr>
        <tr v-for="(item, index) in filteredItems" :key="item.id || index">
          <td>{{ item.nev }}</td>
          <!-- td>asd</td -->
          <td>{{ item.ar }} Ft</td>
          <td class="text-end">{{ item.mennyiseg }} {{ item.kiszereles }}</td>
          <td><i class="bi bi-pencil" @click="edit(item)"/></td>
          <td><i class="bi bi-trash" @click="remove(item)"/></td>
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
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Új termék felvétele</h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
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
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Készlet (db)</label>
                  <input
                    v-model.number="newProduct.stock"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    required
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
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék leírása</label>
                  <input
                    v-model="newProduct.leiras"
                    type="text"
                    class="form-control custom-input"
                    required
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
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kategóriája</label>
                  <select
                    v-model="newProduct.category"
                    class="form-select custom-input"
                    required
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
                    v-model.number="newProduct.afa_kulcs"
                    type="number"
                    min="0"
                    class="form-control custom-input"
                    required
                  />
                </div>
              </form>
              <!-- Error message display -->
              <div v-if="formError" class="alert alert-danger mt-3 mb-0" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ formError }}
              </div>
            </div>            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeAddModal">
                Mégse
              </button>
              <button type="submit" class="btn btn-primary btn-teal rounded-pill" form="product-form">
                Mentés
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

  .bi-pencil {
    color: #000;
    cursor: pointer;
  }

  .bi-trash {
    color: #c00;
    cursor: pointer;
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
