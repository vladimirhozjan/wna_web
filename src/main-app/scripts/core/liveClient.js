import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { getDomains } from './domains.js'
import { offlineModel } from './offlineModel.js'
import { refreshSession, sessionRejected, logout } from './httpApi.js'
import { statsModel } from '../models/statsModel.js'

// contracts/limits.md §Live lists
const PING_MS = 25000
const PONG_WAIT_MS = 10000
const BACKOFF_MIN_MS = 1000
const BACKOFF_MAX_MS = 30000
const STATUS_DELAY_MS = 10000
const RENEW_BEFORE_S = 60

// Changes that touch no list, count or item page
const PERSONAL = new Set(['notification', 'ai_request', 'connection'])

const { base_url } = getDomains()
const { isOffline } = offlineModel()
const tabId = crypto.randomUUID()

const changeHandlers = new Set()
const packetHandlers = new Set()
const linkDownLong = ref(false)
// A dispatch with a change not made in this tab: lists animate what its re-reads change (liveMotion.js)
const motion = { active: false, ids: new Set() }
const reconnecting = computed(() => linkDownLong.value && !isOffline.value)

let running = false
let ws = null
let authed = false
let sentToken = null
let attempt = 0
let resyncOnReady = false
let holds = 0
let dirty = false
// Held foreign changes play with motion at release; a held resync / reconnect / midnight re-reads without
let heldIds = new Set()
let heldPlain = false
let motionRuns = 0
let reconnectTimer = null
let pingTimer = null
let pongTimer = null
let renewTimer = null
let statusTimer = null
let midnightTimer = null

function tokenExp(token) {
    try {
        return JSON.parse(atob(token.split('.')[1])).exp
    } catch {
        return null
    }
}

// The stored token, refreshed first when it expires within a minute; null when there is none to send
async function freshToken(force = false) {
    const token = localStorage.getItem('auth_token')
    const exp = token && tokenExp(token)
    if (token && !force && (!exp || exp - Date.now() / 1000 > RENEW_BEFORE_S)) return token
    try {
        await refreshSession()
        return localStorage.getItem('auth_token')
    } catch (e) {
        if (sessionRejected(e)) logout()
        return null
    }
}

function sendToken(token) {
    if (!token || token === sentToken || !ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'auth', token }))
    sentToken = token
    clearTimeout(renewTimer)
    const exp = tokenExp(token)
    if (exp) renewTimer = setTimeout(renew, Math.max(0, (exp - RENEW_BEFORE_S) * 1000 - Date.now()))
}

async function renew() {
    sendToken(await freshToken())
}

function startStatusTimer() {
    if (statusTimer) return
    statusTimer = setTimeout(() => {
        statusTimer = null
        linkDownLong.value = true
    }, STATUS_DELAY_MS)
}

function clearStatus() {
    clearTimeout(statusTimer)
    statusTimer = null
    linkDownLong.value = false
}

function connect() {
    clearTimeout(reconnectTimer)
    if (!running || ws || !navigator.onLine) return
    const socket = new WebSocket((base_url || location.origin).replace(/^http/, 'ws') + '/v1/live')
    ws = socket
    authed = false
    sentToken = null
    socket.onopen = async () => {
        const token = await freshToken()
        if (socket === ws) sendToken(token)
    }
    socket.onmessage = (e) => onMessage(e.data)
    socket.onclose = (e) => onClose(socket, e.code)
}

function scheduleReconnect() {
    const delay = Math.min(BACKOFF_MAX_MS, BACKOFF_MIN_MS * 2 ** attempt) * (0.8 + Math.random() * 0.4)
    attempt++
    reconnectTimer = setTimeout(connect, delay)
}

async function onClose(socket, code) {
    if (socket !== ws) return
    ws = null
    authed = false
    clearInterval(pingTimer)
    clearTimeout(pongTimer)
    clearTimeout(renewTimer)
    if (!running) return
    resyncOnReady = true
    startStatusTimer()
    if (code === 4401 && navigator.onLine) await freshToken(true)
    if (!running || ws || !navigator.onLine) return
    clearTimeout(reconnectTimer)
    scheduleReconnect()
}

// Closes now, without waiting for the closing handshake of a link that may be dead
function drop() {
    const socket = ws
    socket.close()
    onClose(socket, 1000)
}

function onMessage(data) {
    clearTimeout(pongTimer)
    let msg
    try {
        msg = JSON.parse(data)
    } catch {
        return
    }
    if (msg.type === 'ready' && !authed) {
        authed = true
        attempt = 0
        clearStatus()
        pingTimer = setInterval(ping, PING_MS)
        if (resyncOnReady) {
            resyncOnReady = false
            dispatch(null)
        }
    } else if (msg.type === 'changes') {
        dispatch(msg.changes || [])
    } else if (msg.type === 'resync') {
        dispatch(null)
    }
}

