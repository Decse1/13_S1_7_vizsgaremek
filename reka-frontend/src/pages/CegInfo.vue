<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '../axios.js';
import authStore, { setAuthState } from '../stores/auth.js';

const route = useRoute();
const router = useRouter();
const showError = ref(false);
const errorMessage = ref('');
const isUpdating = ref(false);

// add computed text for elofiz: explicit checks for 1/'1' -> yes, 0/'0' -> no
const elofizText = computed(() => {
  const v = authStore?.ceg?.elofiz;
  if (v === 1 || v === '1') return 'igen';
  if (v === 0 || v === '0') return 'nem';
  return 'no';
});

const goToUsers = (cegId) => {
  router.push(`/ceginfo/felhasznalok`);
};

const closeError = () => {
  showError.value = false;
};

const showAddModal = ref(false)
const formError = ref('')
const szamla_minta = ref('')
const isLoadingCegadat = ref(false)

// Form data for editing company info
const editForm = ref({
  nev: '',
  adoszam: '',
  euAdoszam: '',
  cim: '',
  email: '',
  telefon: '',
  szamlaszam: ''
})

const openAddModal = () => {
  // Pre-fill form with current company data
  editForm.value = {
    nev: authStore.ceg.nev,
    adoszam: authStore.ceg.adoszam,
    euAdoszam: authStore.ceg.euAdoszam || '',
    cim: authStore.ceg.cim,
    email: authStore.ceg.email,
    telefon: authStore.ceg.telefon,
    szamlaszam: authStore.ceg.szamlaszam
  }
  formError.value = ''
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  formError.value = ''
}

const fetchCegadatAPI = async () => {
  // Validate VAT number length
  if (!editForm.value.adoszam || editForm.value.adoszam.length !== 11) {
    formError.value = 'Az adószámnak pontosan 11 karakter hosszúnak kell lennie!'
    return
  }

  isLoadingCegadat.value = true
  formError.value = ''

  try {
    // Step 1: Search for VAT number in CégadatAPI
    const searchResponse = await axios.post('/search/vat', {
      vatNumber: editForm.value.adoszam
    })

    if (!searchResponse.data || searchResponse.data.length === 0) {
      formError.value = 'Az adószám nem található a CégadatAPI adatbázisában!'
      isLoadingCegadat.value = false
      return
    }

    // Get the company VAT number from search results (using it as ID)
    const vatNumber = searchResponse.data[0].vatNumber

    // Step 2: Get detailed company information
    const detailResponse = await axios.post('/detail', {
      adoszam: vatNumber
    })

    if (detailResponse.data) {
      const company = detailResponse.data

      // Fill the form with the received data based on actual API response structure
      editForm.value.nev = company.shortName || company.fullName || editForm.value.nev
      editForm.value.cim = company.fullAddress || editForm.value.cim
      
      // Fill email and phone if they exist in the API response
      if (company.emailAddress && company.emailAddress.trim() !== '') {
        editForm.value.email = company.emailAddress
      }
      
      if (company.phoneNumber && company.phoneNumber.trim() !== '') {
        editForm.value.telefon = company.phoneNumber
      }
      
      // Note: CégadatAPI doesn't provide EU VAT number in the standard response
      
      formError.value = ''
    } else {
      formError.value = 'Nem sikerült lekérni a cég részletes adatait!'
    }
  } catch (error) {
    console.error('CégadatAPI error:', error)
    formError.value = error.response?.data?.error || 'Hiba történt a CégadatAPI lekérdezése során!'
  } finally {
    isLoadingCegadat.value = false
  }
}

const saveCompanyData = async () => {
  try {
    const updatedCegData = {
      id: authStore.ceg.id,
      nev: editForm.value.nev,
      adoszam: editForm.value.adoszam,
      euAdoszam: editForm.value.euAdoszam,
      cim: editForm.value.cim,
      email: editForm.value.email,
      telefon: editForm.value.telefon,
      elofiz: authStore.ceg.elofiz,
      szamlaszam: editForm.value.szamlaszam
    }

    const response = await axios.post('/Ceg_update', updatedCegData)

    if (response.data.ok) {
      // Update the local auth store
      const updatedCeg = { ...authStore.ceg, ...updatedCegData }
      setAuthState(authStore.user, updatedCeg)
      closeAddModal()
      // Refresh the page to show updated data
      router.go(0)
    } else {
      formError.value = response.data.uzenet || 'Hiba történt a mentés során!'
    }
  } catch (error) {
    console.error('Save company data error:', error)
    formError.value = error.response?.data?.uzenet || error.response?.data?.error || 'Nem sikerült kapcsolódni a szerverhez!'
  }
}

