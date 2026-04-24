<script>
import axios from "../axios.js";
import authStore, { setAuthState } from "../stores/auth.js";

export default {
  name: "RekaLogin",
  data() {
    return {
      username: "",
      password: "",
      showError: false,
      errorMessage: "",
      eredmeny: "", // opcionális: szerver válasz megjelenítéséhez
      showForgotPasswordModal: false,
    };
  },
  mounted() {
    if (authStore.isAuthenticated) {
      this.$router.push("/kezdolap");
    }
  },
  methods: {
    async onSubmit() {
      this.showError = false;
      this.eredmeny = "";

      try {
      const response = await axios.post("/Bejelent", {
        username: this.username,
        password: this.password,
      });

      if (!response.data.ok) {
        this.errorMessage = response.data.uzenet || "Hibás felhasználónév vagy jelszó.";
        this.showError = true;
      }
      else if (response.data.ok) {        
        setAuthState(response.data.felhasznalo, response.data.ceg, response.data.token);
        
        this.$router.push("/kezdolap");
      }
      
      this.eredmeny = JSON.stringify(response.data, null, 4);

      } catch (err) {
      if (err.response) {
        this.errorMessage = err.response.data.uzenet || "Hiba történt a kérés során.";
        this.eredmeny = JSON.stringify(err.response.data, null, 4);
      } else {
        this.errorMessage = "Hiba: nem érhető el a szerver!";
        this.eredmeny = "Hiba: nem érhető el a szerver!";
      }
      this.showError = true;
      }
    },
    onForgotPassword() {
      this.showForgotPasswordModal = true;
    },
    closeForgotPasswordModal() {
      this.showForgotPasswordModal = false;
    },
    onRequestAccess() {
      this.errorMessage = "Teszt hibaüzenet: a hozzáférés kérés funkció még nem elérhető.";
      this.showError = true;
    },
  },
};
</script>

<template>
  <div class="d-flex flex-column justify-content-center align-items-center bg-teal min-vh-100">
    <img src="/src/reka_logo_white.png" alt="RÉKA logo" class="logo mb-2" />

    <div class="p-4 login-card shadow-lg rounded-5 bg-white">
      <div class="text-center mb-4 mt-1">
        <h3 class="fw-bold">Bejelentkezés a RÉKA-rendszerbe</h3>
      </div>

      <form @submit.prevent="onSubmit" data-test="login-form">
        <div class="mb-3">
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-control form-control-lg custom-input"
            placeholder="Felhasználónév"
            data-test="username-input"
            required
          />
        </div>

        <div class="mb-4">
          <input
            id="password"
            v-model="password"
            type="password"
            class="form-control form-control-lg custom-input"
            placeholder="Jelszó"
            data-test="password-input"
            required
          />
        </div>

        <div
          v-if="showError"
          class="alert alert-danger d-flex justify-content-between align-items-center mb-4"
          role="alert"
          data-test="error-alert"
        >
          <span data-test="error-message">{{ errorMessage }}</span>
          <button type="button" class="btn-close" aria-label="Bezárás" @click="showError = false"></button>
        </div>

        <div class="text-center">
          <button
            type="submit"
            class="btn btn-primary btn-login-teal btn-lg px-5 py-2 fw-bold rounded-pill w-100"
            data-test="login-button"
          >
            Bejelentkezés
          </button>
        </div>
      </form>

      <div class="text-center mt-4 small text-muted">
        <p data-test="option-registration" class="mb-1"><a href="/regisztracio">Regisztráció</a></p>
        <p><a href="#" @click.prevent="onForgotPassword">Elfelejtettem a jelszavamat</a></p>
      </div>
    </div>

    <transition name="modal-fade">
      <div
        v-if="showForgotPasswordModal"
        class="modal-backdrop-custom"
        tabindex="-1"
        role="dialog"
        @click="closeForgotPasswordModal"
      >
        <div class="modal-dialog modal-dialog-centered modal-dialog-custom" role="document" @click.stop>
          <div class="modal-content custom-modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Jelszó visszaállítása</h5>
              <button type="button" class="btn-close" @click="closeForgotPasswordModal"></button>
            </div>
            <div class="modal-body">
              <p>Új jelszó igényléséhez kérjük, vegye fel a kapcsolatot a vállalat rendszerkezelő felhasználójához.</p>
              <p>Rendszerkezelő felhasználók esetében:<br>Vegye fel a kapcsolatot a RÉKA problémamegoldási csapatával az alábbi elérhetőségek egyikén:</p>
              <div class="mt-3">
                <p><strong>Email:</strong> support@reka.hu</p>
                <p><strong>Telefon:</strong> +36 1 234 5678</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary rounded-pill" @click="closeForgotPasswordModal">
                Bezárás
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.bg-teal {
  background-color: #00948B;
}

.login-card {
  width: calc(100% - 2rem);
  max-width: 800px;
}

.logo {
  width: 360px;
}

button.btn-teal {
  background-color: #008c8a !important;
  border: none !important;
}

@media (max-width: 576px) {
  .logo {
    width: 220px;
  }

  .login-card {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
}

@media (max-width: 799px) {
  .login-card {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
}

a {
  color: #00948B;
  text-decoration: none;
}

a:hover {
  color: #007a72;
}

.btn-login-teal {
  background-color: #00948B !important;
  border-color: #00948B !important;
}

.btn-login-teal:hover,
.btn-login-teal:focus {
  background-color: #007a72 !important;
  border-color: #007a72 !important;
}

.custom-input {
    font-size: 1.1rem;
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
</style>

