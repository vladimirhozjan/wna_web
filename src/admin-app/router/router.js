import { createRouter, createWebHistory } from 'vue-router'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'

import LoginPage from '../views/LoginPage.vue'
import SetPasswordPage from '../views/SetPasswordPage.vue'
import OtpSetupPage from '../views/OtpSetupPage.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import DashboardPage from '../views/DashboardPage.vue'

const routes = [
    // Public routes (AuthLayout)
    {
        path: '/login',
        name: 'login',
        component: LoginPage,
        meta: { requiresAuth: false }
    },
    {
        path: '/set-password',
        name: 'set-password',
        component: SetPasswordPage,
        meta: { requiresAuth: false }
    },

    // OTP-only route (requires JWT with pending_otp_setup)
    {
        path: '/otp-setup',
        name: 'otp-setup',
        component: OtpSetupPage,
        meta: { requiresAuth: true, allowPendingOtp: true }
    },

    // Protected routes (AdminLayout, requires active status)
    {
        path: '/',
        component: AdminLayout,
        meta: { requiresAuth: true },
        children: [
            { path: '', name: 'root', redirect: '/dashboard' },
            {
                path: 'dashboard',
                name: 'dashboard',
                component: DashboardPage,
                meta: { requiresAuth: true, minRole: 'viewer' }
            },
            {
                path: 'users',
                name: 'users',
                component: () => import('../views/UsersPage.vue'),
                meta: { requiresAuth: true, minRole: 'support' }
            },
            {
                path: 'users/:id',
                name: 'user-detail',
                component: () => import('../views/UserDetailPage.vue'),
                meta: { requiresAuth: true, minRole: 'support' }
            },
            {
                path: 'admins',
                name: 'admins',
                component: () => import('../views/AdminUsersPage.vue'),
                meta: { requiresAuth: true, minRole: 'super_admin' }
            },
            {
                path: 'admins/:id',
                name: 'admin-detail',
                component: () => import('../views/AdminUserDetailPage.vue'),
                meta: { requiresAuth: true, minRole: 'super_admin' }
            },
            {
                path: 'content/:userId',
                name: 'content-browser',
                component: () => import('../views/ContentBrowserPage.vue'),
                meta: { requiresAuth: true, minRole: 'support' }
            },
            {
                path: 'gdpr',
                name: 'gdpr',
                component: () => import('../views/GdprRequestsPage.vue'),
                meta: { requiresAuth: true, minRole: 'admin' }
            },
            {
                path: 'health',
                name: 'health',
                component: () => import('../views/SystemHealthPage.vue'),
                meta: { requiresAuth: true, minRole: 'viewer' }
            },
            {
                path: 'analytics',
                name: 'analytics',
                component: () => import('../views/AnalyticsPage.vue'),
                meta: { requiresAuth: true, minRole: 'viewer' }
            },
            {
                path: 'audit',
                name: 'audit',
                component: () => import('../views/AuditLogPage.vue'),
                meta: { requiresAuth: true, minRole: 'admin' }
            },
            {
                path: 'feature-flags',
                name: 'feature-flags',
                component: () => import('../views/FeatureFlagsPage.vue'),
                meta: { requiresAuth: true, minRole: 'admin' }
            },
            {
                path: 'settings',
                name: 'settings',
                component: () => import('../views/AdminSettingsPage.vue'),
                meta: { requiresAuth: true, minRole: 'viewer' }
            },
        ]
    },

    // Catch-all
    { path: '/:pathMatch(.*)*', redirect: '/login' },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition
        return { top: 0 }
    },
})

const auth = authModel()

router.beforeEach((to) => {
    const requiresAuth = to.meta.requiresAuth !== false
    const isAuthenticated = auth.isAuthenticated.value
    const isPending = auth.isPendingOtp.value
    const currentRole = auth.currentAdmin.value?.role

    if (!requiresAuth) {
        if (to.name === 'login' && isAuthenticated && !isPending) {
            return { name: 'dashboard' }
        }
        return
    }

    if (!isAuthenticated) {
        return { name: 'login' }
    }

    if (isPending) {
        if (to.meta.allowPendingOtp) return
        return { name: 'otp-setup' }
    }

    if (to.meta.minRole && !hasMinRole(currentRole, to.meta.minRole)) {
        return { name: 'dashboard' }
    }
})

export default router
