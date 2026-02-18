<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';

const route = useRoute();
const router = useRouter();
const showError = ref(false);
const errorMessage = ref('');
const isUpdating = ref(false);

const closeError = () => {
  showError.value = false;
};

const showAddModal = ref(false)
const formError = ref('')

// Form data for editing company info
const editForm = ref({
  nev: '',
  adoszam: '',
  euAdoszam: '',
  cim: '',
  email: '',
  telefon: ''
})

const openAddModal = () => {
  // Pre-fill form with current company data
  editForm.value = {
    nev: authStore.ceg.nev,
    adoszam: authStore.ceg.adoszam,
    euAdoszam: authStore.ceg.euAdoszam || '',
    cim: authStore.ceg.cim,
    email: authStore.ceg.email,
    telefon: authStore.ceg.telefon
  }
  formError.value = ''
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  formError.value = ''
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
      elofiz: authStore.ceg.elofiz
    }

    const response = await axios.post('http://localhost:3000/api/Ceg_update', updatedCegData)

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
      elofiz: 1 // Send boolean true instead of 1
    };

    const response = await axios.post('http://localhost:3000/api/Ceg_update', updatedCegData);

    if (response.data.ok) {
      // Update the local auth store
      const updatedCeg = { ...authStore.ceg, elofiz: 1 };
      setAuthState(authStore.user, updatedCeg);
      
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
      elofiz: 0 // Send boolean false instead of 0
    };

    const response = await axios.post('http://localhost:3000/api/Ceg_update', updatedCegData);

    if (response.data.ok) {
      // Update the local auth store
      const updatedCeg = { ...authStore.ceg, elofiz: 0 };
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
        <h2 class="me-3 mb-0">Felhasználói adatok</h2>
      </div>
    </div>
    <p>Felhasználónév: {{ authStore.user.nev }}</p>
    <p>Telefonszám: {{ authStore.user.telefon }}</p>
    <div class="mb-3">
      <strong>Jogosultságok:</strong>
      <ul class="mt-2">
        <li v-if="isAdmin()" class="text-primary">
          Teljes hozzáférés
        </li>
        <li v-if="authStore.user.jogkor?.rendeles_osszkesz">
          Rendelés összekészítése
        </li>
        <li v-if="authStore.user.jogkor?.rendeles_lead">
          Rendelés leadása
        </li>
        <li v-if="authStore.user.jogkor?.szamla_keszit">
          Számla készítése
        </li>
        <li v-if="authStore.user.jogkor?.raktar_kezel">
          Raktár kezelése
        </li>
      </ul>
    </div>
    <p>Telephely címe: {{ authStore.user.telephely_cim }}</p>
    <p>Cég neve: {{ authStore.ceg.nev }}</p>
    <p>Adószám: {{ authStore.ceg.adoszam }}</p>
    
    <!-- Error Alert -->
    <div
      v-if="showError"
      class="alert alert-danger d-flex justify-content-between align-items-center mb-4"
      role="alert"
    >
      <span>{{ errorMessage }}</span>
      <button type="button" class="btn-close" aria-label="Bezárás" @click="closeError"></button>
    </div>
    

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
              <form @submit.prevent="saveCompanyData">
                <div class="mb-3">
                  <label class="form-label">Felhasználónév</label>
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
              <button type="button" class="btn btn-primary btn-teal rounded-pill" @click="saveCompanyData">
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
