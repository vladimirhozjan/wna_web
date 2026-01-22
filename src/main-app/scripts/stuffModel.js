import { ref, computed } from 'vue'
import apiClient from './apiClient.js'

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(50)

export function stuffModel() {

    async function loadStuff({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                items.value = []
                cursor.value = null
            }

            const data = await apiClient.listStuff({
                limit: limit.value,
                cursor: cursor.value,
            })

            if (data.length > 0) {
                items.value.push(...data)
                cursor.value = data[data.length - 1].id
            }

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getStuff(stuffId) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.getStuff(stuffId)
            current.value = data
            return data
        } catch (err) {
            error.value = err
            current.value = null
            throw err
        } finally {
            loading.value = false
        }
    }

    async function addStuff(title, description = '') {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addStuff({ title, description })
            await loadStuff({ reset: true })
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateStuff(stuffId, { title, description = '' }) {
        loading.value = true
        error.value = null

        try {
            const updated = await apiClient.updateStuff(stuffId, {
                title,
                description,
            })

            // sync local cache
            items.value = items.value.map(i =>
                i.id === stuffId ? { ...i, title, description } : i
            )

            if (current.value?.id === stuffId) {
                current.value = { ...current.value, title, description }
            }

            return updated
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteStuff(stuffId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.deleteStuff(stuffId)
            items.value = items.value.filter(i => i.id !== stuffId)

            if (current.value?.id === stuffId) {
                current.value = null
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    const hasMore = computed(() => cursor.value !== null)

    return {
        // state
        items,
        current,
        loading,
        error,
        cursor,
        limit,
        hasMore,

        // actions
        loadStuff,
        getStuff,
        addStuff,
        updateStuff,
        deleteStuff,
    }
}
