import { createRouter, createWebHistory } from 'vue-router';
import Kezdolap from "./pages/Kezdolap.vue";
import Raktar from "./pages/Raktar.vue";
import CegInfo from "./pages/CegInfo.vue";
import UserInfo from './pages/UserInfo.vue';
import Partnersegek from './pages/Partnersegek.vue';
import Bejelentkezes from './pages/Bejelentkezes.vue';
import Regisztracio from './pages/Regisztracio.vue';
import TermekOldal from './pages/TermekOldal.vue';
import authStore from './stores/auth.js';

const routes = [
  { path: "/", redirect: "/bejelentkezes" },
  { 
    path: "/kezdolap", 
    name: "Kezdőlap", 
    component: Kezdolap,
    meta: { requiresAuth: true }
  },
  { 
    path: "/raktar", 
    name: "Raktár", 
    component: Raktar,
    meta: { requiresAuth: true }
  },
  { 
    path: "/ceginfo", 
    name: "Cégadatok", 
    component: CegInfo,
    meta: { requiresAuth: true }
  },
  { 
    path: "/userinfo", 
    name: "Felhasználói adatok", 
    component: UserInfo,
    meta: { requiresAuth: true }
  },
  {
    path: "/partnersegek",
    name: "Partnerségek",
    component: Partnersegek,
    meta: { requiresAuth: true }
  },
  { 
    path: "/bejelentkezes", 
    name: "Bejelentkezés", 
    component: Bejelentkezes,
    meta: { requiresGuest: true }
  },
  { 
    path: "/regisztracio", 
    name: "Regisztráció", 
    component: Regisztracio,
    meta: { requiresGuest: true }
  },
  { 
    path: "/termek/test", 
    name: "Teszt termék oldal", 
    component: TermekOldal,
    meta: { requiresAuth: true }
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    redirect: () => {
      return { path: "/kezdolap", query: { error: "page-not-found" } };
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// Navigation guards
router.beforeEach((to, from, next) => {
  const isAuthenticated = authStore.isAuthenticated;
  
  // If route requires authentication and user is not logged in
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/bejelentkezes');
  } 
  // If user is logged in and tries to access login page
  else if (to.meta.requiresGuest && isAuthenticated) {
    next('/kezdolap');
  } 
  // Otherwise, proceed
  else {
    next();
  }
});

export default router;