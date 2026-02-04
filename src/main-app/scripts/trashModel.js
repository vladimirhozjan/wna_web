import { ref } from 'vue'
import apiClient from './apiClient.js'

const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)

export function trashModel() {

    async function loadTrash({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const data = await apiClient.listTrash({
                limit: limit.value,
                cursor: cursor.value,
            })

            if (reset) {
                items.value = data
            } else if (data.length > 0) {
                items.value.push(...data)
            }

            if (data.length > 0) {
                cursor.value = data[data.length - 1].id
            }

            hasMore.value = data.length >= limit.value

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function restoreItem(item) {
        error.value = null

        try {
            switch (item.type) {
                case 'STUFF':
                    await apiClient.restoreStuff(item.id)
                    break
                case 'ACTION':
                    await apiClient.restoreAction(item.id)
                    break
                case 'PROJECT':
                    await apiClient.restoreProject(item.id)
                    break
                default:
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(`Unknown item type: ${item.type}`)
            }

            items.value = items.value.filter(i => i.id !== item.id)

            if (cursor.value === item.id) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function restoreItems(itemsToRestore) {
        error.value = null

        try {
            for (const item of itemsToRestore) {
                await restoreItem(item)
            }
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function emptyTrash() {
        loading.value = true
        error.value = null

        try {
            await apiClient.emptyTrash()
            items.value = []
            cursor.value = null
            hasMore.value = false
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteItem(item) {
        error.value = null

        try {
            switch (item.type) {
                case 'STUFF':
                    await apiClient.deleteStuff(item.id)
                    break
                case 'ACTION':
                    await apiClient.deleteAction(item.id)
                    break
                case 'PROJECT':
                    await apiClient.deleteProject(item.id)
                    break
                default:
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(`Unknown item type: ${item.type}`)
            }

            items.value = items.value.filter(i => i.id !== item.id)

            if (cursor.value === item.id) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }
        } catch (err) {
            error.value = err
            throw err
        }
    }

    return {
        items,
        loading,
        error,
        cursor,
        limit,
        hasMore,

        loadTrash,
        restoreItem,
        restoreItems,
        emptyTrash,
        deleteItem,
    }
}