const activateReka = async () => {
  // Validate szamla_minta before proceeding
  if (!szamla_minta.value || szamla_minta.value.trim() === '') {
    errorMessage.value = 'A számla minta megadása kötelező az előfizetés aktiválásához!';
    showError.value = true;
    return;
  }

  isUpdating.value = true;
  showError.value = false;

  try {
    const updatedCegData = {
      id: authStore.ceg.id,
      nev: authStore.ceg.nev,
      adoszam: authStore.ceg.adoszam,
      euAdoszam: authStore.ceg.euAdoszam,
      cim: authStore.ceg.cim,
      email: authStore.ceg.email,
      telefon: authStore.ceg.telefon,
      elofiz: 1, // Send boolean true instead of 1
      szamla_minta: szamla_minta.value,
      szamlaszam: authStore.ceg.szamlaszam
    };

    const response = await axios.post('/Ceg_update', updatedCegData);

    if (response.data.ok) {
      // Update the local auth store
      const updatedCeg = { ...authStore.ceg, elofiz: 1, szamla_minta: szamla_minta.value };
      setAuthState(authStore.user, updatedCeg);
      
      // Clear the input field
      szamla_minta.value = '';
      
      // Refresh the page to show updated data
      router.go(0);
    } else {
      errorMessage.value = response.data.uzenet || 'Hiba történt az előfizetés aktiválása során!';
      showError.value = true;
    }
  } catch (error) {
    console.error('Activate REKA error:', error);
    errorMessage.value = error.response?.data?.uzenet || error.response?.data?.error || 'Nem sikerült kapcsolódni a szerverhez!';
    showError.value = true;
  } finally {
    isUpdating.value = false;
  }
};

const deactivateReka = async () => {
  isUpdating.value = true;
  showError.value = false;

  try {
    const updatedCegData = {
      id: authStore.ceg.id,
      nev: authStore.ceg.nev,
      adoszam: authStore.ceg.adoszam,
      euAdoszam: authStore.ceg.euAdoszam,
      cim: authStore.ceg.cim,
      email: authStore.ceg.email,
      telefon: authStore.ceg.telefon,
      elofiz: 0, // Send boolean false instead of 0
      szamla_minta: "-",
      szamlaszam: authStore.ceg.szamlaszam
    };

    const response = await axios.post('/Ceg_update', updatedCegData);

    if (response.data.ok) {
      // Update the local auth store
      const updatedCeg = { ...authStore.ceg, elofiz: 0, szamla_minta: "-" };
      setAuthState(authStore.user, updatedCeg);
      
      // Refresh the page to show updated data
      router.go(0);
    } else {
      errorMessage.value = response.data.uzenet || 'Hiba történt az előfizetés deaktiválása során!';
      showError.value = true;
    }
  } catch (error) {
    console.error('Deactivate REKA error:', error);
    errorMessage.value = error.response?.data?.uzenet || error.response?.data?.error || 'Nem sikerült kapcsolódni a szerverhez!';
    showError.value = true;
  } finally {
    isUpdating.value = false;
  }
};
</script>

