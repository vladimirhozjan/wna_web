import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const loaded = ref(false)
const cursor = ref(null)
const hasMore = ref(true)

const POLL_INTERVAL_MS = 30000
const READ_SEND_INTERVAL_MS = 1000
const READ_BATCH_MAX = 20
let pollTimer = null
let readTimer = null
const pendingReadIds = new Set()
let instance = null

export function notificationInAppModel() {
    if (instance) return instance

    async function loadList({ reset = false, limit = 20 } = {}) {
        loading.value = true
        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }
            const data = await apiClient.listNotifications({ limit, cursor: cursor.value })
            const items = data.notifications || []
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
        if (!n || n.read) return
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

    // Failed batches are dropped, not retried — the close-time count check or the poll corrects the badge
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

    function startPolling() {
        stopPolling()
        loadUnreadCount()
        pollTimer = setInterval(loadUnreadCount, POLL_INTERVAL_MS)
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
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
        stopPolling()
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
        startPolling,
        stopPolling,
        reset,
    }
    return instance
}
