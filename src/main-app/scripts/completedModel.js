import { ref } from 'vue'
import apiClient from './apiClient.js'

const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)

export function completedModel() {

    async function loadCompleted({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const data = await apiClient.listCompleted({
                limit: limit.value,
                cursor: cursor.value,
            })

            // Mark all items as checked since they're completed
            const checkedData = data.map(item => ({ ...item, checked: true }))

            if (reset) {
                items.value = checkedData
            } else if (checkedData.length > 0) {
                items.value.push(...checkedData)
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

    async function uncompleteItem(item) {
        error.value = null

        try {
            switch (item.type) {
                case 'STUFF':
                    await apiClient.uncompleteStuff(item.id)
                    break
                case 'ACTION':
                    await apiClient.uncompleteAction(item.id)
                    break
                case 'PROJECT':
                    await apiClient.uncompleteProject(item.id)
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

    async function trashItem(item) {
        error.value = null

        try {
            switch (item.type) {
                case 'STUFF':
                    await apiClient.trashStuff(item.id)
                    break
                case 'ACTION':
                    await apiClient.trashAction(item.id)
                    break
                case 'PROJECT':
                    await apiClient.trashProject(item.id)
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

        loadCompleted,
        uncompleteItem,
        trashItem,
    }
}
