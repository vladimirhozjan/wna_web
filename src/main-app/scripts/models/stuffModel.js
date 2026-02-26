import { ref } from 'vue'
import apiClient from '../core/apiClient.js'
import { statsModel } from './statsModel.js'

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)
const totalItems = ref(0)

let loadVersion = 0

export function stuffModel() {

    async function loadStuff({ reset = false } = {}) {
        loading.value = true
        error.value = null

        const myVersion = ++loadVersion

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const data = await apiClient.listStuff({
                limit: limit.value,
                cursor: cursor.value,
            })

            if (myVersion !== loadVersion) return data

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

            const count_data = await apiClient.inboxCount()
            if (myVersion === loadVersion) {
                totalItems.value = count_data.count
            }

            return data
        } catch (err) {
            if (myVersion === loadVersion) {
                error.value = err
            }
            throw err
        } finally {
            if (myVersion === loadVersion) {
                loading.value = false
            }
        }
    }

    async function getStuff(stuffId) {
        error.value = null

        try {
            const data = await apiClient.getStuff(stuffId)
            current.value = data
            return data
        } catch (err) {
            error.value = err
            current.value = null
            throw err
        }
    }

    async function getStuffByPosition(position) {
        error.value = null

        try {
            const data = await apiClient.getStuffByPosition(position)
            current.value = data
            return data
        } catch (err) {
            error.value = err
            current.value = null
            throw err
        }
    }

    async function addStuff(title, description = '') {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addStuff({ title, description, state: 'INBOX' })
            await loadStuff({ reset: true })
            statsModel().refreshStats()
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateStuff(stuffId, { title, description = '' }) {
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
        }
    }

    async function trashStuff(stuffId) {
        error.value = null

        try {
            await apiClient.trashStuff(stuffId)
            items.value = items.value.filter(i => i.id !== stuffId)

            if (cursor.value === stuffId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === stuffId) {
                current.value = null
            }
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function moveStuff(stuffId, toIndex) {
        error.value = null

        // VueDraggable already moved the item in the array
        // We just need to sync with the API
        try {
            await apiClient.moveStuff(stuffId, toIndex)
        } catch (err) {
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
        totalItems,

        // actions
        loadStuff,
        getStuff,
        getStuffByPosition,
        addStuff,
        updateStuff,
        trashStuff,
        moveStuff,
    }
}
