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
import ActionDetailPage from '../views/ActionDetailPage.vue'
import ProjectDetailPage from '../views/ProjectDetailPage.vue'
import CompletedPage from '../views/CompletedPage.vue'
import TrashPage from '../views/TrashPage.vue'
import WaitingForPage from '../views/WaitingForPage.vue'
import RecurringDetailPage from '../views/RecurringDetailPage.vue'
import ReviewPage from '../views/ReviewPage.vue'
import EngagePage from '../views/EngagePage.vue'

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