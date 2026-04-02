import { httpApi } from './httpApi.js'

function normalizeError(error) {
    if (error.response) {
        const status = error.response.status
        const backendMsg = error.response.data?.detail || error.response.data?.error

        if (backendMsg) {
            return { status, message: backendMsg }
        }

        switch (status) {
            case 400:
                return { status, message: 'Invalid request (400).' }
            case 401:
                return { status, message: 'Unauthorized (401). Please log in.' }
            case 403:
                return { status, message: 'Forbidden (403). Insufficient permissions.' }
            case 404:
                return { status, message: 'Resource not found (404).' }
            case 409:
                return { status, message: 'Conflict. The request cannot be completed.' }
            case 422:
                return { status, message: 'Unprocessable entity (422). Invalid input.' }
            default:
                return { status, message: `Server error (${status}).` }
        }
    }

    if (error.request) {
        return { status: null, message: 'No response from server. Check your connection.' }
    }

    return { status: null, message: error.message || 'Unknown error.' }
}

// --- Auth endpoints ---

export async function login({ email, password, code }) {
    try {
        const body = { email, password }
        if (code) body.code = code
        const res = await httpApi.post('/auth/login', body)

        if (res.data.access_token) {
            localStorage.setItem('admin_auth_token', res.data.access_token)
        }
        if (res.data.refresh_token) {
            localStorage.setItem('admin_refresh_token', res.data.refresh_token)
        }

        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function refreshToken() {
    try {
        const refresh_token = localStorage.getItem('admin_refresh_token')
        if (!refresh_token) throw { status: 401, message: 'No refresh token' }

        const res = await httpApi.post('/auth/refresh', { refresh_token })

        if (res.data.access_token) {
            localStorage.setItem('admin_auth_token', res.data.access_token)
        }

        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function setPassword(token, password) {
    try {
        const res = await httpApi.post('/auth/set-password', { token, password })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getOtpSetup() {
    try {
        const res = await httpApi.get('/auth/otp/setup')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function confirmOtp(code) {
    try {
        const res = await httpApi.post('/auth/otp/confirm', { code })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function resetPassword(email) {
    try {
        const res = await httpApi.post('/auth/reset-password', { email })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Dashboard endpoints ---

export async function getAdminServiceVersion() {
    try {
        const res = await httpApi.get('/version')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getAdminServiceHealth() {
    try {
        const res = await httpApi.get('/health')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getSystemHealth() {
    try {
        const res = await httpApi.get('/admin/system-health')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getDashboardUserOverview() {
    try {
        const res = await httpApi.get('/admin/dashboard/user-overview')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getDashboardPlatformActivity() {
    try {
        const res = await httpApi.get('/admin/dashboard/platform-activity')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getDashboardRecentActivity() {
    try {
        const res = await httpApi.get('/admin/dashboard/recent-activity')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getDashboardSecurityAlerts() {
    try {
        const res = await httpApi.get('/admin/dashboard/security-alerts')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getDashboardGdprRequests() {
    try {
        const res = await httpApi.get('/admin/dashboard/gdpr-requests')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getAuditLog(params = {}) {
    try {
        const res = await httpApi.get('/admin/audit-log', { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function exportAuditLog(params = {}) {
    try {
        const res = await httpApi.get('/admin/audit-log/export', {
            params,
            responseType: params.format === 'json' ? 'json' : 'blob',
        })
        return res
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Platform user management endpoints ---

export async function listPlatformUsers(params = {}) {
    try {
        const res = await httpApi.get('/admin/platform-users', { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getPlatformUser(id) {
    try {
        const res = await httpApi.get(`/admin/platform-users/${id}`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function disablePlatformUser(id) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${id}/disable`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function enablePlatformUser(id) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${id}/enable`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deletePlatformUser(id, emailConfirmation) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${id}/delete`, { email_confirmation: emailConfirmation })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function forceLogoutPlatformUser(id) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${id}/force-logout`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function resetPlatformUserPassword(id) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${id}/reset-password`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function invitePlatformUser(email, tier) {
    try {
        const body = { email }
        if (tier) body.tier = tier
        const res = await httpApi.post('/admin/platform-users/invite', body)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function changePlatformUserTier(id, tier) {
    try {
        const res = await httpApi.put(`/admin/platform-users/${id}/tier`, { tier })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Content browser endpoints ---

export async function getUserItems(userId, params = {}) {
    try {
        const res = await httpApi.get(`/admin/platform-users/${userId}/items`, { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getUserTags(userId) {
    try {
        const res = await httpApi.get(`/admin/platform-users/${userId}/tags`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getUserAttachments(userId, params = {}) {
    try {
        const res = await httpApi.get(`/admin/platform-users/${userId}/attachments`, { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getUserReferenceFiles(userId, params = {}) {
    try {
        const res = await httpApi.get(`/admin/platform-users/${userId}/reference-files`, { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getUserDataStats(userId) {
    try {
        const res = await httpApi.get(`/admin/platform-users/${userId}/data-stats`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- GDPR endpoints ---

export async function listGdprRequests(params = {}) {
    try {
        const res = await httpApi.get('/admin/gdpr-requests', { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getGdprRequest(id) {
    try {
        const res = await httpApi.get(`/admin/gdpr-requests/${id}`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function cancelGdprRequest(id) {
    try {
        const res = await httpApi.post(`/admin/gdpr-requests/${id}/cancel`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function triggerDataExport(userId) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${userId}/data-export`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function triggerAccountDeletion(userId, emailConfirmation) {
    try {
        const res = await httpApi.post(`/admin/platform-users/${userId}/delete-account`, {
            email_confirmation: emailConfirmation,
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Analytics endpoints ---

export async function getSignupStats(params = {}) {
    try {
        const res = await httpApi.get('/admin/analytics/signups', { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getActiveUserStats(params = {}) {
    try {
        const res = await httpApi.get('/admin/analytics/active-users', { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getFeatureUsageStats() {
    try {
        const res = await httpApi.get('/admin/analytics/feature-usage')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getPlatformHealthStats() {
    try {
        const res = await httpApi.get('/admin/analytics/platform-health')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function downloadGdprExport(requestId) {
    try {
        const res = await httpApi.get(`/admin/gdpr-requests/${requestId}/download`, {
            responseType: 'blob',
        })
        return res
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Feature flags endpoints ---

export async function listFeatureFlags() {
    try {
        const res = await httpApi.get('/admin/feature-flags')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getFeatureFlag(id) {
    try {
        const res = await httpApi.get(`/admin/feature-flags/${id}`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function createFeatureFlag(data) {
    try {
        const res = await httpApi.post('/admin/feature-flags', data)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateFeatureFlag(id, data) {
    try {
        const res = await httpApi.put(`/admin/feature-flags/${id}`, data)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteFeatureFlag(id) {
    try {
        const res = await httpApi.delete(`/admin/feature-flags/${id}`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Admin profile endpoints ---

export async function changePassword(currentPassword, newPassword) {
    try {
        const res = await httpApi.put('/admin/profile/password', {
            current_password: currentPassword,
            new_password: newPassword,
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function resetOtp(code) {
    try {
        const res = await httpApi.post('/admin/profile/otp/reset', { code })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// --- Admin user management endpoints ---

export async function listAdmins(params = {}) {
    try {
        const res = await httpApi.get('/admin/users', { params })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function createAdmin(email, role) {
    try {
        const res = await httpApi.post('/admin/users', { email, role })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateAdmin(id, data) {
    try {
        const res = await httpApi.put(`/admin/users/${id}`, data)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function disableAdmin(id) {
    try {
        const res = await httpApi.post(`/admin/users/${id}/disable`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function forceResetAdmin(id) {
    try {
        const res = await httpApi.post(`/admin/users/${id}/force-reset`)
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export default {
    login,
    refreshToken,
    setPassword,
    getOtpSetup,
    confirmOtp,
    resetPassword,
    getAdminServiceVersion,
    getAdminServiceHealth,
    getSystemHealth,
    getDashboardUserOverview,
    getDashboardPlatformActivity,
    getDashboardRecentActivity,
    getDashboardSecurityAlerts,
    getDashboardGdprRequests,
    getAuditLog,
    exportAuditLog,
    listAdmins,
    createAdmin,
    updateAdmin,
    disableAdmin,
    forceResetAdmin,
    listPlatformUsers,
    getPlatformUser,
    disablePlatformUser,
    enablePlatformUser,
    deletePlatformUser,
    forceLogoutPlatformUser,
    resetPlatformUserPassword,
    invitePlatformUser,
    changePlatformUserTier,
    getUserItems,
    getUserTags,
    getUserAttachments,
    getUserReferenceFiles,
    getUserDataStats,
    listGdprRequests,
    getGdprRequest,
    cancelGdprRequest,
    triggerDataExport,
    triggerAccountDeletion,
    getSignupStats,
    getActiveUserStats,
    getFeatureUsageStats,
    getPlatformHealthStats,
    downloadGdprExport,
    listFeatureFlags,
    getFeatureFlag,
    createFeatureFlag,
    updateFeatureFlag,
    deleteFeatureFlag,
    changePassword,
    resetOtp,
}
