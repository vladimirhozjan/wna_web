import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import DashboardHome from '../views/DashboardHome.vue'
import { authModel } from '../scripts/authModel.js'

// Use: router.push({name:'name'}) or <router-link :to="{ name: 'my' }">Dashboard</router-link>
const routes = [
    {path: '/', name: 'landing', component: LandingPage},
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

const auth = authModel()

router.beforeEach((to) => {
    if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
        return { name: 'landing' }
    }
})