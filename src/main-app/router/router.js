import { createRouter, createWebHistory } from 'vue-router'
import { authModel } from '../scripts/authModel.js'

import LandingPage from '../views/LandingPage.vue'
import NextPage from '../views/NextPage.vue'
import CalendarPage from '../views/CalendarPage.vue'
import InboxPage from '../views/InboxPage.vue'
import ProjectsPage from '../views/ProjectsPage.vue'
import ReferencePage from '../views/ReferencePage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import TodayPage from '../views/TodayPage.vue'
import SomedayPage from '../views/SomedayPage.vue'
import StuffDetailPage from '../views/StuffDetailPage.vue'

// Use: router.push({name:'name'}) or <router-link :to="{ name: 'next' }">Dashboard</router-link>
const routes = [
    {path: '/', name: 'landing', component: LandingPage},
    {path: '/login', name: 'login', component: LandingPage, props: {mode: 'login'}},
    {path: '/register', name: 'register', component: LandingPage, props: {mode: 'register'}},
    {path: '/forgot', name: 'forgot', component: LandingPage, props: {mode: 'forgot'}},
    {path: '/reset', name: 'reset', component: LandingPage, props: {mode: 'reset'}},
    {path: '/next', name: 'next', component: NextPage},
    {path: '/calendar', name: 'calendar', component: CalendarPage},
    {path: '/inbox', name: 'inbox', component: InboxPage},
    {path: '/projects', name: 'projects', component: ProjectsPage},
    {path: '/reference', name: 'reference', component: ReferencePage},
    {path: '/settings', name: 'settings', component: SettingsPage},
    {path: '/today', name: 'today', component: TodayPage},
    {path: '/someday', name: 'someday', component: SomedayPage},
    {path: '/stuff/:id', name: 'stuff-detail', component: StuffDetailPage},
    {path: '/:pathMatch(.*)*', redirect: '/'},
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