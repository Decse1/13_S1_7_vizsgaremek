<!--/src/reka_logo_white.png-->
<template>
  <div class="d-flex flex-column justify-content-center align-items-center bg-teal min-vh-100">
    <img src="/src/reka_logo_white.png" alt="RÉKA logo" class="logo mb-4" />

    <div class="p-4 login-card shadow-lg rounded-5 bg-white">
      <div class="text-center mb-3">
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

        <div class="mb-3">
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
        <p><a href="#" @click.prevent="onRequestAccess">Hozzáférés kérése a RÉKA-rendszerhez</a></p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "RekaLogin",
  data() {
    return {
      username: "",
      password: "",
      showError: false,
      errorMessage: "",
    };
  },
  methods: {
    onSubmit() {
      console.log("Bejelentkezés...", this.username, this.password);
      // Example: clear error on submit
      this.showError = false;
    },
    onForgotPassword() {
      // placeholder for future logic
      this.showError = false;
    },
    onRequestAccess() {
      // For testing: show a test error message in the alert box
      this.errorMessage = "Teszt hibaüzenet: a hozzáférés kérés funkció még nem elérhető.";
      this.showError = true;
    },
  },
};
</script>

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
</style>
