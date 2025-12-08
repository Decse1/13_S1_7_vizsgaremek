<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const formData = ref({
  cegNeve: '',
  adoszamMagyar: '',
  adoszamEuropai: '',
  felhasznalonev: '',
  jelszo: '',
  telephelyCime: '',
  elfogadom: false
});

const handleSubmit = () => {
  console.log('Registration data:', formData.value);
  // TODO: Implement registration API call
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
      <!-- I. Cég adatai -->
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
      </section>

      <!-- II. Rendszerkezelő felhasználó adatai -->
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

      <!-- Submit Button -->
      <div class="text-center">
        <button type="submit" class="btn btn-primary btn-lg px-5">
          Regisztráció elküldése
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
  background-color: #17a2b8;
  border-color: #17a2b8;
  border-radius: 25px;
}

.btn-primary:hover {
  background-color: #138496;
  border-color: #117a8b;
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
</style>