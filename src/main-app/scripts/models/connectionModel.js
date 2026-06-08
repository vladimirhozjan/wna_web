import { ref, computed } from 'vue'
import apiClient from '../core/apiClient.js'
import { errorModel } from '../core/errorModel.js'

const connections = ref([])
const pendingSent = ref([])
const pendingReceived = ref([])
const loading = ref(false)
const loaded = ref(false)
const error = ref(null)

let instance = null

export function connectionModel() {
    if (instance) return instance

    const pendingReceivedCount = computed(() => pendingReceived.value.length)

    // Sidebar numeric badge: accepted connections + invitations the user has sent (network size).
    const networkCount = computed(() => connections.value.length + pendingSent.value.length)

    async function loadAll() {
        loading.value = true
        error.value = null
        try {
            // Use allSettled so a 403 on one endpoint (e.g. non-Team tier seeing /v1/connections)
            // doesn't block loading the other (e.g. received invitations).
            const [listRes, pendingRes] = await Promise.allSettled([
                apiClient.listConnections(),
                apiClient.listPendingConnections(),
            ])
            if (listRes.status === 'fulfilled') {
                connections.value = listRes.value.connections || []
            }
            if (pendingRes.status === 'fulfilled') {
                pendingSent.value = pendingRes.value.sent || []
                pendingReceived.value = pendingRes.value.received || []
            }
            if (listRes.status === 'rejected' && pendingRes.status === 'rejected') {
                error.value = pendingRes.reason
                throw pendingRes.reason
            }
            loaded.value = true
        } finally {
            loading.value = false
        }
    }

    async function invite(email) {
        const res = await apiClient.inviteConnection(email)
        pendingSent.value = [res, ...pendingSent.value]
        errorModel().success(`Invitation sent to ${email}`)
        return res
    }

    async function accept(id) {
        const res = await apiClient.acceptConnectionInvite(id)
        await loadAll().catch(() => {})
        errorModel().success('Connection accepted')
        return res
    }

    async function decline(id) {
        const res = await apiClient.declineConnectionInvite(id)
        pendingReceived.value = pendingReceived.value.filter(p => p.id !== id)
        return res
    }

    async function remove(id) {
        await apiClient.removeConnection(id)
        connections.value = connections.value.filter(c => c.id !== id)
        pendingSent.value = pendingSent.value.filter(p => p.id !== id)
        pendingReceived.value = pendingReceived.value.filter(p => p.id !== id)
    }

    function reset() {
        connections.value = []
        pendingSent.value = []
        pendingReceived.value = []
        loaded.value = false
        error.value = null
    }

    instance = {
        // state
        connections,
        pendingSent,
        pendingReceived,
        pendingReceivedCount,
        networkCount,
        loading,
        loaded,
        error,
        // actions
        loadAll,
        invite,
        accept,
        decline,
        remove,
        reset,
    }
    return instance
}
