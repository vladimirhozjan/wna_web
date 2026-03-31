import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

let instance = null

export function dashboardModel() {
    if (instance) return instance

    const healthData = ref(null)
    const healthLoading = ref(false)

    const userOverview = ref(null)
    const userOverviewLoading = ref(false)

    const platformActivity = ref(null)
    const platformActivityLoading = ref(false)

    const securityAlerts = ref(null)
    const securityAlertsLoading = ref(false)

    const auditData = ref([])
    const auditLoading = ref(false)

    const refreshInterval = ref(null)

    async function loadHealth() {
        healthLoading.value = true
        try {
            healthData.value = await apiClient.getSystemHealth()
        } catch {
            healthData.value = null
        } finally {
            healthLoading.value = false
        }
    }

    async function loadUserOverview() {
        userOverviewLoading.value = true
        try {
            userOverview.value = await apiClient.getDashboardUserOverview()
        } catch {
            userOverview.value = null
        } finally {
            userOverviewLoading.value = false
        }
    }

    async function loadPlatformActivity() {
        platformActivityLoading.value = true
        try {
            platformActivity.value = await apiClient.getDashboardPlatformActivity()
        } catch {
            platformActivity.value = null
        } finally {
            platformActivityLoading.value = false
        }
    }

    async function loadSecurityAlerts() {
        securityAlertsLoading.value = true
        try {
            securityAlerts.value = await apiClient.getDashboardSecurityAlerts()
        } catch {
            securityAlerts.value = null
        } finally {
            securityAlertsLoading.value = false
        }
    }

    async function loadRecentAudit() {
        auditLoading.value = true
        try {
            const data = await apiClient.getDashboardRecentActivity()
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
            loadUserOverview(),
            loadPlatformActivity(),
            loadSecurityAlerts(),
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
        userOverview,
        userOverviewLoading,
        platformActivity,
        platformActivityLoading,
        securityAlerts,
        securityAlertsLoading,
        auditData,
        auditLoading,
        refresh,
        startAutoRefresh,
        stopAutoRefresh,
    }
    return instance
}