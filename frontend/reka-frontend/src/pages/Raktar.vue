<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'
  import authStore from '../stores/auth'

  // product list from database
  const items = ref([])
  const loading = ref(false)
  const error = ref('')

  const search = ref('')

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

  // Load products on component mount
  onMounted(() => {
    fetchProducts()
  })

  const edit = (item) => {
    console.log('Edit:', item)
  }

  const remove = (item) => {
    console.log('Delete:', item)
  }

  // Modal state and form model for new product
  const showAddModal = ref(false)
  const newProduct = ref({
    name: '',
    stock: 0,
    kiszereles: '',
    category: '',
  })

  // Category options
  const categories = ref([
    'Üdítők',
    'Ásványvizek',
    'Élelmiszerek'
  ])

  const openAddModal = () => {
    newProduct.value = { name: '', stock: 0, kiszereles: '', category: '' }
    showAddModal.value = true
  }

  const closeAddModal = () => {
    showAddModal.value = false
  }

  const saveNewProduct = () => {
    if (!newProduct.value.name) return
    items.value.push({
      name: newProduct.value.name,
      stock: Number(newProduct.value.stock) || 0,
      kiszereles: newProduct.value.kiszereles,
    })
    closeAddModal()
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
            class="form-control custom-search rounded-5"
            placeholder="Keresés"
          />
        </div>
      </div>

      <button
        class="btn btn-success add-btn rounded-5 d-flex align-items-center"
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
          <th style="width: 23%;">Kiszerelés</th>
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
          <td>{{ item.kiszereles }}</td>
          <td class="text-end">{{ item.mennyiseg }}</td>
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
              <h4>A funkció fejlesztés alatt áll...</h4>
            </div>
            <!-- 
            <div class="modal-body">
              <form @submit.prevent="saveNewProduct">
                <div class="mb-3">
                  <label class="form-label">Terméknév</label>
                  <input
                    v-model="newProduct.name"
                    type="text"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Készlet (db)</label>
                  <input
                    v-model.number="newProduct.stock"
                    type="number"
                    min="0"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Cikkszám</label>
                  <input
                    type="text"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kiszerelése</label>
                  <input
                    v-model="newProduct.kiszereles"
                    type="text"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Minimum vásárlási mennyiség</label>
                  <input
                    type="number"
                    min="1"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék leírása</label>
                  <input
                    type="text"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Ár (magyar forint, nettó)</label>
                  <input
                    type="number"
                    min="1"
                    class="form-control"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Termék kategóriája</label>
                  <select
                    v-model="newProduct.category"
                    class="form-select"
                    required
                  >
                    <option value="" disabled>Válasszon kategóriát...</option>
                    <option v-for="category in categories" :key="category" :value="category">
                      {{ category }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Áfakulcs</label>
                  <input
                    type="number"
                    min="0"
                    class="form-control"
                    required
                  />
                </div>
              </form>
            </div>
            -->
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeAddModal">
                Mégse
              </button>
              <button type="button" class="btn btn-primary" @click="closeAddModal">
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

  .custom-search {
    border: 2px solid #ccc;
    background-color: white;
    outline: none;
    transition: border-color 0.2s;
  }

  .custom-search:focus {
    border-color: #00948B;
    background-color: white;
    box-shadow: none;
  }

  .modal-backdrop {
    display: none;
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
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .modal-fade-enter-to,
  .modal-fade-leave-from {
    opacity: 1;
    transform: scale(1);
  }

  /* Space between footer buttons */
  .custom-modal-content .modal-footer .btn + .btn {
    margin-left: 0.5rem;
  }
</style>
