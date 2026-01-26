import { ref } from 'vue'
import apiClient from './apiClient.js'

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)

export function stuffModel() {

    async function loadStuff({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const data = await apiClient.listStuff({
                limit: limit.value,
                cursor: cursor.value,
            })

            if (reset) {
                // Replace items in one operation (no flicker)
                items.value = data
            } else if (data.length > 0) {
                items.value.push(...data)
            }

            if (data.length > 0) {
                cursor.value = data[data.length - 1].id
            }

            // Hide "Load more" if we got fewer items than requested
            hasMore.value = data.length >= limit.value

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

    async function moveStuff(stuffId, toIndex) {
        error.value = null

        // Find current index
        const fromIndex = items.value.findIndex(i => i.id === stuffId)
        if (fromIndex === -1 || fromIndex === toIndex) return

        // Adjust target index when moving forward (removal shifts indices)
        const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex

        // Store original order for rollback
        const originalItems = [...items.value]

        // Optimistic reorder
        const [item] = items.value.splice(fromIndex, 1)
        items.value.splice(insertIndex, 0, item)

        try {
            await apiClient.moveStuff(stuffId, insertIndex)
        } catch (err) {
            // Revert on error
            items.value = originalItems
            error.value = err
            throw err
        }
    }

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
        moveStuff,
    }
}
