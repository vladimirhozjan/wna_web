import axios from 'axios'
import { getDomains } from './domains.js'

const { base_url } = getDomains()

export const httpApi = axios.create({
    baseURL: base_url,
    timeout: 30000,
})

// Paths that should not trigger 401 redirect or auto-refresh
const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/set-password', '/auth/reset-password']

function isAuthPath(url) {
    return AUTH_PATHS.some(p => url && url.startsWith(p))
}

let refreshPromise = null

httpApi.interceptors.request.use(async (req) => {
    const access_token = localStorage.getItem('admin_auth_token')
    if (!access_token) return req

    // Don't attach token or auto-refresh for public auth endpoints
    if (isAuthPath(req.url)) return req

    // Check if token is about to expire (within 60s)
    try {
        const payload = JSON.parse(atob(access_token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        const expiresIn = payload.exp - now

        if (expiresIn < 60) {
            // Token about to expire — refresh it (inline to avoid circular import)
            if (!refreshPromise) {
                const refresh_token = localStorage.getItem('admin_refresh_token')
                refreshPromise = httpApi.post('/auth/refresh', { refresh_token })
                    .then(res => {
                        if (res.data.access_token) {
                            localStorage.setItem('admin_auth_token', res.data.access_token)
                        }
                    })
                    .finally(() => { refreshPromise = null })
            }
            try {
                await refreshPromise
                const newToken = localStorage.getItem('admin_auth_token')
                req.headers.Authorization = `Bearer ${newToken}`
                return req
            } catch {
                // Refresh failed — clear auth and redirect
                localStorage.removeItem('admin_auth_token')
                localStorage.removeItem('admin_refresh_token')
                localStorage.removeItem('admin_current_user')
                localStorage.setItem('admin_logout', Date.now().toString())
                window.location.href = '/login'
                throw new axios.Cancel('Session expired')
            }
        }
    } catch {
        // Token decode failed — use it as-is, let the server reject it
    }

    req.headers.Authorization = `Bearer ${access_token}`
    return req
})

httpApi.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect on 401 for auth endpoints (login, refresh, etc.)
        if (error.response?.status === 401 && !isAuthPath(error.config?.url)) {
            localStorage.removeItem('admin_auth_token')
            localStorage.removeItem('admin_refresh_token')
            localStorage.removeItem('admin_current_user')
            localStorage.setItem('admin_logout', Date.now().toString())
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)
