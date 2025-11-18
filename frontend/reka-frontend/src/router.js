import { createRouter, createWebHistory } from "vue-router";
import Kezdolap from "./pages/Kezdolap.vue";
import Raktar from "./pages/Raktar.vue";

const routes = [
{ path: "/kezdolap", name: "Kezdőlap", component: Kezdolap },
{ path: "/raktar", name: "Raktár", component: Raktar }
];

const router = createRouter({
history: createWebHistory(),
routes
});


export default router;