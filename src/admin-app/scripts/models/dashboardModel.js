import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

let instance = null

export function dashboardModel() {
    if (instance) return instance

    const healthData = ref(null)
    const healthLoading = ref(false)

    const auditData = ref([])
    const auditLoading = ref(false)

    const refreshInterval = ref(null)

    async function loadHealth() {
        healthLoading.value = true
        try {
            const [health, version] = await Promise.all([
                apiClient.getAdminServiceHealth().catch(() => null),
                apiClient.getAdminServiceVersion().catch(() => null),
            ])
            healthData.value = { health, version }
        } catch {
            healthData.value = null
        } finally {
            healthLoading.value = false
        }
    }

    async function loadRecentAudit() {
        auditLoading.value = true
        try {
            const data = await apiClient.getAuditLog({ limit: 10, offset: 0 })
            auditData.value = data.items || []
        } catch {
            auditData.value = []
        } finally {
            auditLoading.value = false
        }
    }

    async function refresh() {
        await Promise.all([
            loadHealth(),
            loadRecentAudit(),
        ])
    }

    function startAutoRefresh(intervalMs = 30000) {
        stopAutoRefresh()
        refresh()
        refreshInterval.value = setInterval(refresh, intervalMs)
    }

    function stopAutoRefresh() {
        if (refreshInterval.value) {
            clearInterval(refreshInterval.value)
            refreshInterval.value = null
        }
    }

    instance = {
        healthData,
        healthLoading,
        auditData,
        auditLoading,
        refresh,
        startAutoRefresh,
        stopAutoRefresh,
    }
    return instance
}
