<template>
  <div>
    <NavBar v-if="!hideNavBar" />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
  import NavBar from "./components/NavBar.vue";
  import { useRoute } from "vue-router";
  import { computed } from "vue";

  export default {
    components: { NavBar },
    setup() {
      const route = useRoute();

      const hideNavBar = computed(() =>
        ["/bejelentkezes", "/regisztracio", "/aszf"].includes(route.path)
      );

      return { hideNavBar };
    }
  };
  
</script>

<style scoped>

</style>
