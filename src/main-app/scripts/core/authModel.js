import {ref, watch} from 'vue'
import apiClient from './apiClient.js'
import { refreshSession } from './httpApi.js'
import { liveClient } from './liveClient.js'
import { confirmModel } from './confirmModel.js'
import { captureQueue } from './captureQueue.js'
import { pendingShare } from './pendingShare.js'
import { signupUtm } from './visitTracker.js'
import { stuffModel } from '../models/stuffModel.js'
import { statsModel } from '../models/statsModel.js'
import { notificationModel } from '../models/notificationModel.js'

window.addEventListener('storage', (event) => {
    if (event.key === 'logout') {
        liveClient.stop()
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

let accountLiveSubscribed = false
let profileReread = false

// A failed re-read keeps the user as they are
async function refreshUser() {
    try {
        const user = await apiClient.getUser()
        if (!isAuthenticated.value) return
        currentUser.value = user
        localStorage.setItem('current_user', JSON.stringify(user))
    } catch { /* stale profile is acceptable */ }
}

// A sign-in return target must stay on this site: a relative path, not `//host` and no `\` (browsers read it as `/`)
export function validReturnPath(path) {
    if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('\\')) return path
    return null
}

export function authModel() {

    // Own profile, tier or timezone changed elsewhere (live `account`); null = anything may have changed
    if (!accountLiveSubscribed) {
        accountLiveSubscribed = true
        liveClient.subscribe(changes => {
            if (!isAuthenticated.value || (changes && !changes.some(c => c.entity === 'account'))) return
            return refreshUser()
        })
    }

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
            } else if (!currentUser.value.profile_limits && !profileReread) {
                // Kept from before profiles: re-read once for name, picture and their limits
                profileReread = true
                refreshUser()
            }
        }
    }


    async function registerUser(email, password) {
        loading.value = true
        error.value = null

        try {
            return await apiClient.registerUser({ email, password, signupUtm: signupUtm() })
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
                await notificationModel().onSignIn()
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
                await notificationModel().onSignIn()
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
                await notificationModel().onSignIn()
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

    async function googleSsoLogin(code, codeVerifier, utm) {
        return ssoLogin(() => apiClient.googleSso(code, codeVerifier, utm))
    }

    async function appleSsoLogin(code, nonce, name, utm) {
        return ssoLogin(() => apiClient.appleSso(code, nonce, name, utm))
    }

    async function ssoLogin(signIn) {
        loading.value = true
        error.value = null

        try {
            const data = await signIn()

            if (data.user) {
                currentUser.value = data.user
                localStorage.setItem('current_user', JSON.stringify(data.user))
            }

            if (localStorage.getItem('auth_token')) {
                await notificationModel().onSignIn()
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
        liveClient.stop()
        await notificationModel().onSignOut()
        await apiClient.logoutUser()
        currentUser.value = null

        localStorage.removeItem('current_user')
        localStorage.setItem('logout', Date.now())

        isAuthenticated.value = false
    }

    // The server ends every session with the account: sign out locally without the logout call; unsent captures go too
    async function deleteAccount() {
        await apiClient.deleteUser()
        localStorage.removeItem('refresh_token')
        await captureQueue().clearUser()
        await pendingShare().remove()
        await logoutUser()
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

    function patchUser(fields) {
        if (!currentUser.value) return
        currentUser.value = { ...currentUser.value, ...fields }
        localStorage.setItem('current_user', JSON.stringify(currentUser.value))
    }

    async function setName(name) {
        const data = await apiClient.updateUserName(name)
        patchUser({ name: data?.name ?? null })
        return data
    }

    async function setPicture(file) {
        const data = await apiClient.uploadUserPicture(file)
        patchUser({ picture_url: data?.picture_url ?? null })
        return data
    }

    async function removePicture() {
        const data = await apiClient.removeUserPicture()
        patchUser({ picture_url: null })
        return data
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

    // Google / Apple sign-in leaves the site: keep the pending return path across the provider round trip
    function rememberReturnPath(path) {
        const valid = validReturnPath(path)
        if (valid) sessionStorage.setItem('auth_return_path', valid)
        else sessionStorage.removeItem('auth_return_path')
    }

    function takeReturnPath() {
        const path = validReturnPath(sessionStorage.getItem('auth_return_path'))
        sessionStorage.removeItem('auth_return_path')
        return path
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
        appleSsoLogin,
        loadUser,
        setName,
        setPicture,
        removePicture,
        refreshToken,
        logoutUser,
        confirmLogout,
        logoutWithConfirm,
        rememberReturnPath,
        takeReturnPath,
        deleteAccount,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        checkVerificationStatus
    }
}
