import { httpApi } from './httpApi.js'

function normalizeError(error) {
    if (error.response) {
        const status = error.response.status
        const backendMsg = error.response.data?.detail || error.response.data?.error

        if (backendMsg) {
            return { status, message: backendMsg }
        }

        switch (status) {
            case 400:
                return { status, message: 'Invalid request (400).' }
            case 401:
                return { status, message: 'Unauthorized (401). Please log in.' }
            case 403:
                return { status, message: 'Forbidden (403). Insufficient permissions.' }
            case 404:
                return { status, message: 'Resource not found (404).' }
            case 409:
                return { status, message: 'Conflict. The request cannot be completed.' }
            case 422:
                return { status, message: 'Unprocessable entity (422). Invalid input.' }
            default:
                return { status, message: `Server error (${status}).` }
        }
    }

    if (error.request) {
        return { status: null, message: 'No response from server. Check your connection.' }
    }

    return { status: null, message: error.message || 'Unknown error.' }
}

// --- Auth endpoints ---

export async function login({ email, password, otp_code }) {
    try {
        const body = { email, password }
        if (otp_code) body.otp_code = otp_code
        const res = await httpApi.post('/auth/login', body)

        if (res.data.access_token) {
            localStorage.setItem('admin_auth_token', res.data.access_token)
        }
        if (res.data.refresh_token) {
            localStorage.setItem('admin_refresh_token', res.data.refresh_token)
        }

        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function setPassword(token, password) {
    try {
        const res = await httpApi.post('/auth/set-password', { token, password })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getOtpSetup() {
    try {
        const res = await httpApi.get('/auth/otp/setup')
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function confirmOtp(code) {
    try {
        const res = await httpApi.post('/auth/otp/confirm', { code })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function resetPassword(email) {
    try {
        const res = await httpApi.post('/auth/reset-password', { email })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export default {
    login,
    setPassword,
    getOtpSetup,
    confirmOtp,
    resetPassword,
}
