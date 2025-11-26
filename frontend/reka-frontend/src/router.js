import { createRouter, createWebHistory } from 'vue-router';
import Kezdolap from "./pages/Kezdolap.vue";
import Raktar from "./pages/Raktar.vue";
import Bejelentkezes from './pages/Bejelentkezes.vue';

const routes = [
  { path: "/", redirect: "/bejelentkezes" },
  { path: "/kezdolap", name: "Kezdőlap", component: Kezdolap },
  { path: "/raktar", name: "Raktár", component: Raktar },
  { path: "/bejelentkezes", name: "Bejelentkezés", component: Bejelentkezes }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});


export default router;