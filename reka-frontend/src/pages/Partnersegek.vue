<script setup>
  import { ref, computed, onMounted } from 'vue'
  import axios from '../axios.js'
  import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
  import Icons from '../components/Icons.vue';

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

  // Check if company has subscription
  const hasSubscription = computed(() => {
    return authStore.ceg?.elofiz === true || authStore.ceg?.elofiz === 1
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
    // Check if company has subscription
    if (!hasSubscription.value) {
      return
    }
    
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
        <h2 class="me-3 mb-0" data-test="seller-partnerships-title">Eladói partnerségek</h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="sellerSearch"
            type="text"
            class="form-control custom-search rounded-5"
            placeholder="Keresés"
            data-test="seller-search-input"
          />
        </div>
      </div>

      <button
        v-if="hasSubscription && hasPermission('szamla_keszit')"
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="openAddModal"
        data-test="add-seller-partnership-btn"
      >
        <Icons name="plus" size="1.5rem"/>
        <span class="d-none d-sm-none d-md-none d-lg-inline ms-2">Új eladói partnerség felvétele</span>
      </button>
    </div>

    <!-- Eladói partnerségek table -->
    <div v-if="sellerLoading" class="text-center my-4" data-test="seller-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="sellerError" class="alert alert-warning" role="alert" data-test="seller-error">
      {{ sellerError }}
    </div>

    <table v-else class="table custom-table" style="border-bottom: 1px solid black;" data-test="seller-partnerships-table">
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
        <tr v-if="filteredSellerItems.length === 0" data-test="seller-no-items">
          <td colspan="5" class="text-center">Nincs megjeleníthető eladói partner</td>
        </tr>
        <tr v-for="(item, index) in filteredSellerItems" :key="item.id || index" :data-test="`seller-item-${index}`">
          <td data-test="seller-item-name">{{ item.nev }}</td>
          <td data-test="seller-item-payment-method">{{ item.kiszereles }}</td>
          <td class="text-end" data-test="seller-item-payment-time">{{ item.mennyiseg === 0 ? 'Azonnali' : `${item.mennyiseg} nap` }}</td>
          <td>
            <span class="action-icon" title="Szerkesztés">
              <Icons name="pencil" size="1.25rem" />
            </span>
          </td>
          <td>
            <span class="action-icon trash-icon" title="Törlés">
              <Icons name="trash" size="1.25rem" />
            </span>
          </td>
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
        data-test="add-partnership-modal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title" data-test="modal-title">Új eladói partnerség felvétele</h5>
              <button type="button" class="btn-close" @click="closeAddModal" data-test="modal-close-btn"></button>
            </div>
            <div class="modal-body">
              <div v-if="addModalError" class="alert alert-danger" role="alert" data-test="modal-error">
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
                    data-test="vat-number-input"
                  />
                  <small v-if="searchingCompany" class="form-text text-muted" data-test="company-searching">
                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                    Cég keresése...
                  </small>
                  <small v-else-if="foundCompanyName" class="form-text text-success" data-test="company-found">
                    <i class="bi bi-check-circle-fill me-1"></i>
                    {{ foundCompanyName }}
                  </small>
                  <small v-else-if="newPartnership.vatNumber.length === 11 && !foundCompanyName" class="form-text text-danger" data-test="company-not-found">
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
                    data-test="payment-method-select"
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
                    data-test="payment-time-input"
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
                data-test="modal-cancel-btn"
              >
                Mégse
              </button>
              <button 
                type="button" 
                class="btn btn-primary btn-teal rounded-pill" 
                @click="saveNewPartnership"
                :disabled="addModalLoading"
                data-test="modal-save-btn"
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
        <h2 class="me-3 mb-0" data-test="buyer-partnerships-title">Vevői partnerségek</h2>

        <div class="input-group" style="width: clamp(100px, 40vw, 300px);">
          <input
            v-model="buyerSearch"
            type="text"
            class="form-control custom-search rounded-5"
            placeholder="Keresés"
            data-test="buyer-search-input"
          />
        </div>
      </div>
    </div>

    <!-- Vevői partnerségek table -->
    <div v-if="buyerLoading" class="text-center my-4" data-test="buyer-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <div v-else-if="buyerError" class="alert alert-warning" role="alert" data-test="buyer-error">
      {{ buyerError }}
    </div>

    <table v-else class="table custom-table" style="border-bottom: 1px solid black;" data-test="buyer-partnerships-table">
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
        <tr v-if="filteredBuyerItems.length === 0" data-test="buyer-no-items">
          <td colspan="5" class="text-center">Nincs megjeleníthető vevői partner</td>
        </tr>
        <tr v-for="(item, index) in filteredBuyerItems" :key="item.id || index" :data-test="`buyer-item-${index}`">
          <td data-test="buyer-item-name">{{ item.nev }}</td>
          <td data-test="buyer-item-payment-method">{{ item.kiszereles }}</td>
          <td class="text-end" data-test="buyer-item-payment-time">{{ item.mennyiseg === 0 ? 'Azonnali' : `${item.mennyiseg} nap` }}</td>
          <td>
            <span class="action-icon" title="Szerkesztés">
              <Icons name="pencil" size="1.25rem" />
            </span>
          </td>
          <td>
            <span class="action-icon trash-icon" title="Törlés">
              <Icons name="trash" size="1.25rem" />
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
  /* Page-specific styles only - common styles moved to global.css */

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

  .table-container {
    margin: 40px auto;
    background-color: #f5f5f5;
    border-radius: 6px;
    padding: 10px;
  }

  .modal-backdrop {
    display: none;
  }
</style>
