import { ref } from 'vue'
import apiClient from './apiClient.js'

const stats = ref(null)
let refreshTimer = null
let loading = false

export function statsModel() {

    async function loadStats() {
        if (loading) return
        loading = true
        try {
            stats.value = await apiClient.getStats()
        } catch {
            // Stats are non-critical
        } finally {
            loading = false
        }
    }

    function refreshStats() {
        clearTimeout(refreshTimer)
        refreshTimer = setTimeout(loadStats, 300)
    }

    return { stats, loadStats, refreshStats }
}
