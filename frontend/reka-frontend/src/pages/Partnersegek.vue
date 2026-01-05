<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from 'axios'
  import authStore from '../stores/auth'

  // Eladói partnerségek (seller partnerships) list
  const sellerItems = ref([])

  // Vevői partnerségek (buyer partnerships) list
  const buyerItems = ref([])

  const loading = ref(false)
  const error = ref('')

  const sellerSearch = ref('')
  const buyerSearch = ref('')

  const filteredSellerItems = computed(() =>
    sellerItems.value.filter((item) =>
      item.nev.toLowerCase().includes(sellerSearch.value.toLowerCase())
    )
  )

  const filteredBuyerItems = computed(() =>
    buyerItems.value.filter((item) =>
      item.nev.toLowerCase().includes(buyerSearch.value.toLowerCase())
    )
  )

  // Fetch partnerships from backend
  const fetchPartnerships = async () => {
    loading.value = true
    error.value = ''

    try {
      // Get ceg_id from authStore
      const cegId = authStore.ceg.id

      if (!cegId) {
        error.value = 'Nincs bejelentkezve vagy hiányzik a cég azonosító'
        loading.value = false
        return
      }

      // Fetch seller partnerships (where we are the buyer)
      const sellerResponse = await axios.post('http://localhost:3000/api/Partnerek_en_elado', {
        id: cegId
      })

      if (sellerResponse.data.ok) {
        // Map backend data to frontend structure
        sellerItems.value = sellerResponse.data.partnerek.map(partner => ({
          id: partner.id,
          nev: partner.nev,
          kiszereles: partner.fizetesi_forma,
          mennyiseg: partner.fizetesi_ido
        }))
      } else {
        // If no seller partnerships found, set empty array
        sellerItems.value = []
      }

      // Fetch buyer partnerships (where we are the seller)
      const buyerResponse = await axios.post('http://localhost:3000/api/Partnerek_en_vevo', {
        id: cegId
      })

      if (buyerResponse.data.ok) {
        // Map backend data to frontend structure
        buyerItems.value = buyerResponse.data.partnerek.map(partner => ({
          id: partner.id,
          nev: partner.nev,
          kiszereles: partner.fizetesi_forma,
          mennyiseg: partner.fizetesi_ido
        }))
      } else {
        // If no buyer partnerships found, set empty array
        buyerItems.value = []
      }

    } catch (err) {
      console.error('Hiba a partnerségek lekérdezése során:', err)
      error.value = 'Hiba történt az adatok betöltése során'
    } finally {
      loading.value = false
    }
  }

  // Fetch data on component mount
  onMounted(() => {
    fetchPartnerships()
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
    <!-- Eladói partnerségek section -->
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">Eladói partnerségek</h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="sellerSearch"
            type="text"
            class="form-control custom-search rounded-5"
            placeholder="Keresés"
          />
        </div>
      </div>

      <button
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="openAddModal"
      >
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-none d-md-none d-lg-inline ms-2">Új eladói partnerség felvétele</span>
      </button>
    </div>

    <!-- Eladói partnerségek table -->
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
          <th style="width: 45%;">Partner neve</th>
          <th style="width: 33%;">Fizetési mód</th>
          <th class="text-end" style="width: 17%;">Fizetési idő</th>
          <th style="width: 2.5%;"></th>
          <th style="width: 2.5%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredSellerItems.length === 0">
          <td colspan="5" class="text-center">Nincs megjeleníthető eladói partner</td>
        </tr>
        <tr v-for="(item, index) in filteredSellerItems" :key="item.id || index">
          <td>{{ item.nev }}</td>
          <td>{{ item.kiszereles }}</td>
          <td class="text-end">{{ item.mennyiseg }} nap</td>
          <td><i class="bi bi-pencil" @click="edit(item)"/></td>
          <td><i class="bi bi-trash" @click="remove(item)"/></td>
        </tr>
      </tbody>
    </table>

    <!-- Add partnership modal -->
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
              <h5 class="modal-title">Új eladói partnerség felvétele</h5>
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
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeAddModal">
                Mégse
              </button>
              <button type="button" class="btn btn-primary rounded-pill" @click="closeAddModal">
                Mentés
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <br>
    <!-- Vevői partnerségek section -->
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">Vevői partnerségek</h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="buyerSearch"
            type="text"
            class="form-control custom-search rounded-5"
            placeholder="Keresés"
          />
        </div>
      </div>
    </div>

    <!-- Vevői partnerségek table -->
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
          <th style="width: 45%;">Partner neve</th>
          <th style="width: 33%;">Fizetési mód</th>
          <th class="text-end" style="width: 17%;">Fizetési idő</th>
          <th style="width: 2.5%;"></th>
          <th style="width: 2.5%;"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredBuyerItems.length === 0">
          <td colspan="5" class="text-center">Nincs megjeleníthető vevői partner</td>
        </tr>
        <tr v-for="(item, index) in filteredBuyerItems" :key="item.id || index">
          <td>{{ item.nev }}</td>
          <td>{{ item.kiszereles }}</td>
          <td class="text-end">{{ item.mennyiseg }} nap</td>
          <td><i class="bi bi-pencil" @click="edit(item)"/></td>
          <td><i class="bi bi-trash" @click="remove(item)"/></td>
        </tr>
      </tbody>
    </table>
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
