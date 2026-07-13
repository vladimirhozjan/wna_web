import { ref, computed } from 'vue'
import apiClient from '../core/apiClient.js'

let instance = null

export function alarmModel() {
    if (instance) return instance

    const items = ref([])
    const totalCount = ref(0)
    const listLoading = ref(false)

    const counts = ref(null)
    const countsLoading = ref(false)

    const lastListParams = ref(null)

    const hasActive = computed(() => (counts.value?.active_count || 0) > 0)

    async function loadList(params = {}) {
        lastListParams.value = params
        listLoading.value = true
        try {
            const data = await apiClient.getAlarms(params)
            items.value = data.items || []
            totalCount.value = data.total_count || 0
        } finally {
            listLoading.value = false
        }
    }

    async function loadCounts() {
        countsLoading.value = true
        try {
            counts.value = await apiClient.getAlarmCounts()
        } catch {
            counts.value = null
        } finally {
            countsLoading.value = false
        }
    }

    async function refresh() {
        const jobs = [loadCounts()]
        if (lastListParams.value) jobs.push(loadList(lastListParams.value))
        await Promise.all(jobs)
    }

    async function acknowledge(id) {
        const res = await apiClient.ackAlarm(id)
        await refresh()
        return res
    }

    async function resolve(id) {
        const res = await apiClient.resolveAlarm(id)
        await refresh()
        return res
    }

    async function resolveAll() {
        const res = await apiClient.resolveAllAlarms()
        await refresh()
        return res
    }

    instance = {
        items,
        totalCount,
        listLoading,
        counts,
        countsLoading,
        hasActive,
        loadList,
        loadCounts,
        refresh,
        acknowledge,
        resolve,
        resolveAll,
    }
    return instance
}
