import { createRouter, createWebHistory } from "vue-router";
const routes = [
  {
    path: '/',
    redirect: '/typhoon'
  },
  {
    path: "/typhoon",
    component:() => import("@/components/TyphoonPath.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
