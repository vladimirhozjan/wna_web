import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const loaded = ref(false)
const cursor = ref(null)
const hasMore = ref(true)

const PAGE = 20
const LIST_MAX = 100
let rereading = false
let loadGen = 0

const READ_SEND_INTERVAL_MS = 1000
const READ_BATCH_MAX = 20
let readTimer = null
const pendingReadIds = new Set()
let instance = null

export function notificationInAppModel() {
    if (instance) return instance

    async function loadList({ reset = false, limit = PAGE } = {}) {
        if (!reset && rereading) return
        if (reset) loadGen++
        loading.value = true
        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }
            const data = await apiClient.listNotifications({ limit, cursor: cursor.value })
            const items = data.notifications || []
            items.forEach(n => { if (pendingReadIds.has(n.id)) n.read = true })
            if (reset) {
                notifications.value = items
            } else {
                notifications.value.push(...items)
            }
            if (items.length > 0) cursor.value = items[items.length - 1].id
            hasMore.value = items.length === limit
            if (typeof data.unread_count === 'number') unreadCount.value = data.unread_count
            loaded.value = true
            return data
        } catch (err) {
            if (import.meta.env.DEV) console.warn('[notifications] list failed:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    // Live re-read: silent, at the loaded depth; one extra row tells whether older rows exist
    async function rereadLoaded() {
        if (loading.value || rereading) return
        rereading = true
        const gen = loadGen
        try {
            const depth = Math.max(PAGE, notifications.value.length)
            const want = depth + 1
            const rows = []
            let after = null
            let data = null
            while (rows.length < want) {
                const ask = Math.min(want - rows.length, LIST_MAX)
                data = await apiClient.listNotifications({ limit: ask, cursor: after })
                const items = data.notifications || []
                rows.push(...items)
                if (items.length < ask) break
                after = items[items.length - 1].id
            }
            if (gen !== loadGen) return
            rows.forEach(n => { if (pendingReadIds.has(n.id)) n.read = true })
            const shown = rows.slice(0, depth)
            notifications.value = shown
            hasMore.value = rows.length > depth
            cursor.value = shown.length > 0 ? shown[shown.length - 1].id : null
            if (typeof data.unread_count === 'number') unreadCount.value = data.unread_count
            loaded.value = true
        } catch (err) {
            if (import.meta.env.DEV) console.warn('[notifications] re-read failed:', err)
        } finally {
            rereading = false
        }
    }

    async function loadUnreadCount() {
        try {
            const data = await apiClient.getUnreadNotificationCount()
            unreadCount.value = data.count || 0
        } catch (err) {
            if (import.meta.env.DEV) console.warn('[notifications] unread-count failed:', err)
        }
    }

    async function markRead(id) {
        const n = notifications.value.find(x => x.id === id)
        // A push click names a row the bell may not have loaded yet
        if (!n) {
            await apiClient.markNotificationRead(id)
            await loadUnreadCount()
            return
        }
        if (n.read) return
        n.read = true
        if (unreadCount.value > 0) unreadCount.value -= 1
        try {
            await apiClient.markNotificationRead(id)
        } catch (err) {
            n.read = false
            unreadCount.value += 1
            throw err
        }
    }

    function markSeen(id) {
        const n = notifications.value.find(x => x.id === id)
        if (!n || n.read) return
        pendingReadIds.add(id)
        if (!readTimer) readTimer = setInterval(onReadTick, READ_SEND_INTERVAL_MS)
    }

    function onReadTick() {
        if (pendingReadIds.size > 0) {
            sendReadBatch()
        } else if (!notifications.value.some(n => !n.read)) {
            stopReadTimer()
        }
    }

    // Failed batches are dropped, not retried — the close-time count check or the next live packet corrects the badge
    async function sendReadBatch() {
        const ids = [...pendingReadIds].slice(0, READ_BATCH_MAX)
        ids.forEach(id => pendingReadIds.delete(id))
        try {
            const data = await apiClient.markNotificationsRead(ids)
            const sent = new Set(ids)
            notifications.value.forEach(n => { if (sent.has(n.id)) n.read = true })
            if (typeof data.unread_count === 'number') unreadCount.value = data.unread_count
        } catch (err) {
            if (import.meta.env.DEV) console.warn('[notifications] mark read failed:', err)
        }
    }

    async function flushRead() {
        stopReadTimer()
        while (pendingReadIds.size > 0) await sendReadBatch()
    }

    function stopReadTimer() {
        if (readTimer) {
            clearInterval(readTimer)
            readTimer = null
        }
    }

    function reset() {
        notifications.value = []
        unreadCount.value = 0
        cursor.value = null
        hasMore.value = true
        loaded.value = false
        pendingReadIds.clear()
        stopReadTimer()
    }

    instance = {
        // state
        notifications,
        unreadCount,
        loading,
        loaded,
        hasMore,
        // actions
        loadList,
        rereadLoaded,
        loadUnreadCount,
        markRead,
        markSeen,
        flushRead,
        reset,
    }
    return instance
}
