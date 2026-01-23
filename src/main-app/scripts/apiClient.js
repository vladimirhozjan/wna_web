import {httpApi} from './httpApi.js'

function normalizeError(error) {
    // Axios response error
    if (error.response) {
        const status = error.response.status
        const backendMsg = error.response.data?.message || error.response.data?.error

        // Backend message → has priority
        if (backendMsg) {
            return { status, message: backendMsg }
        }

        // Fallback messages by status
        switch (status) {
            case 400:
                return { status, message: "Invalid request (400)." }
            case 401:
                return { status, message: "Unauthorized (401). Please log in." }
            case 403:
                return { status, message: "Forbidden (403). You don't have permission." }
            case 404:
                return { status, message: "Resource not found (404)." }
            case 409:
                return { status, message: "Conflict (409). Resource already exists." }
            case 422:
                return { status, message: "Unprocessable entity (422). Invalid input." }
            default:
                return { status, message: `Server error (${status}).` }
        }
    }

    // Axios request sent but no response (network/server unreachable)
    if (error.request) {
        return { status: null, message: "No response from server. Check your connection." }
    }

    // Anything else (unexpected local error)
    return { status: null, message: error.message || "Unknown error." }
}

function authHeaders() {
    const token = localStorage.getItem('auth_token')
    return { Authorization: `Bearer ${token}` }
}

export async function registerUser({ email, password }) {
    try {
        const res = await httpApi.post('/v1/user/register', { email, password })

        const data = res.data

        if (!data.id || !data.access_token || !data.refresh_token) {
            throw new Error('Unexpected response from server')
        }

        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)

        return data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function loginUser({ email, password }) {
    try {
        const res = await httpApi.post('/v1/user/login', { email, password })
        const data = res.data

        if (!data.access_token || !data.refresh_token) {
            throw new Error('Unexpected response from server')
        }

        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)

        return data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function refreshToken() {
    try {
        const access = localStorage.getItem('auth_token')
        const refresh = localStorage.getItem('refresh_token')

        if (!refresh) {
            throw new Error('Refresh token missing.')
        }

        const res = await httpApi.post(
            '/v1/user/refresh',
            { refresh_token: refresh },
            { headers: { Authorization: `Bearer ${access}` } }
        )

        const data = res.data

        if (!data.access_token || !data.refresh_token) {
            throw new Error('Unexpected response from server')
        }

        // Shranimo nove
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)

        return data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getUser() {
    try {
        const res = await httpApi.get('/v1/user/get', { headers: authHeaders() })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function forgotPassword(email) {
    try {
        const res = await httpApi.post('/v1/user/forgot', { email })
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function resetPassword(password, token) {
    try {
        const res = await httpApi.post('/v1/user/reset', { password, token })
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteUser() {
    try {
        const res = await httpApi.delete('/v1/user/delete', { headers: authHeaders() })

        return res.data || true // DELETE lahko vrača 204 (no content)
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function addStuff({ title, description = "" }) {
    try {
        const res = await httpApi.post('/v1/stuff', { title, description }, { headers: authHeaders() })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateStuff(stuffId, { title, description = "" }) {
    try {
        const res = await httpApi.put(`/v1/stuff/${stuffId}`, { title, description }, { headers: authHeaders() })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getStuff(stuffId) {
    try {
        const res = await httpApi.get(`/v1/stuff/${stuffId}`, { headers: authHeaders() })
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteStuff(stuffId) {
    try {
        const res = await httpApi.delete(`/v1/stuff/${stuffId}`, { headers: authHeaders() })
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listStuff({ limit = 10, cursor = null } = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/stuff', { params }, { headers: authHeaders() })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export function logoutUser() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    delete httpApi.defaults.headers.Authorization
}

const apiClient = {
    loginUser,
    registerUser,
    refreshToken,
    getUser,
    forgotPassword,
    resetPassword,
    deleteUser,
    logoutUser,
    addStuff,
    updateStuff,
    getStuff,
    deleteStuff,
    listStuff,
}

export default apiClient
