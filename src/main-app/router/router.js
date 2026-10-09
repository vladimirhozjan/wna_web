import { createRouter, createWebHistory } from 'vue-router'
import { authModel } from '../scripts/core/authModel.js'
import { applySeoHead } from '../scripts/core/seoHead.js'

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
    {path: '/', name: 'landing', component: LandingPage, meta: {seo: {
        title: 'WhatsNextAction — GTD App for Getting Things Done',
        description: "Stress-free productivity with a GTD app built on David Allen's Getting Things Done: capture, clarify, organize next actions and run your weekly review.",
        jsonLd: 'app',
    }}},
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
    {path: '/billing-history', name: 'billing-history', component: () => import('../views/dashboard/BillingHistoryPage.vue')},
    {path: '/upgrade', name: 'upgrade', component: () => import('../views/dashboard/UpgradePage.vue')},
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
    {path: '/pricing', name: 'pricing', component: () => import('../views/public/PricingPage.vue'), meta: {seo: {
        title: 'Pricing — To-Do List & Task Manager App | WhatsNextAction',
        description: 'Start free, upgrade when you need more. Compare the Free, Pro and Team plans of a productivity app and task manager built on GTD.',
        jsonLd: 'app',
    }}},
    {path: '/help', name: 'help', component: () => import('../views/public/HelpPage.vue'), meta: {seo: {
        title: 'Help & GTD Guides | WhatsNextAction',
        description: 'Guides for the WhatsNextAction GTD app: getting started, Getting Things Done best practices, and answers to frequently asked questions.',
    }}},
    {path: '/help/getting-started', name: 'help-getting-started', component: () => import('../views/public/HelpGettingStartedPage.vue'), meta: {seo: {
        title: 'Getting Started with the GTD App | WhatsNextAction',
        description: 'Set up WhatsNextAction in minutes: capture to your inbox, clarify into next actions and projects, and see what to do next, the Getting Things Done way.',
    }}},
    {path: '/help/faq', name: 'help-faq', component: () => import('../views/public/HelpFaqPage.vue'), meta: {seo: {
        title: 'FAQ — GTD App Questions Answered | WhatsNextAction',
        description: 'Answers about accounts, the inbox, next actions, projects, the weekly review, the calendar, plans and billing in the WhatsNextAction GTD app.',
        jsonLd: 'faq',
    }}},
    {path: '/help/best-practices', name: 'help-best-practices', component: () => import('../views/public/HelpBestPracticesPage.vue'), meta: {seo: {
        title: 'GTD Best Practices & Weekly Review Tips | WhatsNextAction',
        description: 'Practical Getting Things Done habits: a trusted inbox, clear next actions, contexts, and a weekly review that keeps your task manager current.',
    }}},
    {path: '/legal', name: 'legal', redirect: '/legal/terms'},
    {path: '/legal/terms', name: 'legal-terms', component: () => import('../views/public/LegalPage.vue'), props: {doc: 'terms'}, meta: {seo: {
        title: 'Terms of Service | WhatsNextAction',
        description: 'Terms of Service for WhatsNextAction, the GTD productivity app operated by QubForge d.o.o.',
    }}},
    {path: '/legal/privacy', name: 'legal-privacy', component: () => import('../views/public/LegalPage.vue'), props: {doc: 'privacy'}, meta: {seo: {
        title: 'Privacy Policy | WhatsNextAction',
        description: 'How WhatsNextAction collects, uses and protects your personal data under the GDPR.',
    }}},
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

router.afterEach((to, from, failure) => {
    if (!failure) applySeoHead(to)
})