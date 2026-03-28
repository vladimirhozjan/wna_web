import { ref, computed } from 'vue'
import apiClient from './apiClient.js'

window.addEventListener('storage', (event) => {
    if (event.key === 'admin_logout') {
        currentAdmin.value = null
        isAuthenticated.value = false
        localStorage.removeItem('admin_auth_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_current_user')
    }
})

const ROLE_LEVELS = {
    viewer: 0,
    support: 1,
    admin: 2,
    super_admin: 3
}

const currentAdmin = ref(null)
const loading = ref(false)
const error = ref(null)
const isAuthenticated = ref(false)

const isPendingOtp = computed(() =>
    currentAdmin.value?.status === 'pending_otp_setup'
)

export function hasMinRole(currentRole, requiredRole) {
    return (ROLE_LEVELS[currentRole] ?? -1) >= (ROLE_LEVELS[requiredRole] ?? Infinity)
}

function decodeJwt(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            status: payload.status,
            exp: payload.exp,
        }
    } catch {
        return null
    }
}

export function authModel() {

    function _init() {
        const token = localStorage.getItem('admin_auth_token')
        if (token) {
            const claims = decodeJwt(token)
            if (claims && claims.exp > Math.floor(Date.now() / 1000)) {
                currentAdmin.value = claims
                isAuthenticated.value = true

                const savedAdmin = localStorage.getItem('admin_current_user')
                if (savedAdmin) {
                    try {
                        currentAdmin.value = { ...claims, ...JSON.parse(savedAdmin) }
                    } catch { /* ignore */ }
                }
            } else {
                localStorage.removeItem('admin_auth_token')
                localStorage.removeItem('admin_refresh_token')
                localStorage.removeItem('admin_current_user')
            }
        }
    }

    async function login(email, password, otpCode) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.login({ email, password, otp_code: otpCode })

            const token = localStorage.getItem('admin_auth_token')
            if (token) {
                const claims = decodeJwt(token)
                if (claims) {
                    currentAdmin.value = claims
                    localStorage.setItem('admin_current_user', JSON.stringify(claims))
                    isAuthenticated.value = true
                }
            }

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function setPassword(token, password) {
        loading.value = true
        error.value = null

        try {
            return await apiClient.setPassword(token, password)
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getOtpSetup() {
        loading.value = true
        error.value = null

        try {
            return await apiClient.getOtpSetup()
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function confirmOtp(code) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.confirmOtp(code)

            // After OTP confirm, status transitions to active
            if (currentAdmin.value) {
                currentAdmin.value = { ...currentAdmin.value, status: 'active' }
                localStorage.setItem('admin_current_user', JSON.stringify(currentAdmin.value))
            }

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    function logout() {
        currentAdmin.value = null
        isAuthenticated.value = false
        localStorage.removeItem('admin_auth_token')
        localStorage.removeItem('admin_refresh_token')
        localStorage.removeItem('admin_current_user')
        localStorage.setItem('admin_logout', Date.now().toString())
    }

    _init()

    return {
        currentAdmin,
        loading,
        error,
        isAuthenticated,
        isPendingOtp,

        login,
        setPassword,
        getOtpSetup,
        confirmOtp,
        logout,
        hasMinRole,
    }
}
