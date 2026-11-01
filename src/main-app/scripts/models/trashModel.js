import { ref } from 'vue'
import apiClient from '../core/apiClient.js'
import { PAGE_SIZE } from '../core/domains.js'
import { statsModel } from './statsModel.js'

const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(PAGE_SIZE)
const hasMore = ref(true)
const totalItems = ref(0)

export function trashModel() {

    // keepDepth: a live re-read — silent, at the loaded depth, dropped while a user load runs
    async function loadTrash({ reset = false, keepDepth = false } = {}) {
        if (keepDepth && loading.value) return
        if (!keepDepth) {
            loading.value = true
            error.value = null
        }

        try {
            if (reset) {
                cursor.value = null
            }

            const { total_count, items: data } = await apiClient.listTrash({
                limit: keepDepth ? Math.max(limit.value, items.value.length) : limit.value,
                cursor: cursor.value,
            })

            if (keepDepth && loading.value) return data

            if (reset) {
                items.value = data
            } else if (data.length > 0) {
                items.value.push(...data)
            }

            if (data.length > 0) {
                cursor.value = data[data.length - 1].id
            }

            totalItems.value = total_count
            hasMore.value = total_count > items.value.length

            return data
        } catch (err) {
            if (!keepDepth) error.value = err
            throw err
        } finally {
            if (!keepDepth) loading.value = false
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
            statsModel().refreshStats()
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
            statsModel().refreshStats()
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
            statsModel().refreshStats()
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
