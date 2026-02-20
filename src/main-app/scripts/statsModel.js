import { ref } from 'vue'
import apiClient from './apiClient.js'

const stats = ref(null)
let refreshTimer = null

export function statsModel() {

    async function loadStats() {
        try {
            stats.value = await apiClient.getStats()
        } catch {
            // Stats are non-critical
        }
    }

    function refreshStats() {
        clearTimeout(refreshTimer)
        refreshTimer = setTimeout(loadStats, 300)
    }

    return { stats, loadStats, refreshStats }
}
