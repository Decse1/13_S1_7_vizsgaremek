<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore from '../stores/auth.js';
import axios from '../axios.js';

// User list from database
const users = ref([]);
const loading = ref(false);
const error = ref('');

const search = ref('');

// Filtered users based on search
const filteredUsers = computed(() =>
  users.value.filter((user) =>
    user.nev.toLowerCase().includes(search.value.toLowerCase())
  )
);

// Fetch users from backend
const fetchUsers = async () => {
  if (!authStore.ceg || !authStore.ceg.id) {
    error.value = 'Nincs bejelentkezve cég!';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await axios.post('/Alkalmazottak', {
      id: authStore.ceg.id
    });

    if (response.data.ok) {
      users.value = response.data.alkalmazottak;
    } else {
      error.value = response?.data?.uzenet || 'Hiba történt a felhasználók betöltése közben';
      users.value = [];
    }
  } catch (err) {
    console.error('Axios error:', err);
    error.value = err.response?.data?.uzenet || 'Hiba történt a szerver kapcsolat során!';
  } finally {
    loading.value = false;
  }
};

// Load users on component mount
onMounted(() => {
  fetchUsers();
});

// Check if current user can add new users (category 1 only)
const canAddUser = computed(() => {
  return authStore.user && authStore.user.kategoria === 1;
});

// Modal state and form for new user
const showAddModal = ref(false);
const formError = ref('');
const newUser = ref({
  nev: '',
  jelszo: '',
  kategoria: 2,
  telephely_cim: '',
  telefon: ''
});

const openAddModal = () => {
  newUser.value = {
    nev: '',
    jelszo: '',
    kategoria: 2,
    telephely_cim: '',
    telefon: ''
  };
  formError.value = '';
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  formError.value = '';
};

const saveNewUser = async () => {
  // Validate form fields
  formError.value = '';

  if (!newUser.value.nev || newUser.value.nev.trim() === '') {
    formError.value = 'A felhasználónév megadása kötelező!';
    return;
  }

  if (!newUser.value.jelszo || newUser.value.jelszo.trim() === '') {
    formError.value = 'A jelszó megadása kötelező!';
    return;
  }

  if (newUser.value.jelszo.length < 6) {
    formError.value = 'A jelszónak legalább 6 karakter hosszúnak kell lennie!';
    return;
  }

  if (!newUser.value.telephely_cim || newUser.value.telephely_cim.trim() === '') {
    formError.value = 'A telephely cím megadása kötelező!';
    return;
  }

  if (!newUser.value.telefon || newUser.value.telefon.trim() === '') {
    formError.value = 'A telefonszám megadása kötelező!';
    return;
  }

  if (!newUser.value.kategoria) {
    formError.value = 'A kategória kiválasztása kötelező!';
    return;
  }

  // Check if user is logged in
  if (!authStore.ceg || !authStore.ceg.id) {
    formError.value = 'Nincs bejelentkezve cég!';
    return;
  }

  // If all validations pass, send to backend
  try {
    const response = await axios.post('/Felhasznalo_ad', {
      nev: newUser.value.nev,
      jelszo: newUser.value.jelszo,
      kategoria: newUser.value.kategoria,
      telephely_cim: newUser.value.telephely_cim,
      telefon: newUser.value.telefon,
      cegId: authStore.ceg.id
    });

    if (response.data.ok) {
      // Success - refresh the page
      window.location.reload();
    } else {
      formError.value = response?.data?.uzenet || 'Hiba történt a felhasználó mentése során';
    }
  } catch (err) {
    console.error('Error saving user:', err);
    formError.value = err.response?.data?.uzenet || 'Hiba történt a szerver kapcsolat során!';
  }
};
</script>

<template>
  <div class="content">
    <!-- Header -->
    <div class="d-flex align-items-center justify-content-between flex-wrap mb-3">
      <div class="d-flex align-items-center flex-grow-1 mb-2 mb-md-0">
        <h2 class="me-3 mb-0">Céghez tartozó felhasználók</h2>

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
        v-if="canAddUser"
        class="btn btn-success btn-teal add-btn rounded-5 d-flex align-items-center"
        @click="openAddModal"
      >
        <i class="bi bi-plus-lg"></i>
        <span class="d-none d-sm-inline ms-2">Új felhasználó felvétele</span>
      </button>
    </div>

    <!-- Loading spinner -->
    <div v-if="loading" class="text-center my-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Betöltés...</span>
      </div>
    </div>

    <!-- Error message -->
    <div v-else-if="error" class="alert alert-warning" role="alert">
      {{ error }}
    </div>

    <!-- Users table -->
    <table v-else class="table custom-table" style="border-bottom: 1px solid black;">
      <thead>
        <tr>
          <th style="width: 25%;">Név</th>
          <th style="width: 20%;">Kategória</th>
          <th style="width: 30%;">Telephely cím</th>
          <th style="width: 25%;">Telefon</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredUsers.length === 0">
          <td colspan="4" class="text-center">Nincs megjeleníthető felhasználó</td>
        </tr>
        <tr v-for="(user, index) in filteredUsers" :key="user.id || index">
          <td>{{ user.nev }}</td>
          <td>{{ user.kategoria }}</td>
          <td>{{ user.telephely_cim }}</td>
          <td>{{ user.telefon }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Add user modal -->
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
              <h5 class="modal-title">Új felhasználó felvétele</h5>
              <button type="button" class="btn-close" @click="closeAddModal"></button>
            </div> 
            <div class="modal-body">
              <form id="user-form" @submit.prevent="saveNewUser">
                <div class="mb-3">
                  <label class="form-label">Felhasználónév</label>
                  <input
                    v-model="newUser.nev"
                    type="text"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Jelszó</label>
                  <input
                    v-model="newUser.jelszo"
                    type="password"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Kategória</label>
                  <select
                    v-model.number="newUser.kategoria"
                    class="form-select custom-input"
                    required
                  >
                    <option :value="2">2</option>
                    <option :value="3">3</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label">Telephely cím</label>
                  <input
                    v-model="newUser.telephely_cim"
                    type="text"
                    class="form-control custom-input"
                    maxlength="255"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Telefonszám</label>
                  <input
                    v-model="newUser.telefon"
                    type="tel"
                    class="form-control custom-input"
                    maxlength="15"
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
              <button type="submit" class="btn btn-primary btn-teal rounded-pill" form="user-form">
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
    background-color: #007a72 !important;
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
