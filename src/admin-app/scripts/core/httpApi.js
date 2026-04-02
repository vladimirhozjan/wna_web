import axios from 'axios'
import { getDomains } from './domains.js'

const { base_url } = getDomains()

export const httpApi = axios.create({
    baseURL: base_url,
    timeout: 30000,
})

const AUTH_PATHS = ['/auth/login', '/auth/refresh', '/auth/set-password', '/auth/reset-password']

function isAuthPath(url) {
    return AUTH_PATHS.some(p => url && url.startsWith(p))
}

let loggingOut = false

function logout() {
    if (loggingOut) return
    loggingOut = true
    localStorage.removeItem('admin_auth_token')
    localStorage.removeItem('admin_refresh_token')
    localStorage.removeItem('admin_current_user')
    localStorage.setItem('admin_logout', Date.now().toString())
    window.location.href = '/login'
}

let refreshPromise = null

function doRefresh() {
    if (loggingOut) return Promise.reject({ status: 401, message: 'Logging out' })
    if (!refreshPromise) {
        const refresh_token = localStorage.getItem('admin_refresh_token')
        refreshPromise = httpApi.post('/auth/refresh', { refresh_token })
            .then(res => {
                if (res.data.access_token) {
                    localStorage.setItem('admin_auth_token', res.data.access_token)
                    window.dispatchEvent(new Event('admin_token_refreshed'))
                }
            })
            .finally(() => { refreshPromise = null })
    }
    return refreshPromise
}

httpApi.interceptors.request.use(async (req) => {
    const access_token = localStorage.getItem('admin_auth_token')
    if (!access_token) return req

    if (isAuthPath(req.url)) return req

    try {
        const payload = JSON.parse(atob(access_token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        const expiresIn = payload.exp - now

        if (expiresIn < 60) {
            try {
                await doRefresh()
                const newToken = localStorage.getItem('admin_auth_token')
                req.headers.Authorization = `Bearer ${newToken}`
                return req
            } catch {
                logout()
                throw new axios.Cancel('Session expired')
            }
        }
    } catch (e) {
        if (axios.isCancel(e)) throw e
    }

    req.headers.Authorization = `Bearer ${access_token}`
    return req
})

httpApi.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalReq = error.config
        if (
            error.response?.status === 401
            && !isAuthPath(originalReq?.url)
            && !originalReq._retried
        ) {
            originalReq._retried = true
            try {
                await doRefresh()
                const newToken = localStorage.getItem('admin_auth_token')
                originalReq.headers.Authorization = `Bearer ${newToken}`
                return httpApi(originalReq)
            } catch {
                logout()
            }
        }
        return Promise.reject(error)
    }
)