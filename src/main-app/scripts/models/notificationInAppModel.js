import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

const notifications = ref([])
const unreadCount = ref(0)
const loading = ref(false)
const loaded = ref(false)
const cursor = ref(null)
const hasMore = ref(true)

const POLL_INTERVAL_MS = 30000
let pollTimer = null
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
        } finally {
            loading.value = false
        }
    }

    async function loadUnreadCount() {
        try {
            const data = await apiClient.getUnreadNotificationCount()
            unreadCount.value = data.count || 0
        } catch {
            // silent — tier-restricted endpoints return 403 for non-team users
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
        startPolling,
        stopPolling,
        reset,
    }
    return instance
}
