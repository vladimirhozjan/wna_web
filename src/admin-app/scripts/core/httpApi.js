import axios from 'axios'
import { getDomains } from './domains.js'

const { base_url } = getDomains()

export const httpApi = axios.create({
    baseURL: base_url,
    timeout: 30000,
})

httpApi.interceptors.request.use(async (req) => {
    const access_token = localStorage.getItem('admin_auth_token')
    if (!access_token) return req

    req.headers.Authorization = `Bearer ${access_token}`
    return req
})

httpApi.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('admin_auth_token')
            localStorage.removeItem('admin_refresh_token')
            localStorage.removeItem('admin_current_user')
            localStorage.setItem('admin_logout', Date.now().toString())
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)
