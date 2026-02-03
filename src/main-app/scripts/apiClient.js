import {httpApi} from './httpApi.js'

function normalizeError(error) {
    // Axios response error
    if (error.response) {
        const status = error.response.status
        const backendMsg = error.response.data?.message || error.response.data?.error

        // Backend message → has priority
        if (backendMsg) {
            return {status, message: backendMsg}
        }

        // Fallback messages by status
        switch (status) {
            case 400:
                return {status, message: "Invalid request (400)."}
            case 401:
                return {status, message: "Unauthorized (401). Please log in."}
            case 403:
                return {status, message: "Forbidden (403). You don't have permission."}
            case 404:
                return {status, message: "Resource not found (404)."}
            case 409:
                return {status, message: "Conflict (409). Resource already exists."}
            case 422:
                return {status, message: "Unprocessable entity (422). Invalid input."}
            default:
                return {status, message: `Server error (${status}).`}
        }
    }

    // Axios request sent but no response (network/server unreachable)
    if (error.request) {
        return {status: null, message: "No response from server. Check your connection."}
    }

    // Anything else (unexpected local error)
    return {status: null, message: error.message || "Unknown error."}
}

function authHeaders() {
    const token = localStorage.getItem('auth_token')
    return {Authorization: `Bearer ${token}`}
}

