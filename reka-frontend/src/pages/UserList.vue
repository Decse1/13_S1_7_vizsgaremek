<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore, { clearAuthState, setAuthState, hasPermission, isAdmin } from '../stores/auth.js';
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
  telephely_cim: '',
  telefon: '',
  rendeles_osszkesz: 0,
  rendeles_lead: 0,
  szamla_keszit: 0,
  raktar_kezel: 0
});

const openAddModal = () => {
  newUser.value = {
    nev: '',
    jelszo: '',
    telephely_cim: '',
    telefon: '',
    rendeles_osszkesz: 0,
    rendeles_lead: 0,
    szamla_keszit: 0,
    raktar_kezel: 0
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

  // If telephely_cim is empty, use company's address
  if (!newUser.value.telephely_cim || newUser.value.telephely_cim.trim() === '') {
    if (authStore.ceg && authStore.ceg.cim) {
      newUser.value.telephely_cim = authStore.ceg.cim;
    } else {
      formError.value = 'A telephely cím megadása kötelező!';
      return;
    }
  }

  if (!newUser.value.telefon || newUser.value.telefon.trim() === '') {
    formError.value = 'A telefonszám megadása kötelező!';
    return;
  }

  // Check if at least one permission is selected (value must be 1, not 0)
  if (newUser.value.rendeles_osszkesz !== 1 && newUser.value.rendeles_lead !== 1 && 
      newUser.value.szamla_keszit !== 1 && newUser.value.raktar_kezel !== 1) {
    formError.value = 'Legalább egy jogosultságot ki kell választani!';
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
      telephely_cim: newUser.value.telephely_cim,
      telefon: newUser.value.telefon,
      rendeles_osszkesz: newUser.value.rendeles_osszkesz || 0,
      rendeles_lead: newUser.value.rendeles_lead || 0,
      szamla_keszit: newUser.value.szamla_keszit || 0,
      raktar_kezel: newUser.value.raktar_kezel || 0,
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
    console.error('Full error response:', err.response);
    formError.value = err.response?.data?.uzenet || 'Hiba történt a szerver kapcsolat során!';
  }
};

// Edit user functionality
const showEditModal = ref(false);
const editUser = ref({
  id: null,
  nev: '',
  jelszo: '',
  telephely_cim: '',
  telefon: '',
  rendeles_osszkesz: 0,
  rendeles_lead: 0,
  szamla_keszit: 0,
  raktar_kezel: 0
});

const openEditModal = (user) => {
  editUser.value = {
    id: user.id,
    nev: user.nev,
    jelszo: '', // Leave empty, user will need to enter a new password
    telephely_cim: user.telephely_cim,
    telefon: user.telefon,
    rendeles_osszkesz: user.rendeles_osszkesz || 0,
    rendeles_lead: user.rendeles_lead || 0,
    szamla_keszit: user.szamla_keszit || 0,
    raktar_kezel: user.raktar_kezel || 0
  };
  formError.value = '';
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  formError.value = '';
};

const saveEditUser = async () => {
  // Validate form fields
  formError.value = '';

  if (!editUser.value.nev || editUser.value.nev.trim() === '') {
    formError.value = 'A felhasználónév megadása kötelező!';
    return;
  }

  if (!editUser.value.jelszo || editUser.value.jelszo.trim() === '') {
    formError.value = 'A jelszó megadása kötelező!';
    return;
  }

  if (editUser.value.jelszo.length < 6) {
    formError.value = 'A jelszónak legalább 6 karakter hosszúnak kell lennie!';
    return;
  }

  if (!editUser.value.telephely_cim || editUser.value.telephely_cim.trim() === '') {
    formError.value = 'A telephely cím megadása kötelező!';
    return;
  }

  if (!editUser.value.telefon || editUser.value.telefon.trim() === '') {
    formError.value = 'A telefonszám megadása kötelező!';
    return;
  }

  // Check if at least one permission is selected (value must be 1, not 0)
  if (editUser.value.rendeles_osszkesz !== 1 && editUser.value.rendeles_lead !== 1 && 
      editUser.value.szamla_keszit !== 1 && editUser.value.raktar_kezel !== 1) {
    formError.value = 'Legalább egy jogosultságot ki kell választani!';
    return;
  }

  // Check if user is logged in
  if (!authStore.ceg || !authStore.ceg.id) {
    formError.value = 'Nincs bejelentkezve cég!';
    return;
  }

  // If all validations pass, send to backend
  try {
    const response = await axios.post('/Felhasznalo_update', {
      id: editUser.value.id,
      nev: editUser.value.nev,
      jelszo: editUser.value.jelszo,
      telephely_cim: editUser.value.telephely_cim,
      telefon: editUser.value.telefon,
      rendeles_osszkesz: editUser.value.rendeles_osszkesz || 0,
      rendeles_lead: editUser.value.rendeles_lead || 0,
      szamla_keszit: editUser.value.szamla_keszit || 0,
      raktar_kezel: editUser.value.raktar_kezel || 0,
      cegId: authStore.ceg.id
    });

    if (response.data.ok) {
      // Check if the edited user is the currently logged-in user
      const isCurrentUser = authStore.user && authStore.user.id === editUser.value.id;
      
      if (isCurrentUser) {
        // Log out the user since their data has been modified
        clearAuthState();
        // Redirect to login page
        window.location.href = '/bejelentkezes';
      } else {
        // Success - refresh the user list
        await fetchUsers();
        closeEditModal();
      }
    } else {
      formError.value = response?.data?.uzenet || 'Hiba történt a felhasználó módosítása során';
    }
  } catch (err) {
    console.error('Error updating user:', err);
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
        v-if="isAdmin()"
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
          <th style="width: 20%;">Név</th>
          <th style="width: 10%;">Rendelés összeállítás</th>
          <th style="width: 10%;">Rendelés leadás</th>
          <th style="width: 10%;">Számla készítés</th>
          <th style="width: 10%;">Raktár kezelés</th>
          <th style="width: 20%;">Telephely cím</th>
          <th style="width: 10%;">Telefon</th>
          <th v-if="isAdmin()" style="width: 10%;">Műveletek</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredUsers.length === 0">
          <td :colspan="canAddUser ? 8 : 7" class="text-center">Nincs megjeleníthető felhasználó</td>
        </tr>
        <tr v-for="(user, index) in filteredUsers" :key="user.id || index">
          <td>{{ user.nev }}</td>
          <td class="text-center">
            <i v-if="user.rendeles_osszkesz" class="bi bi-check-circle-fill text-success"></i>
            <i v-else class="bi bi-x-circle-fill text-danger"></i>
          </td>
          <td class="text-center">
            <i v-if="user.rendeles_lead" class="bi bi-check-circle-fill text-success"></i>
            <i v-else class="bi bi-x-circle-fill text-danger"></i>
          </td>
          <td class="text-center">
            <i v-if="user.szamla_keszit" class="bi bi-check-circle-fill text-success"></i>
            <i v-else class="bi bi-x-circle-fill text-danger"></i>
          </td>
          <td class="text-center">
            <i v-if="user.raktar_kezel" class="bi bi-check-circle-fill text-success"></i>
            <i v-else class="bi bi-x-circle-fill text-danger"></i>
          </td>
          <td>{{ user.telephely_cim }}</td>
          <td>{{ user.telefon }}</td>
          <td v-if="isAdmin()">
            <span class="cursor-pointer" @click="openEditModal(user)" title="Szerkesztés">
              <Icons name="pencil" size="1.25rem" />
            </span>
          </td>
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
                  <label class="form-label d-block mb-2">Jogosultságok</label>
                  <div class="form-check mb-2">
                    <input
                      v-model="newUser.rendeles_osszkesz"
                      class="form-check-input"
                      type="checkbox"
                      id="new-rendeles-osszkesz"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="new-rendeles-osszkesz">
                      Rendelés összeállítás
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      v-model="newUser.rendeles_lead"
                      class="form-check-input"
                      type="checkbox"
                      id="new-rendeles-lead"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="new-rendeles-lead">
                      Rendelés leadás
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      v-model="newUser.szamla_keszit"
                      class="form-check-input"
                      type="checkbox"
                      id="new-szamla-keszit"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="new-szamla-keszit">
                      Számla készítés
                    </label>
                  </div>
                  <div class="form-check">
                    <input
                      v-model="newUser.raktar_kezel"
                      class="form-check-input"
                      type="checkbox"
                      id="new-raktar-kezel"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="new-raktar-kezel">
                      Raktár kezelés
                    </label>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Telephely cím</label>
                  <input
                    v-model="newUser.telephely_cim"
                    type="text"
                    class="form-control custom-input"
                    maxlength="255"
                    placeholder="Ha üresen hagyja, a cég címe lesz használva"
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

    <!-- Edit user modal -->
    <transition name="modal-fade">
      <div
        v-if="showEditModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeEditModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Felhasználó szerkesztése</h5>
              <button type="button" class="btn-close" @click="closeEditModal"></button>
            </div> 
            <div class="modal-body">
              <form id="edit-user-form" @submit.prevent="saveEditUser">
                <div class="mb-3">
                  <label class="form-label">Felhasználónév</label>
                  <input
                    v-model="editUser.nev"
                    type="text"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Új jelszó</label>
                  <input
                    v-model="editUser.jelszo"
                    type="password"
                    class="form-control custom-input"
                    maxlength="100"
                    required
                    placeholder="Adjon meg új jelszót"
                  />
                  <small class="text-muted">A jelszó módosításához adjon meg új jelszót (min. 6 karakter)</small>
                </div>
                <div class="mb-3">
                  <label class="form-label d-block mb-2">Jogosultságok</label>
                  <div class="form-check mb-2">
                    <input
                      v-model="editUser.rendeles_osszkesz"
                      class="form-check-input"
                      type="checkbox"
                      id="edit-rendeles-osszkesz"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="edit-rendeles-osszkesz">
                      Rendelés összeállítás
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      v-model="editUser.rendeles_lead"
                      class="form-check-input"
                      type="checkbox"
                      id="edit-rendeles-lead"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="edit-rendeles-lead">
                      Rendelés leadás
                    </label>
                  </div>
                  <div class="form-check mb-2">
                    <input
                      v-model="editUser.szamla_keszit"
                      class="form-check-input"
                      type="checkbox"
                      id="edit-szamla-keszit"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="edit-szamla-keszit">
                      Számla készítés
                    </label>
                  </div>
                  <div class="form-check">
                    <input
                      v-model="editUser.raktar_kezel"
                      class="form-check-input"
                      type="checkbox"
                      id="edit-raktar-kezel"
                      :true-value="1"
                      :false-value="0"
                    />
                    <label class="form-check-label" for="edit-raktar-kezel">
                      Raktár kezelés
                    </label>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Telephely cím</label>
                  <input
                    v-model="editUser.telephely_cim"
                    type="text"
                    class="form-control custom-input"
                    maxlength="255"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label class="form-label">Telefonszám</label>
                  <input
                    v-model="editUser.telefon"
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
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeEditModal">
                Mégse
              </button>
              <button type="submit" class="btn btn-primary btn-teal rounded-pill" form="edit-user-form">
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
  /* Page-specific styles only - common styles moved to global.css */

  .modal-backdrop {
    display: none;
  }
</style>
