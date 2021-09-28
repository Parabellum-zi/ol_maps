import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import router from './router/index'

const app = createApp(App);
import Axios from "./request/request";
app.config.globalProperties.$axios = Axios;

createApp(App).use(router).mount('#app')
