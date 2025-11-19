<template>
  <div>
    <NavBar />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
  import NavBar from "./components/NavBar.vue";
  
  export default {
    components: { NavBar }
  };
  
</script>

<style scoped>

</style>