export async function registerUser({email, password}) {
    try {
        const res = await httpApi.post('/v1/user/register', {email, password})

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

export async function loginUser({email, password}) {
    try {
        const res = await httpApi.post('/v1/user/login', {email, password})
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
            {refresh_token: refresh},
            {headers: {Authorization: `Bearer ${access}`}}
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
        const res = await httpApi.get('/v1/user/get', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function forgotPassword(email) {
    try {
        const res = await httpApi.post('/v1/user/forgot', {email})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function resetPassword(password, token) {
    try {
        const res = await httpApi.post('/v1/user/reset', {password, token})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteUser() {
    try {
        const res = await httpApi.delete('/v1/user/delete', {headers: authHeaders()})

        return res.data || true // DELETE lahko vrača 204 (no content)
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function addStuff({title, description = ""}) {
    try {
        const res = await httpApi.post('/v1/inbox', {title, description}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateStuff(stuffId, {title, description = ""}) {
    try {
        const res = await httpApi.put(`/v1/inbox/${stuffId}`, {title, description}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getStuff(stuffId) {
    try {
        const res = await httpApi.get(`/v1/inbox/${stuffId}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getStuffByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/inbox/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteStuff(stuffId) {
    try {
        const res = await httpApi.delete(`/v1/inbox/${stuffId}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function moveStuff(stuffId, destination) {
    try {
        const res = await httpApi.post(`/v1/inbox/${stuffId}/move`, {destination}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listStuff({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/inbox', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function inboxCount() {
    try {
        const res = await httpApi.get(`/v1/inbox/count`, {headers: authHeaders()})
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

// ── Clarify API ──

export async function clarifyToAction(stuffId, actionData) {
    try {
        const body = {
            target: 'action',
            title: actionData.title,
        }
        if (actionData.description) body.description = actionData.description
        if (actionData.dueDate) body.due_date = actionData.dueDate
        if (actionData.deferUntil) body.start_date = actionData.deferUntil

        const res = await httpApi.post(`/v1/inbox/${stuffId}/transform`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clarifyToProject(stuffId, projectData) {
    try {
        const body = {
            target: 'project',
            title: projectData.title,
        }
        if (projectData.description) body.description = projectData.description
        if (projectData.outcome) body.outcome = projectData.outcome

        const res = await httpApi.post(`/v1/inbox/${stuffId}/transform`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clarifyToReference(stuffId) {
    try {
        const res = await httpApi.patch(`/v1/inbox/${stuffId}`, {state: 'reference'}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clarifyToSomeday(stuffId) {
    try {
        const res = await httpApi.patch(`/v1/inbox/${stuffId}`, {state: 'someday'}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function completeStuff(stuffId) {
    try {
        const res = await httpApi.patch(`/v1/inbox/${stuffId}`, {state: 'completed'}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clarifyToTrash(stuffId) {
    return deleteStuff(stuffId)
}

// ── Action API ──

export async function addAction(data) {
    try {
        const body = {title: data.title}
        if (data.description) body.description = data.description
        if (data.project_id) body.project_id = data.project_id
        if (data.start_date) body.start_date = data.start_date
        if (data.start_time) body.start_time = data.start_time
        if (data.scheduled_date) body.scheduled_date = data.scheduled_date
        if (data.scheduled_time) body.scheduled_time = data.scheduled_time
        if (data.due_date) body.due_date = data.due_date
        if (data.due_time) body.due_time = data.due_time
        if (data.recurrence_rule) body.recurrence_rule = data.recurrence_rule
        if (data.waiting_for) body.waiting_for = data.waiting_for
        if (data.waiting_since) body.waiting_since = data.waiting_since
        if (data.comments_json) body.comments_json = data.comments_json
        if (data.tags) body.tags = data.tags

        const res = await httpApi.post('/v1/action', body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateAction(actionId, data) {
    try {
        const body = {title: data.title}
        if (data.description !== undefined) body.description = data.description
        if (data.state) body.state = data.state
        if (data.project_id) body.project_id = data.project_id
        if (data.start_date) body.start_date = data.start_date
        if (data.start_time) body.start_time = data.start_time
        if (data.scheduled_date) body.scheduled_date = data.scheduled_date
        if (data.scheduled_time) body.scheduled_time = data.scheduled_time
        if (data.due_date) body.due_date = data.due_date
        if (data.due_time) body.due_time = data.due_time
        if (data.recurrence_rule) body.recurrence_rule = data.recurrence_rule
        if (data.waiting_for) body.waiting_for = data.waiting_for
        if (data.waiting_since) body.waiting_since = data.waiting_since
        if (data.comments_json) body.comments_json = data.comments_json
        if (data.tags) body.tags = data.tags

        const res = await httpApi.put(`/v1/action/${actionId}`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getAction(actionId) {
    try {
        const res = await httpApi.get(`/v1/action/${actionId}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listActions({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/nextActions', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteAction(actionId) {
    try {
        const res = await httpApi.delete(`/v1/action/${actionId}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function moveAction(actionId, destination) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/move`, {destination}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function nextActionCount() {
    try {
        const res = await httpApi.get(`/v1/nextActions/count`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Project API ──

export async function addProject(data) {
    try {
        const body = {title: data.title}
        if (data.description) body.description = data.description
        if (data.outcome) body.outcome = data.outcome

        const res = await httpApi.post('/v1/project', body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateProject(projectId, data) {
    try {
        const body = {title: data.title}
        if (data.description !== undefined) body.description = data.description
        if (data.outcome !== undefined) body.outcome = data.outcome

        const res = await httpApi.put(`/v1/project/${projectId}`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getProject(projectId) {
    try {
        const res = await httpApi.get(`/v1/project/${projectId}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listProjects({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/projects', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteProject(projectId) {
    try {
        const res = await httpApi.delete(`/v1/project/${projectId}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function moveProject(projectId, destination) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/move`, {destination}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function projectsCount() {
    try {
        const res = await httpApi.get(`/v1/projects/count`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
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
    getStuffByPosition,
    deleteStuff,
    moveStuff,
    listStuff,
    inboxCount,
    // Clarify API stubs
    clarifyToAction,
    clarifyToProject,
    clarifyToReference,
    clarifyToSomeday,
    completeStuff,
    clarifyToTrash,
    addAction,
    updateAction,
    getAction,
    listActions,
    deleteAction,
    moveAction,
    nextActionCount,
    addProject,
    updateProject,
    getProject,
    listProjects,
    deleteProject,
    moveProject,
    projectsCount,
}

export default apiClient
