import axios from 'axios'
import apiClient from './apiClient.js'
import {getDomains} from './domains.js'

const { base_url } = getDomains()

export const httpApi = axios.create({
    baseURL: base_url,
    timeout: 30000,
})

const AUTH_PATHS = ['/v1/user/login', '/v1/user/refresh', '/v1/user/register', '/v1/user/reset-password', '/v1/user/verify-email']

function isAuthPath(url) {
    return AUTH_PATHS.some(p => url && url.startsWith(p))
}

let loggingOut = false

function logout() {
    if (loggingOut) return
    loggingOut = true
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('refresh_token_hash')
    localStorage.removeItem('current_user')
    localStorage.setItem('logout', Date.now().toString())
    window.location.href = '/'
}

let refreshPromise = null

function doRefresh() {
    if (loggingOut) return Promise.reject({ status: 401, message: 'Logging out' })
    if (!refreshPromise) {
        refreshPromise = apiClient.refreshToken()
            .then(data => {
                window.dispatchEvent(new Event('token_refreshed'))
                return data
            })
            .finally(() => { refreshPromise = null })
    }
    return refreshPromise
}

httpApi.interceptors.request.use(async (req) => {
    const access_token = localStorage.getItem('auth_token')
    if (!access_token) return req

    if (req.url && req.url.startsWith('/v1/user/refresh')) {
        const refresh_token = localStorage.getItem('refresh_token')
        if (!refresh_token) return req

        req.headers.Authorization = `Bearer ${refresh_token}`
        return req
    }

    try {
        const payload = JSON.parse(atob(access_token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        const expiresIn = payload.exp - now

        if (expiresIn < 60) {
            try {
                const refreshed = await doRefresh()
                const newToken = refreshed.access_token
                req.headers.Authorization = `Bearer ${newToken}`

                if (req.params?.refresh_token_hash) {
                    const newRefresh = localStorage.getItem('refresh_token')
                    if (newRefresh) {
                        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(newRefresh))
                        req.params.refresh_token_hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
                    }
                }

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
                const newToken = localStorage.getItem('auth_token')
                originalReq.headers.Authorization = `Bearer ${newToken}`
                return httpApi(originalReq)
            } catch {
                logout()
            }
        }
        return Promise.reject(error)
    }
)