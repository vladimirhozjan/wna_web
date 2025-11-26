import axios from 'axios'
import apiClient from './apiClient.js'

// Decode JWT without verifying signature (not needed)
function decodeJwt(token) {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    try {
        return JSON.parse(atob(parts[1]))
    } catch {
        return null
    }
}

let isRefreshing = false
let refreshPromise = null

export const httpApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    timeout: 30000,
})

httpApi.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('auth_token')
    if (!token) return config

    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = payload.exp - now
    const limit = payload.exp / 10

    // If token expires in < 60 seconds → refresh
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
