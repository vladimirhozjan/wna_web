import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const loaded = ref(false)
const cursor = ref(null)
const hasMore = ref(true)

const READ_SEND_INTERVAL_MS = 1000
const READ_BATCH_MAX = 20
let readTimer = null
const pendingReadIds = new Set()
let instance = null

export function notificationInAppModel() {
    if (instance) return instance

    // keepDepth: a live re-read — silent, as many rows as are loaded
    async function loadList({ reset = false, limit = 20, keepDepth = false } = {}) {
        if (keepDepth && loading.value) return
        if (keepDepth) limit = Math.max(limit, notifications.value.length)
        else loading.value = true
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
            if (!keepDepth) loading.value = false
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
        loadUnreadCount,
        markRead,
        markSeen,
        flushRead,
        reset,
    }
    return instance
}
