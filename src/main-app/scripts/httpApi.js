import axios from 'axios'
import apiClient from './apiClient.js'

const { base_url } = window.getDomains()

export const httpApi = axios.create({
    baseURL: base_url,
    timeout: 30000,
})

httpApi.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('auth_token')
    if (!token) return config

    if (config.url && config.url.startsWith('/v1/user/refresh')) {
        config.headers.Authorization = `Bearer ${token}`
        return config
    }

    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - now
    const limit = payload.exp / 10

    //todo: naredi kontra po 10min uporabe, za test, kasneje 30 dni, po 24h novi token
    if (expiresIn < limit) {
        try {
            const refreshed = await apiClient.refreshToken()
            const newToken = refreshed.access_token
            config.headers.Authorization = `Bearer ${newToken}`
            return config
        } catch (e) {
            console.error("Refresh failed:", e)
        }
    }

    // Otherwise use existing token
    config.headers.Authorization = `Bearer ${token}`
    return config
})
