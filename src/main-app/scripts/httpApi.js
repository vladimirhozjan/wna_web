import axios from 'axios'

export const httpApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    timeout: 30000,
})

httpApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

