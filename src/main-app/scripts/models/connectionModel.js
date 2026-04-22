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

    async function loadAll() {
        loading.value = true
        error.value = null
        try {
            const [list, pending] = await Promise.all([
                apiClient.listConnections(),
                apiClient.listPendingConnections(),
            ])
            connections.value = list.connections || []
            pendingSent.value = pending.sent || []
            pendingReceived.value = pending.received || []
            loaded.value = true
        } catch (err) {
            error.value = err
            throw err
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

    async function accept(token) {
        const res = await apiClient.acceptConnectionInvite(token)
        await loadAll().catch(() => {})
        errorModel().success('Connection accepted')
        return res
    }

    async function decline(token) {
        const res = await apiClient.declineConnectionInvite(token)
        pendingReceived.value = pendingReceived.value.filter(p => p.token !== token && p.id !== token)
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
