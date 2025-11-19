import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import DashboardHome from '../views/DashboardHome.vue'

// Use: router.push({name:'name'}) or <router-link :to="{ name: 'my' }">Dashboard</router-link>
const routes = [
    {path: '/', name: 'landing', component: LandingPage, props: {mode: null}},
    {path: '/login', name: 'login', component: LandingPage, props: {mode: 'login'}},
    {path: '/register', name: 'register', component: LandingPage, props: {mode: 'register'}},
    {path: '/forgot', name: 'forgot', component: LandingPage, props: {mode: 'forgot'}},
    {path: '/my', name: 'my', component: DashboardHome},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router