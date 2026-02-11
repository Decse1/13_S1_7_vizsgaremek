<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from '../axios.js'
  import authStore from '../stores/auth'

  //Teljesen megadott adószám esetén megjeleníteni a cég nevét a mező alatt
  //Partnerség felvételéhez majd integrálni a CégadatAPI-t
  
  // Eladói partnerségek (seller partnerships) list
  const sellerItems = ref([])

  // Vevői partnerségek (buyer partnerships) list
  const buyerItems = ref([])

  const sellerLoading = ref(false)
  const buyerLoading = ref(false)
  const sellerError = ref('')
  const buyerError = ref('')

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
    sellerLoading.value = true
    buyerLoading.value = true
    sellerError.value = ''
    buyerError.value = ''

    // Get ceg_id from authStore
    const cegId = authStore.ceg?.id

    if (!cegId) {
      sellerError.value = 'Nincs bejelentkezve vagy hiányzik a cég azonosító'
      buyerError.value = 'Nincs bejelentkezve vagy hiányzik a cég azonosító'
      sellerLoading.value = false
      buyerLoading.value = false
      return
    }

    // Fetch seller partnerships (where we are the buyer)
    try {
      const sellerResponse = await axios.post('/Partnerek_en_elado', {
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
    } catch (err) {
      console.error('Hiba az eladói partnerségek lekérdezése során:', err)
      sellerError.value = err.response?.data?.uzenet || 'Hiba történt az eladói partnerségek betöltése során'
      sellerItems.value = []
    } finally {
      sellerLoading.value = false
    }

    // Fetch buyer partnerships (where we are the seller)
    try {
      const buyerResponse = await axios.post('/Partnerek_en_vevo', {
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
      console.error('Hiba a vevői partnerségek lekérdezése során:', err)
      buyerError.value = err.response?.data?.uzenet || 'Hiba történt a vevői partnerségek betöltése során'
      buyerItems.value = []
    } finally {
      buyerLoading.value = false
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

  // Modal state and form model for new seller partnership
  const showAddModal = ref(false)
  const newPartnership = ref({
    vatNumber: '',
    paymentTime: 30,
    paymentMethod: 'Átutalás',
  })

  const addModalError = ref('')
  const addModalLoading = ref(false)
  const foundCompanyName = ref('')
  const searchingCompany = ref(false)

  // Payment method options
  const paymentMethods = ref([
    'Átutalás',
    'Készpénz',
    'Bankkártya'
  ])

  const openAddModal = () => {
    newPartnership.value = { vatNumber: '', paymentTime: 30, paymentMethod: 'Átutalás' }
    addModalError.value = ''
    addModalLoading.value = false
    foundCompanyName.value = ''
    searchingCompany.value = false
    showAddModal.value = true
  }

  const closeAddModal = () => {
    showAddModal.value = false
    addModalError.value = ''
    foundCompanyName.value = ''
  }

  // Search for company by VAT number when 11 characters are entered
  const handleVatNumberInput = async () => {
    foundCompanyName.value = ''
    
    // Only search if exactly 11 characters
    if (newPartnership.value.vatNumber.length !== 11) {
      return
    }

    searchingCompany.value = true

    try {
      const companiesResponse = await axios.get('/Ceg_osszes')
      
      if (companiesResponse.data.ok) {
        const company = companiesResponse.data.cegek.find(
          ceg => ceg.adoszam === newPartnership.value.vatNumber
        )

        if (company) {
          foundCompanyName.value = company.nev
        }
      }
    } catch (err) {
      console.error('Hiba a cég keresése során:', err)
    } finally {
      searchingCompany.value = false
    }
  }

  // Watch for payment method changes to set payment time to 0 for cash
  const handlePaymentMethodChange = () => {
    if (newPartnership.value.paymentMethod === 'Készpénz') {
      newPartnership.value.paymentTime = 0
    }
  }

  const saveNewPartnership = async () => {
    addModalError.value = ''
    addModalLoading.value = true

    // Get current company info
    const currentCompany = authStore.ceg
    if (!currentCompany || !currentCompany.id || !currentCompany.adoszam) {
      addModalError.value = 'Hiányzó bejelentkezési adatok'
      addModalLoading.value = false
      return
    }

    // Validate form fields
    if (!newPartnership.value.vatNumber || 
        newPartnership.value.paymentTime === null || 
        newPartnership.value.paymentTime === undefined || 
        newPartnership.value.paymentTime === '' ||
        !newPartnership.value.paymentMethod) {
      addModalError.value = 'Minden mező kitöltése kötelező'
      addModalLoading.value = false
      return
    }

    // Step 1: Check if vat number is the same as logged in user's company
    if (newPartnership.value.vatNumber === currentCompany.adoszam) {
      addModalError.value = 'Nem lehet saját magával partnerséget létrehozni'
      addModalLoading.value = false
      return
    }

    try {
      // Step 2: Check if the vat number exists in the database
      const companiesResponse = await axios.get('/Ceg_osszes')
      if (!companiesResponse.data.ok) {
        addModalError.value = 'Hiba a cégek lekérdezése során'
        addModalLoading.value = false
        return
      }

      const otherCompany = companiesResponse.data.cegek.find(
        ceg => ceg.adoszam === newPartnership.value.vatNumber
      )

      if (!otherCompany) {
        addModalError.value = 'A megadott adószámú cég nem található az adatbázisban'
        addModalLoading.value = false
        return
      }

      // Step 3: Check if the seller partnership already exists
      let partnershipExists = false
      try {
        const existingPartnershipsResponse = await axios.post('/Partnerek_en_elado', {
          id: currentCompany.id
        })

        if (existingPartnershipsResponse.data.ok) {
          const existingPartnership = existingPartnershipsResponse.data.partnerek.find(
            partner => partner.cId === otherCompany.id
          )

          if (existingPartnership) {
            partnershipExists = true
          }
        }
      } catch (err) {
        // If 404, it means no partnerships exist yet - this is OK, continue
        if (err.response?.status !== 404) {
          // For other errors, throw to outer catch
          throw err
        }
        // If 404, partnershipExists remains false, continue to step 4
      }

      if (partnershipExists) {
        addModalError.value = 'Ezzel a céggel már létezik eladói partnerség'
        addModalLoading.value = false
        return
      }

      // Step 4: Add the new seller partnership
      const addResponse = await axios.post('/Partnerek_ad', {
        eladoId: currentCompany.id,
        vevoId: otherCompany.id,
        fiz_ido: newPartnership.value.paymentTime,
        fiz_forma: newPartnership.value.paymentMethod
      })

      if (addResponse.data.ok) {
        // Success - refresh the partnerships list
        await fetchPartnerships()
        closeAddModal()
      } else {
        addModalError.value = addResponse.data.uzenet || 'Hiba történt a partnerség hozzáadása során'
      }
    } catch (err) {
      console.error('Hiba a partnerség hozzáadása során:', err)
      addModalError.value = err.response?.data?.uzenet || 'Hiba történt a partnerség hozzáadása során'
    } finally {
      addModalLoading.value = false
    }
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
        <Icons name="plus" size="1.5rem"/>
        <span class="d-none d-sm-none d-md-none d-lg-inline ms-2">Új eladói partnerség felvétele</span>
      </button>
    </div>

    <!-- Eladói partnerségek table -->
    <div v-if="sellerLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="sellerError" class="alert alert-warning" role="alert">
      {{ sellerError }}
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
          <td class="text-end">{{ item.mennyiseg === 0 ? 'Azonnali' : `${item.mennyiseg} nap` }}</td>
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
              <div v-if="addModalError" class="alert alert-danger" role="alert">
                {{ addModalError }}
              </div>
              
              <form @submit.prevent="saveNewPartnership">
                <div class="mb-3">
                  <label class="form-label">Partner adószáma *</label>
                  <input
                    v-model="newPartnership.vatNumber"
                    type="text"
                    class="form-control"
                    placeholder="Pl.: 12345678-1-23"
                    required
                    maxlength="11"
                    :disabled="addModalLoading"
                    @input="handleVatNumberInput"
                  />
                  <small v-if="searchingCompany" class="form-text text-muted">
                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Cég keresése...
                  </small>
                  <small v-else-if="foundCompanyName" class="form-text text-success">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    {{ foundCompanyName }}
                  </small>
                  <small v-else-if="newPartnership.vatNumber.length === 11 && !foundCompanyName" class="form-text text-danger">
                    <i class="bi bi-x-circle-fill me-1"></i>
                    A megadott adószámú cég nem található
                  </small>
                  <small v-else class="form-text text-muted">
                    Adja meg a partner cég adószámát
                  </small>
                </div>
                <div class="mb-3">
                  <label class="form-label">Fizetési mód *</label>
                  <select
                    v-model="newPartnership.paymentMethod"
                    class="form-select"
                    required
                    :disabled="addModalLoading"
                    @change="handlePaymentMethodChange"
                  >
                    <option v-for="method in paymentMethods" :key="method" :value="method">
                      {{ method }}
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Fizetési idő (napokban) *</label>
                  <input
                    v-model.number="newPartnership.paymentTime"
                    type="number"
                    min="0"
                    class="form-control"
                    required
                    :disabled="addModalLoading || newPartnership.paymentMethod === 'Készpénz'"
                    :readonly="newPartnership.paymentMethod === 'Készpénz'"
                  />
                  <small class="form-text text-muted">
                    {{ newPartnership.paymentMethod === 'Készpénz' 
                      ? 'Készpénzes fizetés esetén azonnali (0 nap)' 
                      : 'Hány nap áll rendelkezésre a fizetésre' }}
                  </small>
                </div>
              </form>
            </div>
            
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary rounded-pill" 
                @click="closeAddModal"
                :disabled="addModalLoading"
              >
                Mégse
              </button>
              <button 
                type="button" 
                class="btn btn-primary btn-teal rounded-pill" 
                @click="saveNewPartnership"
                :disabled="addModalLoading"
              >
                <span v-if="addModalLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ addModalLoading ? 'Mentés...' : 'Mentés' }}
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
    <div v-if="buyerLoading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="buyerError" class="alert alert-warning" role="alert">
      {{ buyerError }}
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
          <td class="text-end">{{ item.mennyiseg === 0 ? 'Azonnali' : `${item.mennyiseg} nap` }}</td>
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
