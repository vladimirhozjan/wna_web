import {computed, ref} from 'vue'
import {forgotPassword as apiForgotPassword, getUser, loginUser, logout as apiLogout, refreshTokens, registerUser} from './authClient.js'

window.addEventListener('storage', (event) => {
    if (event.key === 'logout') {
        currentUser.value = null
        isAuthenticated.value = false
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
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
        }
    }


    async function register(email, password) {
        loading.value = true
        error.value = null

        try {
            const data = await registerUser({ email, password })

            if (data.user) {
                currentUser.value = data.user
                localStorage.setItem('current_user', JSON.stringify(data.user))
            }

            if (localStorage.getItem('auth_token')) {
                isAuthenticated.value = true
            }

            return data

        } catch (err) {
            error.value = err     // { status, message }
            throw err

        } finally {
            loading.value = false
        }
    }

    async function forgotPassword(email) {
        loading.value = true
        error.value = null

        try {
            return await apiForgotPassword(email)
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function login(email, password) {
        loading.value = true
        error.value = null

        try {
            const data = await loginUser({ email, password })

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

    async function refresh() {
        loading.value = true
        error.value = null

        try {
            const data = await refreshTokens()
            return data

        } catch (err) {
            error.value = err
            throw err

        } finally {
            loading.value = false
        }
    }

    function logout() {
        apiLogout()
        currentUser.value = null

        localStorage.removeItem('current_user')
        localStorage.setItem('logout', Date.now())

        isAuthenticated.value = false
    }

    async function loadUser(userId) {
        loading.value = true
        error.value = null

        try {
            const user = await getUser(userId)   // <-- from authTools.js
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

    _init()

    return {
        // state
        currentUser,
        loading,
        error,
        isAuthenticated,

        // actions
        register,
        login,
        loadUser,
        refresh,
        logout,
        forgotPassword
    }
}
