<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const formData = ref({
  cegNeve: '',
  cegCime: '',
  adoszamMagyar: '',
  adoszamEuropai: '',
  cegTelszam: '',
  cegEmail: '',
  elfogadom: false
});

const showError = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);
const successMessage = ref('');
const isSubmitting = ref(false);
const registeredCegId = ref(null);

const handleSubmit = async () => {
  // Reset messages
  showError.value = false;
  showSuccess.value = false;
  isSubmitting.value = true;

  try {
    // Prepare data according to backend API expectations
    const cegData = {
      nev: formData.value.cegNeve,
      adoszam: formData.value.adoszamMagyar,
      euAdoszam: formData.value.adoszamEuropai,
      cim: formData.value.cegCime,
      email: formData.value.cegEmail,
      telefon: formData.value.cegTelszam,
      elofiz: false // Default to false for new registrations
    };

    // Make API call to backend using axios
    const response = await axios.post('http://localhost:3000/api/Ceg_ad', cegData);

    if (response.data.ok) {
      // Store the company ID for later use
      console.log('Full backend response:', response.data);
      registeredCegId.value = response.data.cegId;
      console.log('Stored company ID:', registeredCegId.value);
      
      // Now create the system manager user
      const felhasznaloData = {
        nev: formData.value.felhasznalonev,
        jelszo: formData.value.jelszo,
        kategoria: 1, // System manager category
        telephely_cim: formData.value.telephelyCime,
        telefon: formData.value.felhszTel,
        cegId: registeredCegId.value
      };

      console.log('Creating user with data:', felhasznaloData);
      const userResponse = await axios.post('http://localhost:3000/api/Felhasznalo_ad', felhasznaloData);

      if (userResponse.data.ok) {
        // Both company and user created successfully
        successMessage.value = 'Sikeres regisztráció! A cég és a rendszerkezelő felhasználó létrehozva. Jelentkezzen be fiókjába a folytatáshoz!';
        showSuccess.value = true;
        
        // Reset form
        formData.value = {
          cegNeve: '',
          cegCime: '',
          adoszamMagyar: '',
          adoszamEuropai: '',
          cegTelszam: '',
          cegEmail: '',
          felhasznalonev: '',
          jelszo: '',
          telephelyCime: '',
          felhszTel: '',
          elfogadom: false
        };

        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push('/bejelentkezes');
        }, 2000);
      } else {
        // User creation failed
        errorMessage.value = 'A cég létrehozva, de a felhasználó létrehozása sikertelen: ' + (userResponse.data.uzenet || 'Ismeretlen hiba');
        showError.value = true;
      }
    } else {
      // Error from backend
      errorMessage.value = response.data.uzenet || 'Hiba történt a regisztráció során!';
      showError.value = true;
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (error.response) {
      // Server responded with error
      errorMessage.value = error.response.data.uzenet || error.response.data.error || 'Hiba történt a regisztráció során!';
    } else if (error.request) {
      // Request made but no response
      errorMessage.value = 'Nem sikerült kapcsolódni a szerverhez. Kérjük, próbálja újra később!';
    } else {
      // Something else happened
      errorMessage.value = 'Hiba történt a kérés feldolgozása során!';
    }
    showError.value = true;
  } finally {
    isSubmitting.value = false;
  }
};
</script>
<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-light fixed-top px-2">
    <div class="container-fluid d-flex justify-content-between align-items-center">      
      <div class="d-flex align-items-center">
        <router-link class="navbar-brand d-flex align-items-center m-0" to="/">
          <img src="/src/reka_logo_alt.png" alt="Logo" class="logo-img me-2" />
        </router-link>
      </div>
    </div>
  </nav>

  <div class="content">
    <h2 class="mb-4">Regisztráció</h2>
    
    <form @submit.prevent="handleSubmit">
      <!-- Cég adatai -->
      <section class="mb-4">
        <h5 class="mb-3">I. Cég adatai</h5>
        
        <div class="mb-3">
          <label for="cegNeve" class="form-label">Cég neve</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="cegNeve" 
            v-model="formData.cegNeve"
            required
          />
        </div>

        <div class="mb-3">
          <label for="cegCime" class="form-label">Vállalkozás címe</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="CegCime" 
            v-model="formData.cegCime"
            required
          />
        </div>

        <div class="mb-3">
          <label for="adoszamMagyar" class="form-label">Adószám (magyar)</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="adoszamMagyar" 
            v-model="formData.adoszamMagyar"
            required
          />
        </div>

        <div class="mb-3">
          <label for="adoszamEuropai" class="form-label">Adószám (európai)</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="adoszamEuropai" 
            v-model="formData.adoszamEuropai"
            required
          />
        </div>

        <div class="mb-3">
          <label for="cegTelszam" class="form-label">Vállalkozás telefonszáma</label>
          <input 
            type="tel" 
            class="form-control custom-input" 
            id="cegTelszam" 
            v-model="formData.cegTelszam"
            required
          />
        </div>

        <div class="mb-3">
          <label for="cegEmail" class="form-label">Cég email címe</label>
          <input 
            type="email" 
            class="form-control custom-input" 
            id="cegEmail" 
            v-model="formData.cegEmail"
            required
          />
        </div>
      </section>

      <section class="mb-4">
        <h5 class="mb-3">II. Rendszerkezelő felhasználó adatai</h5>
        
        <div class="mb-3">
          <label for="felhasznalonev" class="form-label">Felhasználónév</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="felhasznalonev" 
            v-model="formData.felhasznalonev"
            required
          />
        </div>

        <div class="mb-3">
          <label for="jelszo" class="form-label">Jelszó</label>
          <input 
            type="password" 
            class="form-control custom-input" 
            id="jelszo" 
            v-model="formData.jelszo"
            required
          />
        </div>

        <div class="mb-3">
          <label for="telephelyCime" class="form-label">Telephely címe</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="telephelyCime" 
            v-model="formData.telephelyCime"
            required
          />
        </div>

        <div class="mb-3">
          <label for="" class="form-label">Telefonszám</label>
          <input 
            type="felhszTel" 
            class="form-control custom-input" 
            id="felhszTel" 
            v-model="formData.felhszTel"
            required
          />
        </div>
      </section>

      <!-- Checkbox -->
      <div class="form-check mb-4">
        <input 
          class="form-check-input custom-checkbox" 
          type="checkbox" 
          id="elfogadom" 
          v-model="formData.elfogadom"
          required
        />
        <label class="form-check-label" for="elfogadom">
          Elfogadom a RÉKA általános szerződési feltételeit és adatkezelési nyilatkozatát
        </label>
      </div>

      <!-- Error Alert -->
      <div
        v-if="showError"
        class="alert alert-danger d-flex justify-content-between align-items-center mb-4"
        role="alert"
      >
        <span>{{ errorMessage }}</span>
        <button type="button" class="btn-close" aria-label="Bezárás" @click="showError = false"></button>
      </div>

      <!-- Success Alert -->
      <div
        v-if="showSuccess"
        class="alert alert-success d-flex justify-content-between align-items-center mb-4"
        role="alert"
      >
        <span>{{ successMessage }}</span>
        <button type="button" class="btn-close" aria-label="Bezárás" @click="showSuccess = false"></button>
      </div>

      <!-- Submit Button -->
      <div class="text-center">
        <button 
          type="submit" 
          class="btn btn-primary btn-lg fw-bold px-5 rounded-pill"
          :disabled="isSubmitting || !formData.elfogadom"
        >
          <span v-if="isSubmitting">
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Feldolgozás...
          </span>
          <span v-else>
            Regisztráció elküldése
          </span>
        </button>
      </div>
    </form>
  </div>
</template>
<style scoped>
.logo-img {
  height: 40px;
  object-fit: cover;
}

.btn-primary {
  background-color: #00948B;
  border-color: #00948B;
  border-radius: 25px;
}

.btn-primary:hover {
  background-color: #007a72;
  border-color: #007a72;
}

.btn-primary:disabled {
  background-color: #557976;
  border-color: #557976;
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

.custom-checkbox {
    border: 2px solid #ccc;
    background-color: white;
    outline: none;
  }

@media (min-width: 992px) {
  .content {
    margin-left: 0px;
    margin-left: auto;
    margin-right: auto;
    max-width: 850px;
    padding: 2rem;
    margin-top: 56px;
  }
}

/* Mobile margin */
@media (max-width: 991.98px) {
  .content {
    margin-left: 0;
    margin-left: auto;
    margin-right: auto;
    max-width: 850px;
    padding: 2rem;
    margin-top: 56px;
  }
}
</style>