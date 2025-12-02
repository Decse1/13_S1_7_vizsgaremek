<script setup>

</script>

<template>
  <div class="content">
    <h2>Kezdőlap</h2>
    <p>Üdv a kezdőlapon!</p>
    <h2>Backend-kapcsolat:</h2>
    <h3>Nincs</h3>
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
</style>
