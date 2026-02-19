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
            // noinspection ExceptionCaughtLocallyJS
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
            // noinspection ExceptionCaughtLocallyJS
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
            // noinspection ExceptionCaughtLocallyJS
            throw new Error('Refresh token missing.')
        }

        const res = await httpApi.post(
            '/v1/user/refresh',
            {refresh_token: refresh},
            {headers: {Authorization: `Bearer ${access}`}}
        )

        const data = res.data

        if (!data.access_token || !data.refresh_token) {
            // noinspection ExceptionCaughtLocallyJS
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

export async function changePassword(currentPassword, newPassword) {
    try {
        const refreshToken = localStorage.getItem('refresh_token')
        const refreshTokenHash = await hashRefreshToken(refreshToken)
        const res = await httpApi.post('/v1/user/change-password', {
            current_password: currentPassword,
            new_password: newPassword,
            refresh_token_hash: refreshTokenHash
        }, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

async function hashRefreshToken(refreshToken) {
    if (!refreshToken) return null
    const encoder = new TextEncoder()
    const data = encoder.encode(refreshToken)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function listSessions() {
    try {
        const refreshToken = localStorage.getItem('refresh_token')
        const refreshTokenHash = await hashRefreshToken(refreshToken)
        const res = await httpApi.get('/v1/user/sessions', {
            params: refreshTokenHash ? {refresh_token_hash: refreshTokenHash} : {},
            headers: authHeaders()
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function revokeSession(sessionId) {
    try {
        const res = await httpApi.delete(`/v1/user/sessions/${sessionId}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function revokeAllSessions() {
    try {
        const refreshToken = localStorage.getItem('refresh_token')
        const refreshTokenHash = await hashRefreshToken(refreshToken)
        const res = await httpApi.delete('/v1/user/sessions', {
            data: {refresh_token_hash: refreshTokenHash},
            headers: authHeaders()
        })
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function addStuff({title, description = "", position = null}) {
    try {
        const body = {title, description}
        if (position !== null) body.position = position
        const res = await httpApi.post('/v1/stuff', body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateStuff(stuffId, {title, description = ""}) {
    try {
        const res = await httpApi.put(`/v1/stuff/${stuffId}`, {title, description}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getStuff(stuffId) {
    try {
        const res = await httpApi.get(`/v1/stuff/${stuffId}`, {headers: authHeaders()})
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
        const res = await httpApi.delete(`/v1/stuff/${stuffId}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function trashStuff(stuffId) {
    try {
        const res = await httpApi.post(`/v1/stuff/${stuffId}/trash`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function moveStuff(stuffId, destination) {
    try {
        const res = await httpApi.post(`/v1/stuff/${stuffId}/move`, {destination}, {headers: authHeaders()})
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
        const res = await httpApi.get(`/v1/stuff/count`, {headers: authHeaders()})
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
        if (actionData.tags?.length) body.tags = actionData.tags

        // Deferred dates
        if (actionData.deferType === 'scheduled' && actionData.deferDate) {
            body.scheduled_date = actionData.deferDate
            if (actionData.deferTime) body.scheduled_time = actionData.deferTime
        } else if (actionData.deferType === 'start' && actionData.deferDate) {
            body.start_date = actionData.deferDate
            if (actionData.deferTime) body.start_time = actionData.deferTime
        }

        // Due date
        if (actionData.dueDate) {
            body.due_date = actionData.dueDate
            if (actionData.dueTime) body.due_time = actionData.dueTime
        }

        const res = await httpApi.post(`/v1/stuff/${stuffId}/transform`, body, {headers: authHeaders()})
        const result = res.data

        // Transform API doesn't support duration, so call defer endpoint if duration is set
        if (actionData.deferType === 'scheduled' && actionData.deferDate && actionData.deferTime && actionData.deferDuration && result.id) {
            await deferAction(result.id, 'scheduled', actionData.deferDate, actionData.deferTime, actionData.deferDuration)
        }

        return result
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
        if (projectData.tags?.length) body.tags = projectData.tags

        const res = await httpApi.post(`/v1/stuff/${stuffId}/transform`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clarifyToReference(stuffId) {
    throw new Error('Reference feature not implemented yet')
}

export async function clarifyToSomeday(stuffId) {
    try {
        const res = await httpApi.patch(`/v1/stuff/${stuffId}`, {state: 'someday'}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function completeStuff(stuffId) {
    try {
        const res = await httpApi.post(`/v1/stuff/${stuffId}/complete`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clarifyToTrash(stuffId) {
    return trashStuff(stuffId)
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
        if (data.tags !== undefined) body.tags = data.tags

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
        if (data.start_date !== undefined) body.start_date = data.start_date
        if (data.start_time !== undefined) body.start_time = data.start_time
        if (data.scheduled_date !== undefined) body.scheduled_date = data.scheduled_date
        if (data.scheduled_time !== undefined) body.scheduled_time = data.scheduled_time
        if (data.due_date !== undefined) body.due_date = data.due_date
        if (data.due_time !== undefined) body.due_time = data.due_time
        if (data.recurrence_rule) body.recurrence_rule = data.recurrence_rule
        if (data.waiting_for) body.waiting_for = data.waiting_for
        if (data.waiting_since) body.waiting_since = data.waiting_since
        if (data.comments_json) body.comments_json = data.comments_json
        if (data.tags !== undefined) body.tags = data.tags

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

export async function trashAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/trash`, {}, {headers: authHeaders()})
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

export async function deferAction(actionId, type, date, time = null, duration = null) {
    try {
        const body = { type, date }
        if (time) body.time = time
        if (type === 'scheduled' && time && duration) body.duration = duration
        const res = await httpApi.post(`/v1/action/${actionId}/defer`, body, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function undeferAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/undefer`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function setDueDate(actionId, date, time = null) {
    try {
        const body = { date }
        if (time) body.time = time
        const res = await httpApi.post(`/v1/action/${actionId}/due`, body, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function clearDueDate(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/undue`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function nextActionCount() {
    try {
        const res = await httpApi.get('/v1/nextActions/count', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Today API ──

export async function listTodayActions({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/today', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function todayCount() {
    try {
        const res = await httpApi.get('/v1/today/count', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function todayAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/today`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getTodayActionByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/today/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getActionByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/nextActions/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function completeAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/complete`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function changeActionState(actionId, state, title) {
    try {
        // Use dedicated endpoints for specific states
        if (state === 'SOMEDAY') {
            const res = await httpApi.post(`/v1/action/${actionId}/someday`, {}, {headers: authHeaders()})
            return res.data
        }
        if (state === 'TODAY') {
            const res = await httpApi.post(`/v1/action/${actionId}/today`, {}, {headers: authHeaders()})
            return res.data
        }
        // For other states (NEXT, CALENDAR, WAITING), use PUT with title
        const res = await httpApi.put(`/v1/action/${actionId}`, {title, state}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function somedayAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/someday`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function somedayProject(projectId) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/someday`, {}, {headers: authHeaders()})
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
        if (data.tags !== undefined) body.tags = data.tags

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
        if (data.next_action_id !== undefined) body.next_action_id = data.next_action_id
        if (data.tags !== undefined) body.tags = data.tags

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

export async function trashProject(projectId) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/trash`, {}, {headers: authHeaders()})
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
        const res = await httpApi.get('/v1/projects/count', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getProjectByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/projects/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function completeProject(projectId) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/complete`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listProjectActions(projectId, {limit = 100, cursor = null} = {}) {
    try {
        const params = {project_id: projectId}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/project/action', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Someday API ──

export async function listSomeday({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/someday', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function moveSomeday(itemId, destination) {
    try {
        const res = await httpApi.post(`/v1/someday/${itemId}/move`, {destination}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getSomedayByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/someday/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function activateStuff(stuffId) {
    try {
        const res = await httpApi.post(`/v1/stuff/${stuffId}/activate`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function activateAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/activate`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function activateProject(projectId) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/activate`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Completed API ──

export async function listCompleted({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/completed', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getCompletedByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/completed/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function completedCount() {
    try {
        const res = await httpApi.get('/v1/completed/count', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Uncomplete API ──

export async function uncompleteStuff(stuffId) {
    try {
        const res = await httpApi.post(`/v1/stuff/${stuffId}/uncomplete`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function uncompleteAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/uncomplete`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function uncompleteProject(projectId) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/uncomplete`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Waiting For API ──

export async function listWaiting({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/waiting', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function waitingCount() {
    try {
        const res = await httpApi.get('/v1/waiting/count', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getWaitingByPosition(position) {
    try {
        const res = await httpApi.get(`/v1/waiting/pos/${position}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function moveWaitingPosition(actionId, position) {
    try {
        const res = await httpApi.post(`/v1/waiting/${actionId}/move`, {position}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function waitAction(actionId, waitingFor) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/wait`, {waiting_for: waitingFor}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function unwaitAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/unwait`, {}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Calendar API ──

export async function listCalendar({ start, end }) {
    try {
        const params = { start, end }
        const res = await httpApi.get('/v1/calendar', { params, headers: authHeaders() })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getCalendarDensity({ start, end }) {
    try {
        const params = { start, end }
        const res = await httpApi.get('/v1/calendar/density', { params, headers: authHeaders() })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Trash API ──

export async function listTrash({limit = 10, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get('/v1/trash', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function emptyTrash() {
    try {
        const res = await httpApi.delete('/v1/trash/empty', {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function restoreStuff(stuffId) {
    try {
        const res = await httpApi.post(`/v1/stuff/${stuffId}/restore`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function restoreAction(actionId) {
    try {
        const res = await httpApi.post(`/v1/action/${actionId}/restore`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function restoreProject(projectId) {
    try {
        const res = await httpApi.post(`/v1/project/${projectId}/restore`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Reference API ──

export async function createRefFolder({name, parent_id = null}) {
    try {
        const body = {name}
        if (parent_id) body.parent_id = parent_id
        const res = await httpApi.post('/v1/reference/folders', body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listRefFolders(parent_id = null) {
    try {
        const params = {}
        if (parent_id) params.parent_id = parent_id
        const res = await httpApi.get('/v1/reference/folders', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getRefFolder(id) {
    try {
        const res = await httpApi.get(`/v1/reference/folders/${id}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateRefFolder(id, {name, parent_id}) {
    try {
        const body = {}
        if (name !== undefined) body.name = name
        if (parent_id !== undefined) body.parent_id = parent_id
        const res = await httpApi.patch(`/v1/reference/folders/${id}`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteRefFolder(id) {
    try {
        const res = await httpApi.delete(`/v1/reference/folders/${id}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function uploadRefFile(file, folder_id = null, onProgress = null) {
    try {
        const formData = new FormData()
        formData.append('file', file)
        if (folder_id) formData.append('folder_id', folder_id)

        const res = await httpApi.post('/v1/reference/files', formData, {
            headers: {
                ...authHeaders(),
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: onProgress ? (e) => {
                const pct = Math.round((e.loaded * 100) / (e.total || 1))
                onProgress(pct)
            } : undefined,
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listRefFiles({folder_id = null, type = null, q = null, limit = 20, offset = 0} = {}) {
    try {
        const params = {limit, offset}
        if (folder_id) params.folder_id = folder_id
        if (type) params.type = type
        if (q) params.q = q
        const res = await httpApi.get('/v1/reference/files', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getRefFile(id) {
    try {
        const res = await httpApi.get(`/v1/reference/files/${id}`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateRefFile(id, {name, folder_id}) {
    try {
        const body = {}
        if (name !== undefined) body.name = name
        if (folder_id !== undefined) body.folder_id = folder_id
        const res = await httpApi.patch(`/v1/reference/files/${id}`, body, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function trashRefFile(id) {
    try {
        const res = await httpApi.delete(`/v1/reference/files/${id}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function downloadRefFile(id) {
    try {
        const res = await httpApi.get(`/v1/reference/files/${id}/download`, {
            headers: authHeaders(),
            responseType: 'blob',
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function previewRefFile(id) {
    try {
        const res = await httpApi.get(`/v1/reference/files/${id}/preview`, {
            headers: authHeaders(),
            responseType: 'blob',
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function getRefQuota() {
    try {
        const res = await httpApi.get('/v1/reference/quota', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function listRefTrash({limit = 20, offset = 0} = {}) {
    try {
        const params = {limit, offset}
        const res = await httpApi.get('/v1/reference/trash', {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function restoreRefFile(id) {
    try {
        const res = await httpApi.post(`/v1/reference/trash/${id}/restore`, {}, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function permanentDeleteRefFile(id) {
    try {
        const res = await httpApi.delete(`/v1/reference/trash/${id}`, {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function emptyRefTrash() {
    try {
        const res = await httpApi.delete('/v1/reference/trash', {headers: authHeaders()})
        return res.data || true
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Tags API ──

export async function getTags() {
    try {
        const res = await httpApi.get('/v1/tags', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Comments API ──

export async function listComments(entityType, itemId, {limit = 50, cursor = null} = {}) {
    try {
        const params = {}
        if (limit) params.limit = limit
        if (cursor) params.cursor = cursor

        const res = await httpApi.get(`/v1/${entityType}/${itemId}/comments`, {params, headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function createComment(entityType, itemId, message) {
    try {
        const res = await httpApi.post(`/v1/${entityType}/${itemId}/comments`, {message}, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Attachments API ──

export async function listAttachments(entityType, itemId) {
    try {
        const res = await httpApi.get(`/v1/${entityType}/${itemId}/attachments`, {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function uploadAttachment(entityType, itemId, file, onProgress = null) {
    try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await httpApi.post(`/v1/${entityType}/${itemId}/attachments`, formData, {
            headers: {...authHeaders(), 'Content-Type': 'multipart/form-data'},
            onUploadProgress: onProgress ? (e) => {
                const pct = Math.round((e.loaded * 100) / (e.total || 1))
                onProgress(pct)
            } : undefined,
        })
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function downloadAttachment(entityType, itemId, attachmentId) {
    try {
        const res = await httpApi.get(
            `/v1/${entityType}/${itemId}/attachments/${attachmentId}/download`,
            {headers: authHeaders(), responseType: 'blob'}
        )
        return res
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function replaceAttachment(entityType, itemId, attachmentId, file, onProgress = null) {
    try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await httpApi.put(
            `/v1/${entityType}/${itemId}/attachments/${attachmentId}`, formData,
            {
                headers: {...authHeaders(), 'Content-Type': 'multipart/form-data'},
                onUploadProgress: onProgress ? (e) => {
                    const pct = Math.round((e.loaded * 100) / (e.total || 1))
                    onProgress(pct)
                } : undefined,
            }
        )
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function deleteAttachment(entityType, itemId, attachmentId) {
    try {
        await httpApi.delete(
            `/v1/${entityType}/${itemId}/attachments/${attachmentId}`,
            {headers: authHeaders()}
        )
    } catch (err) {
        throw normalizeError(err)
    }
}

// ── Settings API ──

export async function getSettings() {
    try {
        const res = await httpApi.get('/v1/user/settings', {headers: authHeaders()})
        return res.data
    } catch (err) {
        throw normalizeError(err)
    }
}

export async function updateSettings(settings) {
    try {
        const res = await httpApi.put('/v1/user/settings', settings, {headers: authHeaders()})
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
    changePassword,
    listSessions,
    revokeSession,
    revokeAllSessions,
    logoutUser,
    addStuff,
    updateStuff,
    getStuff,
    getStuffByPosition,
    deleteStuff,
    trashStuff,
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
    trashAction,
    moveAction,
    nextActionCount,
    getActionByPosition,
    completeAction,
    changeActionState,
    somedayAction,
    somedayProject,
    // Today API
    listTodayActions,
    todayCount,
    todayAction,
    getTodayActionByPosition,
    // Project API
    addProject,
    updateProject,
    getProject,
    listProjects,
    deleteProject,
    trashProject,
    moveProject,
    projectsCount,
    getProjectByPosition,
    completeProject,
    listProjectActions,
    listSomeday,
    moveSomeday,
    getSomedayByPosition,
    activateStuff,
    activateAction,
    activateProject,
    listTrash,
    emptyTrash,
    restoreStuff,
    restoreAction,
    restoreProject,
    listCompleted,
    completedCount,
    getCompletedByPosition,
    uncompleteStuff,
    uncompleteAction,
    uncompleteProject,
    listCalendar,
    getCalendarDensity,
    // Waiting For API
    listWaiting,
    waitingCount,
    getWaitingByPosition,
    moveWaitingPosition,
    waitAction,
    unwaitAction,
    // Tags API
    getTags,
    // Settings API
    getSettings,
    updateSettings,
    // Reference API
    createRefFolder,
    listRefFolders,
    getRefFolder,
    updateRefFolder,
    deleteRefFolder,
    uploadRefFile,
    listRefFiles,
    getRefFile,
    updateRefFile,
    trashRefFile,
    downloadRefFile,
    previewRefFile,
    getRefQuota,
    listRefTrash,
    restoreRefFile,
    permanentDeleteRefFile,
    emptyRefTrash,
    // Comments API
    listComments,
    createComment,
    // Attachments API
    listAttachments,
    uploadAttachment,
    downloadAttachment,
    replaceAttachment,
    deleteAttachment,
}

export default apiClient
