import { createRouter, createWebHistory } from 'vue-router';
import Kezdolap from "./pages/Kezdolap.vue";
import Raktar from "./pages/Raktar.vue";
import CegInfo from "./pages/CegInfo.vue";
import UserInfo from './pages/UserInfo.vue';
import UserList from './pages/UserList.vue';
import Partnersegek from './pages/Partnersegek.vue';
import RendelesBeerk from './pages/RendelesBeerk.vue';
import RendelesLead from './pages/RendelesLead.vue';
import Bejelentkezes from './pages/Bejelentkezes.vue';
import Regisztracio from './pages/Regisztracio.vue';
import TermekOldal from './pages/TermekOldal.vue';
import StoreMain from './pages/StoreMain.vue';
import StorePartner from './pages/StorePartner.vue';
import Aszf from './pages/Aszf.vue';
import Kosar from './pages/Kosar.vue';
import authStore, { hasPermission, isAdmin } from './stores/auth.js';

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
    meta: { 
      requiresAuth: true,
      requiredPermission: ['raktar_kezel', 'rendeles_osszkesz'] // User needs ANY of these permissions
    }
  },
  { 
    path: "/ceginfo", 
    name: "Cégadatok", 
    component: CegInfo,
    meta: { requiresAuth: true }
  },
  {
    path: "/ceginfo/felhasznalok",
    name: "Céghez tartozó felhasználók",
    component: UserList,
    meta: { 
      requiresAuth: true,
      requiresAdmin: true // Only admin users with all permissions
    }
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
    path: "/rendelesek/beerkezett",
    name: "Beérkezett rendelések",
    component: RendelesBeerk,
    meta: { 
      requiresAuth: true,
      requiredPermission: ['rendeles_osszkesz', 'szamla_keszit'] // Only users who can complete orders
    }
  },
  {
    path: "/rendelesek/leadott",
    name: "Leadott rendelések",
    component: RendelesLead,
    meta: { 
      requiresAuth: true,
      requiredPermission: 'rendeles_lead' // Only users who can submit orders
    }
  },
  {
    path: "/store",
    name: "Áruház",
    component: StoreMain,
    meta: { 
      requiresAuth: true,
      requiredPermission: 'rendeles_lead'
    }
  },
  {
    path: "/store/:id",
    name: "Partner készlete",
    component: StorePartner,
    meta: {
      requiresAuth: true,
      requiredPermission: 'rendeles_lead'
    }
  },
  {
    path: "/kosar",
    name: "Kosár",
    component: Kosar,
    meta: { 
      requiresAuth: true, 
      requiredPermission: 'rendeles_lead' 
    }
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
    path: "/aszf",
    name: "Általános Szerződési Feltételek",
    component: Aszf,
    meta: { requiresAuth: false }
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
  // Check if route requires admin privileges
  else if (to.meta.requiresAdmin) {
    if (!isAdmin()) {
      // Redirect to home page with error message
      next({ path: '/kezdolap', query: { error: 'admin-only' } });
    } else {
      next();
    }
  }
  // Check if route requires specific permission
  else if (to.meta.requiredPermission) {
    const permission = to.meta.requiredPermission;
    
    // If permission is an array, check if user has ANY of them
    if (Array.isArray(permission)) {
      const hasAnyPermission = permission.some(perm => hasPermission(perm));
      if (!hasAnyPermission && !isAdmin()) {
        // Redirect to home page with error message
        next({ path: '/kezdolap', query: { error: 'insufficient-permissions' } });
      } else {
        next();
      }
    } 
    // If permission is a string, check if user has that specific permission
    else {
      if (!hasPermission(permission) && !isAdmin()) {
        // Redirect to home page with error message
        next({ path: '/kezdolap', query: { error: 'insufficient-permissions' } });
      } else {
        next();
      }
    }
  }
  // Otherwise, proceed
  else {
    next();
  }
});

export default router;