function ping() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify({ type: 'ping' }))
    clearTimeout(pongTimer)
    pongTimer = setTimeout(drop, PONG_WAIT_MS)
}

// changes === null: anything may have changed (resync, reconnect, a held dispatch) — every handler re-reads.
// heldForeign: ids of foreign changes a hold deferred — the re-read at release plays with motion
function dispatch(changes, heldForeign = null) {
    if (document.hidden || holds > 0) {
        defer(changes, heldForeign)
        return
    }
    const foreignIds = heldForeign || (changes || []).filter(c => c.tab !== tabId).map(c => c.id)
    const foreign = heldForeign !== null || foreignIds.length > 0
    if (foreign) {
        motionRuns++
        motion.active = true
        foreignIds.forEach(id => motion.ids.add(id))
    }
    const pending = []
    packetHandlers.forEach(fn => pending.push(fn(changes)))
    // A packet handler may hold (a row's completion exit) — the list re-reads at release
    if (holds > 0) {
        defer(changes, heldForeign)
    } else if (!changes || changes.some(c => !PERSONAL.has(c.entity))) {
        changeHandlers.forEach(fn => pending.push(fn()))
        statsModel().refreshStats()
    }
    if (foreign) endMotion(pending)
}

function defer(changes, heldForeign) {
    dirty = true
    if (heldForeign) heldForeign.forEach(id => heldIds.add(id))
    else if (!changes) heldPlain = true
    else changes.forEach(c => { if (c.tab !== tabId) heldIds.add(c.id) })
}

// A change this tab learns of another way (a capture from another tab of this browser) animates like a foreign
// live update until the promise settles
function animate(promise) {
    motionRuns++
    motion.active = true
    endMotion([promise])
    return promise
}

// Motion lasts until every handler's re-read has landed and rendered
async function endMotion(pending) {
    await Promise.allSettled(pending)
    await nextTick()
    if (--motionRuns > 0) return
    motion.active = false
    motion.ids.clear()
}

// Time passing writes nothing: an arrived tickler, a new day, overdue — re-read at local midnight
function scheduleMidnight() {
    clearTimeout(midnightTimer)
    const next = new Date()
    next.setHours(24, 0, 1, 0)
    midnightTimer = setTimeout(() => {
        scheduleMidnight()
        dispatch(null)
    }, next - Date.now())
}

// catchUp: a hidden tab shown again — the screen just shows the current state
function flushHeld(catchUp = false) {
    if (!dirty || holds > 0 || document.hidden) return
    dirty = false
    const ids = catchUp || heldPlain || !heldIds.size ? null : heldIds
    heldIds = new Set()
    heldPlain = false
    dispatch(null, ids)
}

document.addEventListener('visibilitychange', () => flushHeld(true))

window.addEventListener('token_refreshed', () => {
    if (authed) sendToken(localStorage.getItem('auth_token'))
})

window.addEventListener('offline', () => {
    if (!running) return
    clearTimeout(reconnectTimer)
    if (ws) drop()
})

window.addEventListener('online', () => {
    if (!running) return
    clearStatus()
    startStatusTimer()
    attempt = 0
    connect()
})

function start() {
    if (running) return
    running = true
    attempt = 0
    resyncOnReady = false
    startStatusTimer()
    scheduleMidnight()
    connect()
}

function stop() {
    running = false
    clearTimeout(reconnectTimer)
    clearStatus()
    holds = 0
    dirty = false
    heldIds = new Set()
    heldPlain = false
    if (ws) {
        const socket = ws
        ws = null
        socket.close(1000)
    }
    authed = false
    clearInterval(pingTimer)
    clearTimeout(pongTimer)
    clearTimeout(renewTimer)
    clearTimeout(midnightTimer)
}

function hold() {
    holds++
}

function release() {
    holds = Math.max(0, holds - 1)
    flushHeld()
}

// fn(changes) gets each `changes` array, or null when everything must be re-read; for models — stays until the
// returned function is called
function subscribe(fn) {
    packetHandlers.add(fn)
    return () => packetHandlers.delete(fn)
}

export const liveClient = { reconnecting, tabId, motion, start, stop, hold, release, subscribe, animate }

// Call from a page's setup with the function its load / pull-to-refresh runs; return its re-read promise so a
// foreign change animates (liveMotion.js)
export function onLiveChange(fn) {
    onMounted(() => changeHandlers.add(fn))
    onBeforeUnmount(() => changeHandlers.delete(fn))
}

// subscribe() for a page or component: lives with it
export function onLivePacket(fn) {
    onMounted(() => packetHandlers.add(fn))
    onBeforeUnmount(() => packetHandlers.delete(fn))
}
