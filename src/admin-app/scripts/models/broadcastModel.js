import { ref, computed } from 'vue'
import apiClient from '../core/apiClient.js'

let instance = null

export const KIND_LABELS = {
    announcement: 'Announcement',
    service_notice: 'Service notice',
}

export const STATUS_BADGE = {
    draft: 'draft',
    sending: 'pending',
    sent: 'active',
    failed: 'failed',
}

export function broadcastModel() {
    if (instance) return instance

    const items = ref([])
    const totalCount = ref(0)
    const listLoading = ref(false)

    const lastListParams = ref(null)

    const anySending = computed(() => items.value.some(b => b.status === 'sending'))

    async function loadList(params = {}) {
        lastListParams.value = params
        listLoading.value = true
        try {
            const data = await apiClient.getBroadcasts(params)
            items.value = data.items || []
            totalCount.value = data.total_count || 0
        } finally {
            listLoading.value = false
        }
    }

    async function refreshList() {
        if (lastListParams.value) await loadList(lastListParams.value)
    }

    function get(id) {
        return apiClient.getBroadcast(id)
    }

    function loadShell() {
        return apiClient.getBroadcastShell()
    }

    function loadRecipientCount() {
        return apiClient.getBroadcastRecipientCount()
    }

    function create(data) {
        return apiClient.createBroadcast(data)
    }

    function update(id, data) {
        return apiClient.updateBroadcast(id, data)
    }

    async function remove(id) {
        const res = await apiClient.deleteBroadcast(id)
        await refreshList()
        return res
    }

    async function copy(id) {
        const res = await apiClient.copyBroadcast(id)
        await refreshList()
        return res
    }

    function sendTest(id) {
        return apiClient.testBroadcast(id)
    }

    function send(id) {
        return apiClient.sendBroadcast(id)
    }

    function retryFailed(id) {
        return apiClient.retryFailedBroadcast(id)
    }

    instance = {
        items,
        totalCount,
        listLoading,
        anySending,
        loadList,
        refreshList,
        get,
        loadShell,
        loadRecipientCount,
        create,
        update,
        remove,
        copy,
        sendTest,
        send,
        retryFailed,
    }
    return instance
}
