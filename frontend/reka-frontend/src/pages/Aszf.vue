<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
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
    <h2>Figyelmeztetés: Ezen oldalon található dokumentumok nem érvényesek, kizárólag tesztelési és tájékoztatási céllal készültek.</h2>
    <h2 class="mt-4">Általános szerződési feltételek</h2>
    <p>A weboldal használatára vonatkozó általános szerződési feltételek.</p>
    <h3>1. Általános rendelkezések</h3>
    <p>1.1. A jelen általános szerződési feltételek (a továbbiakban: "ÁSZF") a Reka weboldal (a továbbiakban: "Weboldal") használatára vonatkozó szabályokat tartalmazzák.</p>
    <p>1.2. A Weboldal használatával a felhasználó elfogadja az ÁSZF-et, és kötelező érvényűnek tekinti magára nézve.</p>
    <h2 class="mt-4">Adatvédelmi irányelvek</h2>
    <p>A weboldal használatára vonatkozó adatvédelmi irányelvek.</p>
    <h3>1. Adatgyűjtés</h3>
    <p>1.1. A Weboldal használata során a felhasználó által megadott személyes adatokat gyűjtjük.</p>
    <p>1.2. A gyűjtött adatok közé tartozik a név, e-mail cím, és egyéb kapcsolattartási információk.</p>
    <h3>2. Adatfelhasználás</h3>
    <p>2.1. A gyűjtött adatokat kizárólag a Weboldal működtetésére és fejlesztésére használjuk fel.</p>
    <p>2.2. Az adatokat harmadik félnek nem adjuk át kivéve, ha azt jogszabály írja elő.</p>
  </div>
</template>
<style scoped>
.logo-img {
  height: 40px;
  object-fit: cover;
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