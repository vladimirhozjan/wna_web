import axios from 'axios'
import apiClient from './apiClient.js'
import {getDomains} from './domains.js'

const { base_url } = getDomains()

export const httpApi = axios.create({
    baseURL: base_url,
    timeout: 30000,
})

httpApi.interceptors.request.use(async (req) => {
    const access_token = localStorage.getItem('auth_token')
    if (!access_token) return req

    if (req.url && req.url.startsWith('/v1/user/refresh')) {
        const refresh_token = localStorage.getItem('refresh_token')
        if (!refresh_token) return req
        
        req.headers.Authorization = `Bearer ${refresh_token}`
        return req
    }

    const payload = JSON.parse(atob(access_token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - now

    if (expiresIn < 0) {
        try {
            const refreshed = await apiClient.refreshToken()
            const newToken = refreshed.access_token
            req.headers.Authorization = `Bearer ${newToken}`
            return req
        } catch (e) {
            console.error("Refresh failed:", e)
        }
    }

    // Otherwise use existing token
    req.headers.Authorization = `Bearer ${access_token}`
    return req
})
