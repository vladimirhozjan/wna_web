import { createRouter, createWebHistory } from 'vue-router'
import { authModel } from '../scripts/core/authModel.js'

import LandingPage from '../views/public/LandingPage.vue'
import NextPage from '../views/dashboard/NextPage.vue'
import CalendarPage from '../views/dashboard/CalendarPage.vue'
import InboxPage from '../views/dashboard/InboxPage.vue'
import ProjectsPage from '../views/dashboard/ProjectsPage.vue'
import ReferencePage from '../views/dashboard/ReferencePage.vue'
import SettingsPage from '../views/dashboard/SettingsPage.vue'
import TodayPage from '../views/dashboard/TodayPage.vue'
import SomedayPage from '../views/dashboard/SomedayPage.vue'
import StuffDetailPage from '../views/dashboard/StuffDetailPage.vue'
import ActionDetailPage from '../views/dashboard/ActionDetailPage.vue'
import ProjectDetailPage from '../views/dashboard/ProjectDetailPage.vue'
import CompletedPage from '../views/dashboard/CompletedPage.vue'
import TrashPage from '../views/dashboard/TrashPage.vue'
import WaitingForPage from '../views/dashboard/WaitingForPage.vue'
import RecurringDetailPage from '../views/dashboard/RecurringDetailPage.vue'
import ReviewPage from '../views/dashboard/ReviewPage.vue'
import EngagePage from '../views/dashboard/EngagePage.vue'

// Use: router.push({name:'name'}) or <router-link :to="{ name: 'next' }">Dashboard</router-link>
const routes = [
    {path: '/', name: 'landing', component: LandingPage},
    {path: '/login', name: 'login', component: LandingPage, props: {mode: 'login'}},
    {path: '/register', name: 'register', component: LandingPage, props: {mode: 'register'}},
    {path: '/forgot', name: 'forgot', component: LandingPage, props: {mode: 'forgot'}},
    {path: '/reset', name: 'reset', component: LandingPage, props: {mode: 'reset'}},
    {path: '/engage', name: 'engage', component: EngagePage},
    {path: '/next', name: 'next', component: NextPage},
    {path: '/calendar', name: 'calendar', component: CalendarPage},
    {path: '/inbox', name: 'inbox', component: InboxPage},
    {path: '/projects', name: 'projects', component: ProjectsPage},
    {path: '/reference', name: 'reference', component: ReferencePage},
    {path: '/settings', name: 'settings', component: SettingsPage},
    {path: '/today', name: 'today', component: TodayPage},
    {path: '/someday', name: 'someday', component: SomedayPage},
    {path: '/completed', name: 'completed', component: CompletedPage},
    {path: '/trash', name: 'trash', component: TrashPage},
    {path: '/waiting-for', name: 'waiting-for', component: WaitingForPage},
    {path: '/review', name: 'review', component: ReviewPage},
    {path: '/stuff/:id', name: 'stuff-detail', component: StuffDetailPage},
    {path: '/action/:id', name: 'action-detail', component: ActionDetailPage},
    {path: '/project/:id', name: 'project-detail', component: ProjectDetailPage},
    {path: '/recurring/new', name: 'recurring-new', component: RecurringDetailPage},
    {path: '/recurring/:id', name: 'recurring-detail', component: RecurringDetailPage},
    {path: '/pricing', name: 'pricing', component: () => import('../views/public/PricingPage.vue')},
    {path: '/help', name: 'help', component: () => import('../views/public/HelpPage.vue')},
    {path: '/help/getting-started', name: 'help-getting-started', component: () => import('../views/public/HelpGettingStartedPage.vue')},
    {path: '/help/faq', name: 'help-faq', component: () => import('../views/public/HelpFaqPage.vue')},
    {path: '/help/best-practices', name: 'help-best-practices', component: () => import('../views/public/HelpBestPracticesPage.vue')},
    {path: '/legal', name: 'legal', redirect: '/legal/terms'},
    {path: '/legal/terms', name: 'legal-terms', component: () => import('../views/public/LegalPage.vue'), props: {doc: 'terms'}},
    {path: '/legal/privacy', name: 'legal-privacy', component: () => import('../views/public/LegalPage.vue'), props: {doc: 'privacy'}},
    {path: '/:pathMatch(.*)*', redirect: '/'},
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (to.hash) return {el: to.hash, behavior: 'smooth'}
        if (savedPosition) return savedPosition
        return {top: 0}
    },
})

export default router

const auth = authModel()

router.beforeEach((to) => {
    if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
        return { name: 'landing' }
    }
})