<template>
  <div class="content">
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">Cégadatok</h2>
      </div>

      <button
        v-if="authStore.user.kategoria == 1"
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="openAddModal"
      >
        <i class="bi bi-pencil"></i>
        <span class="d-none d-sm-inline ms-2">Cégadatok módosítása</span>
      </button>
    </div>
    <p>Cég azonosítója: {{ authStore.ceg.id }}</p>
    <p>Cég neve: {{ authStore.ceg.nev }}</p>
    <p>Adószám: {{ authStore.ceg.adoszam }}</p>
    <p>Adószám (EU): {{ authStore.ceg.euAdoszam || "nincsen megadva"}}</p>
    <p>Székhely: {{ authStore.ceg.cim }}</p>
    <p>Email: {{ authStore.ceg.email }}</p>
    <p>Telefonszám: {{ authStore.ceg.telefon }}</p>
    <p>Számlaszám: {{ authStore.ceg.szamlaszam }}</p>
    <button
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="goToUsers"
      >
        <span class="d-none d-sm-inline">Felhasználók</span>
    </button>

    <h2>Előfizetés állapota</h2>
    <p>Előfizet-e a RÉKA vállalatirányítási rendszerére: {{ elofizText }}</p>
    
    
    <!-- Error Alert -->
    <div
      v-if="showError"
      class="alert alert-danger d-flex justify-content-between align-items-center mb-4"
      role="alert"
    >
      <span>{{ errorMessage }}</span>
      <button type="button" class="btn-close" aria-label="Bezárás" @click="closeError"></button>
    </div>
    
    <!-- Számla minta input for subscription activation -->
    <div v-if="authStore.ceg.elofiz == 0 && authStore.user.kategoria == 1" class="mb-3">
      <label class="form-label fw-bold">Számla minta (előfizetés aktiválásához szükséges)</label>
      <input
        v-model="szamla_minta"
        type="text"
        class="form-control custom-input"
        placeholder="Adja meg a számla mintát"
        required
        maxlength="15"
      />
    </div>

    <button v-if="authStore.ceg.elofiz == 0 && authStore.user.kategoria == 1"
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="activateReka"
        :disabled="isUpdating"
      >
        <span v-if="isUpdating" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span class="d-none d-sm-none d-md-none d-lg-inline">
          {{ isUpdating ? 'Frissítés...' : 'RÉKA-előfizetés bekapcsolása' }}
        </span>
    </button>
    <button v-if="authStore.ceg.elofiz == 1 && authStore.user.kategoria == 1"
        class="btn btn-danger add-btn rounded-5 d-flex align-items-center"
        @click="deactivateReka"
        :disabled="isUpdating"
      >
        <span v-if="isUpdating" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        <span class="d-none d-sm-none d-md-none d-lg-inline">
          {{ isUpdating ? 'Frissítés...' : 'RÉKA-előfizetés kikapcsolása' }}
        </span>
    </button>
    <br v-if="authStore.ceg.elofiz == 1 && authStore.user.kategoria == 1">
    <p v-if="authStore.ceg.elofiz == 1 && authStore.user.kategoria == 1">Számla minta: {{ authStore.ceg.szamla_minta }}</p>

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
              <h5 class="modal-title">Cég adatainak módosítása</h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
            </div> 
            <div class="modal-body">
              <form @submit.prevent="saveCompanyData" id="companyEditForm">
                <div class="mb-3">
                  <label class="form-label">Cég neve</label>
                  <input
                    v-model="editForm.nev"
                    type="text"
                    class="form-control custom-input"
                    required
                    maxlength="100"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Adószám</label>
                  <input
                    v-model="editForm.adoszam"
                    type="text"
                    class="form-control custom-input"
                    required
                    maxlength="11"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Adószám (EU)</label>
                  <input
                    v-model="editForm.euAdoszam"
                    type="text"
                    class="form-control custom-input"
                    placeholder="Opcionális"
                    maxlength="20"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Székhely</label>
                  <input
                    v-model="editForm.cim"
                    type="text"
                    class="form-control custom-input"
                    required
                    maxlength="255"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input
                    v-model="editForm.email"
                    type="email"
                    class="form-control custom-input"
                    required
                    maxlength="100"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Telefonszám</label>
                  <input
                    v-model="editForm.telefon"
                    type="tel"
                    class="form-control custom-input"
                    required
                    maxlength="15"
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Számlaszám</label>
                  <input
                    v-model="editForm.szamlaszam"
                    type="text"
                    class="form-control custom-input"
                    required
                    maxlength="26"
                    placeholder="pl. 11700002-20000001-00000001"
                  />
                </div>
                <!-- Error message display -->
                <div v-if="formError" class="alert alert-danger mt-3 mb-0" role="alert">
                  <i class="bi bi-exclamation-triangle-fill me-2"></i>{{ formError }}
                </div>
              </form>
            </div>            
            <div class="modal-footer">
              <button 
                type="button" 
                class="btn btn-secondary rounded-pill" 
                @click="fetchCegadatAPI"
                :disabled="isLoadingCegadat"
              >
                <span v-if="isLoadingCegadat" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isLoadingCegadat ? 'Keresés...' : 'Adatok ellenőrzése (CégadatAPI)' }}
              </button>
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeAddModal">
                Mégse
              </button>
              <button type="submit" form="companyEditForm" class="btn btn-primary btn-teal rounded-pill">
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

  body {
    background-color: lightgray(--bs-body-bg);;
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
