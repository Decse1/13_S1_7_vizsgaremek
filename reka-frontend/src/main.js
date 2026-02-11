import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import * as BootstrapVueNext from "bootstrap-vue-next";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-vue-next/dist/bootstrap-vue-next.css";
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/fonts.css' // Import after Bootstrap to override fonts

// Import Icons component for global registration
import Icons from './components/Icons.vue'

const app = createApp(App);
app.use(router);
app.use(BootstrapVueNext);

// Register Icons component globally
app.component('Icons', Icons);

app.mount("#app");
