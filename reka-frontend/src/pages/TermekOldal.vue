<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import authStore, { setAuthState, hasPermission, isAdmin } from '../stores/auth.js';

const quantity = ref(1);

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--;
  }
};

const increaseQuantity = () => {
  quantity.value++;
};

const updateQuantity = (event) => {
  const value = parseInt(event.target.value);
  if (value >= 1) {
    quantity.value = value;
  } else {
    quantity.value = 1;
  }
};
</script>

<template>
  <div class="content">
    <h2>Termék Placeholder</h2>
    <p>Ez itt a placeholder termék leírása</p>
    <p>Ár (nettó): 10000 Ft</p>
    <p>Áfakulcs: 27%</p>
    <p>Cég: Placeholder Kft.</p>
    <p>Termékkategória: Irodaszer</p>
    <p>Cikkszám: PLACEH001</p>
    <p>Minimum vásárlási mennyiség: 1 db</p>
    <p>Jelenleg a cégnél készleten lévő mennyiség: 100 db</p>
  

    <div class="d-flex flex-column flex-md-row align-items-center gap-3">
        <button
          type="submit"
          class="btn btn-primary btn-teal btn-lg px-5 py-2 fw-bold rounded-pill flex-grow-1"
        >
          Termék kosárba helyezése
        </button>
        <div class="quantity-selector d-flex align-items-center">
          <button
            @click="decreaseQuantity"
            class="btn btn-outline-secondary rounded-circle quantity-btn"
            type="button"
          >
            <span class="minus-icon">−</span>
          </button>
          <input
            type="number"
            v-model.number="quantity"
            @input="updateQuantity"
            min="1"
            class="form-control quantity-input text-center mx-2"
          />
          <button
            @click="increaseQuantity"
            class="btn btn-outline-secondary rounded-circle quantity-btn"
            type="button"
          >
            <span class="plus-icon">+</span>
          </button>
        </div>
    </div>
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

  .quantity-selector {
    min-width: 200px;
  }

  .quantity-btn {
    width: 50px;
    height: 50px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    background-color: white;
    font-size: 24px;
    font-weight: bold;
    transition: all 0.2s ease;
    color: #212529 !important;
  }

  .quantity-btn:hover {
    background-color: #f8f9fa !important;
    color: #212529 !important;
  }

  .quantity-btn:focus {
    outline: none;
    box-shadow: none;
    background-color: #f8f9fa !important;
    color: #212529 !important;
  }

  .quantity-btn:active {
    outline: none;
    box-shadow: none;
    background-color: #f8f9fa !important;
    color: #212529 !important;
  }

  .minus-icon,
  .plus-icon {
    line-height: 1;
    color: inherit;
  }

  .quantity-input {
    width: 80px;
    height: 50px;
    font-size: 20px;
    font-weight: bold;
    border: 2px solid #d0d0d0;
  }

  .quantity-input:focus {
    outline: none;
    box-shadow: none;
    border-color: #d0d0d0;
  }

  .quantity-input::-webkit-inner-spin-button,
  .quantity-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .quantity-input[type=number] {
    -moz-appearance: textfield;
    appearance: textfield;
  }

  @media (max-width: 767.98px) {
    .quantity-selector {
      width: 100%;
      justify-content: center;
    }
  }
</style>
