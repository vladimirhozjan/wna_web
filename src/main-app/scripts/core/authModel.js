import {computed, ref} from 'vue'
import apiClient from './apiClient.js'
import { confirmModel } from './confirmModel.js'

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

const currentUser = ref(null)
const loading = ref(false)
const error = ref(null)
const isAuthenticated = ref(false)


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

    async function googleSsoLogin(code) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.googleSso(code)

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
            return await apiClient.refreshTokens()
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

    async function logoutWithConfirm() {
        const confirm = confirmModel()
        const confirmed = await confirm.show({
            title: 'Log out',
            message: 'Are you sure you want to log out?',
            confirmText: 'Log out',
            cancelText: 'Cancel',
        })
        if (!confirmed) return false
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
        logoutWithConfirm,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification
    }
}
