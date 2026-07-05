import { createRouter, createWebHistory } from 'vue-router'
import { authModel } from '../scripts/core/authModel.js'

import LandingPage from '../views/public/LandingPage.vue'
import NextPage from '../views/dashboard/NextPage.vue'
import CalendarPage from '../views/dashboard/CalendarPage.vue'
import InboxPage from '../views/dashboard/InboxPage.vue'
import ProjectsPage from '../views/dashboard/ProjectsPage.vue'
import ReferencePage from '../views/dashboard/ReferencePage.vue'
import SettingsPage from '../views/dashboard/SettingsPage.vue'
import ConnectionsPage from '../views/dashboard/ConnectionsPage.vue'
import TodayPage from '../views/dashboard/TodayPage.vue'
import SomedayPage from '../views/dashboard/SomedayPage.vue'
import StuffDetailPage from '../views/dashboard/StuffDetailPage.vue'
import ActionDetailPage from '../views/dashboard/ActionDetailPage.vue'
import ProjectDetailPage from '../views/dashboard/ProjectDetailPage.vue'
import TrashPage from '../views/dashboard/TrashPage.vue'
import WaitingForPage from '../views/dashboard/WaitingForPage.vue'
import RecurringDetailPage from '../views/dashboard/RecurringDetailPage.vue'
import ReviewPage from '../views/dashboard/ReviewPage.vue'
import EngagePage from '../views/dashboard/EngagePage.vue'
import OverduePage from '../views/dashboard/OverduePage.vue'
import VerifyEmailPage from '../views/public/VerifyEmailPage.vue'
import GoogleSsoPage from '../views/public/GoogleSsoPage.vue'

// Use: router.push({name:'name'}) or <router-link :to="{ name: 'next' }">Dashboard</router-link>
const routes = [
    {path: '/', name: 'landing', component: LandingPage},
    {path: '/login', name: 'login', component: LandingPage, props: {mode: 'login'}},
    {path: '/register', name: 'register', component: LandingPage, props: {mode: 'register'}},
    {path: '/forgot', name: 'forgot', component: LandingPage, props: {mode: 'forgot'}},
    {path: '/reset', name: 'reset', component: LandingPage, props: {mode: 'reset'}},
    {path: '/reset-password', name: 'reset-password', component: LandingPage, props: route => ({mode: 'reset', token: route.query.token || ''})},
    {path: '/verify', name: 'verify-email', component: VerifyEmailPage},
    {path: '/google/sso', name: 'google-sso', component: GoogleSsoPage},
    {path: '/engage', name: 'engage', component: EngagePage},
    {path: '/next', name: 'next', component: NextPage},
    {path: '/calendar', name: 'calendar', component: CalendarPage},
    {path: '/inbox', name: 'inbox', component: InboxPage},
    {path: '/projects', name: 'projects', component: ProjectsPage},
    {path: '/reference', name: 'reference', component: ReferencePage},
    {path: '/settings', name: 'settings', component: SettingsPage},
    // Preserve extra query params — the Paywiser checkout returns to /settings/billing?status=…
    {path: '/settings/:section', redirect: to => ({path: '/settings', query: {...to.query, section: to.params.section}})},
    {path: '/connections', name: 'connections', component: ConnectionsPage},
    {path: '/today', name: 'today', component: TodayPage},
    {path: '/someday', name: 'someday', component: SomedayPage},
    // Lazy-loaded so chart.js (used only here) is code-split out of the main chunk.
    {path: '/completed', name: 'completed', component: () => import('../views/dashboard/CompletedPage.vue')},
    {path: '/trash', name: 'trash', component: TrashPage},
    {path: '/waiting-for', name: 'waiting-for', component: WaitingForPage},
    {path: '/review', name: 'review', component: ReviewPage},
    {path: '/overdue', name: 'overdue', component: OverduePage},
    {path: '/stuff/:id', name: 'stuff-detail', component: StuffDetailPage},
    {path: '/action/:id', name: 'action-detail', component: ActionDetailPage},
    {path: '/project/:id', name: 'project-detail', component: ProjectDetailPage},
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

const PUBLIC_ROUTE_NAMES = new Set([
    'landing', 'login', 'register', 'forgot', 'reset', 'reset-password',
    'verify-email', 'google-sso', 'pricing',
    'help', 'help-getting-started', 'help-faq', 'help-best-practices',
    'legal', 'legal-terms', 'legal-privacy',
])

router.beforeEach((to) => {
    if (PUBLIC_ROUTE_NAMES.has(to.name)) return
    if (auth.isAuthenticated.value) return
    return { name: 'login', query: { redirect: to.fullPath } }
})