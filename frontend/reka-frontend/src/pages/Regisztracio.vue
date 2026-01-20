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
  felhasznalonev: '',
  jelszo: '',
  telephelyCime: '',
  felhszTel: '',
  elfogadom: false
});

const showError = ref(false);
const errorMessage = ref('');
const showSuccess = ref(false);
const successMessage = ref('');
const isSubmitting = ref(false);
const registeredCegId = ref(null);

// Autocomplete functionality
const showSuggestions = ref(false);
const filteredCompanies = ref([]);
const isLoadingCompanies = ref(false);

// Search companies by name - using API
const handleCegNeveInput = async () => {
  const searchTerm = formData.value.cegNeve;
  
  if (searchTerm.length >= 4) {
    isLoadingCompanies.value = true;
    try {
      // Search companies by name using /v1/search endpoint
      const response = await axios.post('http://localhost:3000/api/search/name', {
        name: searchTerm
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Log the raw response to see the structure
        console.log('Search API response:', response.data);
        
        // Limit to first 4 companies and store basic info
        filteredCompanies.value = response.data.slice(0, 4).map(company => {
          console.log('Company data:', company);
          return {
            shortName: company.shortName || company.fullName || 'N/A',
            taxNumber: company.taxNumber || company.vatNumber,
            companyId: company.id || company.taxNumber || company.vatNumber,
            id: company.taxNumber || company.vatNumber // Use taxNumber as unique identifier
          };
        });
        showSuggestions.value = filteredCompanies.value.length > 0;
      } else {
        filteredCompanies.value = [];
        showSuggestions.value = false;
      }
    } catch (error) {
      console.error('Error searching companies:', error);
      filteredCompanies.value = [];
      showSuggestions.value = false;
    } finally {
      isLoadingCompanies.value = false;
    }
  } else {
    showSuggestions.value = false;
    filteredCompanies.value = [];
  }
};

// Select a company from suggestions and fetch detailed information
const selectCompany = async (company) => {
  // Close suggestions immediately and show loading
  showSuggestions.value = false;
  isLoadingCompanies.value = true;
  
  console.log('Selected company:', company);
  
  try {
    // Fetch detailed information using /v1/detail endpoint
    // Try with the companyId first, then taxNumber
    const identifier = company.companyId || company.taxNumber || company.id;
    console.log('Fetching details for identifier:', identifier);
    
    const detailResponse = await axios.post('http://localhost:3000/api/detail', {
      adoszam: identifier
    });
    
    console.log('Detail API response:', detailResponse.data);
    
    // Check if response is an object (not an array)
    const detail = Array.isArray(detailResponse.data) 
      ? detailResponse.data[0] 
      : detailResponse.data;
    
    if (detail && (detail.shortName || detail.fullName)) {
      console.log('Detail data:', detail);
      
      // Fill in the form with detailed data
      formData.value.cegNeve = detail.shortName || detail.fullName || company.shortName;
      formData.value.cegCime = detail.fullAddress || '';
      formData.value.adoszamMagyar = detail.vatNumber || company.taxNumber;
      formData.value.cegTelszam = detail.phoneNumber || '';
      formData.value.cegEmail = detail.emailAddress || '';
    } else {
      console.log('No detail data received, using fallback');
      // Fallback to basic info if detail fetch fails
      formData.value.cegNeve = company.shortName;
      formData.value.adoszamMagyar = company.taxNumber;
    }
  } catch (error) {
    console.error('Error fetching company details:', error);
    console.error('Error response:', error.response?.data);
    // Fallback to basic info
    formData.value.cegNeve = company.shortName;
    formData.value.adoszamMagyar = company.taxNumber;
    errorMessage.value = 'Nem sikerült betölteni a cég részletes adatait. Kérjük, töltse ki kézzel!';
    showError.value = true;
  } finally {
    isLoadingCompanies.value = false;
  }
};

// Close suggestions when clicking outside
const closeSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

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
          <div class="autocomplete-wrapper">
            <input 
              type="text" 
              class="form-control custom-input" 
              id="cegNeve" 
              v-model="formData.cegNeve"
              @input="handleCegNeveInput"
              @blur="closeSuggestions"
              autocomplete="off"
              required
              maxlength="100"
            />
            <div v-if="isLoadingCompanies" class="autocomplete-loading">
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Keresés...
            </div>
            <div v-else-if="showSuggestions" class="autocomplete-dropdown">
              <div 
                v-for="(company, index) in filteredCompanies" 
                :key="index"
                class="autocomplete-item"
                @click="selectCompany(company)"
              >
                <div class="company-name">{{ company.shortName }}</div>
                <div class="company-details">{{ company.taxNumber }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="cegCime" class="form-label">Vállalkozás címe</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="CegCime" 
            v-model="formData.cegCime"
            required
            maxlength="255"
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
            maxlength="11"
          />
        </div>

        <div class="mb-3">
          <label for="adoszamEuropai" class="form-label">Adószám (európai)</label>
          <input 
            type="text" 
            class="form-control custom-input" 
            id="adoszamEuropai" 
            v-model="formData.adoszamEuropai"
            maxlength="20"
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
            maxlength="15"
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
            maxlength="100"
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
            maxlength="100"
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
            maxlength="255"
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
            maxlength="15"
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
          Elfogadom a <a href="/aszf">RÉKA általános szerződési feltételeit és adatkezelési nyilatkozatát</a>.
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

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-loading {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 2px solid #00948B;
  border-top: none;
  border-radius: 0 0 4px 4px;
  padding: 10px 15px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #00948B;
  font-size: 14px;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 2px solid #00948B;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 261px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.autocomplete-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.autocomplete-item:hover {
  background-color: #e6f7f6;
}

.autocomplete-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.company-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 2px;
}

.company-details {
  font-size: 12px;
  color: #666;
}

a {
  color: #00948B;
  text-decoration: none;
}

a:hover {
  color: #007a72;
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