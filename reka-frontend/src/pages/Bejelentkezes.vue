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
    };
  },
  mounted() {
    // If already logged in, redirect to home page
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

      // A backend mindig 200 OK, ha minden rendben, ok ellenőrzése
      if (!response.data.ok) {
        this.errorMessage = response.data.uzenet || "Hibás felhasználónév vagy jelszó.";
        this.showError = true;
      }
      else if (response.data.ok) {
        console.log("Felhasználó:", response.data.felhasznalo);
        console.log("Cég:", response.data.ceg);
        console.log("Token:", response.data.token);
        console.log("Jogosultságok:", response.data.felhasznalo.jogkor);
        
        // Store authentication data with JWT token (includes user permissions in jogkor)
        setAuthState(response.data.felhasznalo, response.data.ceg, response.data.token);
        
        this.$router.push("/kezdolap");
      }
      
      this.eredmeny = JSON.stringify(response.data, null, 4);

      } catch (err) {
      // 400-as hibák itt is elkapódnak
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
      this.showError = false;
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

      <form @submit.prevent="onSubmit">
        <div class="mb-3">
          <input
            id="username"
            v-model="username"
            type="text"
            class="form-control form-control-lg custom-input"
            placeholder="Felhasználónév"
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
            required
          />
        </div>

        <!-- Error alert -->
        <div
          v-if="showError"
          class="alert alert-danger d-flex justify-content-between align-items-center mb-4"
          role="alert"
        >
          <span>{{ errorMessage }}</span>
          <button type="button" class="btn-close" aria-label="Bezárás" @click="showError = false"></button>
        </div>

        <div class="text-center">
          <button
            type="submit"
            class="btn btn-primary btn-login-teal btn-lg px-5 py-2 fw-bold rounded-pill w-100"
          >
            Bejelentkezés
          </button>
        </div>
      </form>

      <div class="text-center mt-4 small text-muted">
        <p class="mb-1"><a href="#" @click.prevent="onForgotPassword">Elfelejtettem a jelszavamat</a></p>
        <p><a href="/regisztracio">Hozzáférés kérése a RÉKA-rendszerhez</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-teal {
  background-color: #00948B;
}

.login-card {
  width: 100%;
  max-width: 800px; /* wider on large screens */
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
    padding: 1.5rem !important;
    margin: 0 1rem; /* keep side margin on mobile */
  }
}

.custom-input {
  font-size: 1.1rem;
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
</style>

