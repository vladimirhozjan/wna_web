import {ref, watch} from 'vue'
import apiClient from './apiClient.js'
import { refreshSession } from './httpApi.js'
import { confirmModel } from './confirmModel.js'
import { captureQueue } from './captureQueue.js'
import { pendingShare } from './pendingShare.js'
import { stuffModel } from '../models/stuffModel.js'
import { statsModel } from '../models/statsModel.js'

window.addEventListener('storage', (event) => {
    if (event.key === 'logout') {
        currentUser.value = null
        isAuthenticated.value = false
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('refresh_token_hash')
        localStorage.removeItem('current_user')
    }
})

window.addEventListener('token_refreshed', async () => {
    try {
        const user = await apiClient.getUser()
        currentUser.value = user
        localStorage.setItem('current_user', JSON.stringify(user))
    } catch { /* ignore — stale profile is acceptable */ }
})

const currentUser = ref(null)
const loading = ref(false)
const error = ref(null)
const isAuthenticated = ref(false)

// Inbox rows and counts loaded this session belong to the user who loaded them: clear them on logout (any kind) and
// when another user signs in without a page reload — the offline Inbox and Sidebar show what is kept
watch(() => currentUser.value?.id, (id, previous) => {
    if (previous == null || id === previous) return
    stuffModel().reset()
    statsModel().setStats(null)
})


export function authModel() {

    async function _init() {
        const token = localStorage.getItem('auth_token')

        if (token) {
            isAuthenticated.value = true

            const savedUser = localStorage.getItem('current_user')
            if (savedUser) {
                currentUser.value = JSON.parse(savedUser)
            }

            if (!currentUser.value?.email) {
                try {
                    await loadUser()
                } catch {
                    // Silently fail — user will be prompted to log in if needed
                }
            }
        }
    }


    async function registerUser(email, password) {
        loading.value = true
        error.value = null

        try {
            return await apiClient.registerUser({ email, password })
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function verifyEmail(token) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.verifyEmail(token)

            if (localStorage.getItem('auth_token')) {
                isAuthenticated.value = true
            }

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function resendVerification(email) {
        loading.value = true
        error.value = null

        try {
            return await apiClient.resendVerification(email)
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function checkVerificationStatus(userId) {
        return await apiClient.checkVerificationStatus(userId)
    }

    async function forgotPassword(email) {
        loading.value = true
        error.value = null

        try {
            return await apiClient.forgotPassword(email)
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function resetPassword(password, token) {
        loading.value = true
        error.value = null

        try {
            return await apiClient.resetPassword(password, token)
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function loginUser(email, password) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.loginUser({ email, password })

            if (data.user) {
                currentUser.value = data.user
                localStorage.setItem('current_user', JSON.stringify(data.user))
            }

            if (localStorage.getItem('auth_token')) {
                isAuthenticated.value = true
            }

            return data

        } catch (err) {
            error.value = err
            throw err

        } finally {
            loading.value = false
        }
    }

    async function googleLogin(idToken) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.googleAuth(idToken)

            if (data.user) {
                currentUser.value = data.user
                localStorage.setItem('current_user', JSON.stringify(data.user))
            }

            if (localStorage.getItem('auth_token')) {
                isAuthenticated.value = true
            }

            return data

        } catch (err) {
            error.value = err
            throw err

        } finally {
            loading.value = false
        }
    }

    async function googleSsoLogin(code, codeVerifier) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.googleSso(code, codeVerifier)

            if (data.user) {
                currentUser.value = data.user
                localStorage.setItem('current_user', JSON.stringify(data.user))
            }

            if (localStorage.getItem('auth_token')) {
                isAuthenticated.value = true
            }

            return data

        } catch (err) {
            error.value = err
            throw err

        } finally {
            loading.value = false
        }
    }

    async function refreshToken() {
        loading.value = true
        error.value = null

        try {
            return await refreshSession()
        } catch (err) {
            error.value = err
            throw err

        } finally {
            loading.value = false
        }
    }

    async function logoutUser() {
        await apiClient.logoutUser()
        currentUser.value = null

        localStorage.removeItem('current_user')
        localStorage.setItem('logout', Date.now())

        isAuthenticated.value = false
    }

    async function loadUser() {
        loading.value = true
        error.value = null

        try {
            const user = await apiClient.getUser()
            currentUser.value = user
            localStorage.setItem('current_user', JSON.stringify(user))
            return user
        } catch (err) {
            error.value = err
            currentUser.value = null
            throw err
        } finally {
            loading.value = false
        }
    }

    // Unsent captures of this user and a pending share are deleted on a confirmed manual logout; a forced logout keeps them
    async function confirmLogout() {
        const queue = captureQueue()
        const pending = await queue.pendingCount()
        const confirmed = await confirmModel().show({
            title: 'Log out',
            message: pending === 0
                ? 'Are you sure you want to log out?'
                : pending === 1
                    ? '1 captured item hasn\'t synced yet. Logging out deletes it from this device.'
                    : `${pending} captured items haven't synced yet. Logging out deletes them from this device.`,
            confirmText: pending ? 'Delete and log out' : 'Log out',
            cancelText: 'Cancel',
        })
        if (confirmed && pending) await queue.clearUser()
        if (confirmed) await pendingShare().remove()
        return confirmed
    }

    async function logoutWithConfirm() {
        if (!await confirmLogout()) return false
        await logoutUser()
        return true
    }

    _init()

    return {
        // state
        currentUser,
        loading,
        error,
        isAuthenticated,

        // actions
        registerUser,
        loginUser,
        googleLogin,
        googleSsoLogin,
        loadUser,
        refreshToken,
        logoutUser,
        confirmLogout,
        logoutWithConfirm,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        checkVerificationStatus
    }
}
