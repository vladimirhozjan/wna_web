import { ref } from 'vue'
import apiClient from './apiClient.js'

const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)

export function somedayModel() {

    async function loadSomeday({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const data = await apiClient.listSomeday({
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

    async function activateItem(item) {
        error.value = null

        try {
            switch (item.type) {
                case 'STUFF':
                    await apiClient.activateStuff(item.id)
                    break
                case 'ACTION':
                    await apiClient.activateAction(item.id, item.title)
                    break
                case 'PROJECT':
                    await apiClient.activateProject(item.id)
                    break
                default:
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

    async function updateItem(item, data) {
        error.value = null

        try {
            switch (item.type) {
                case 'STUFF':
                    await apiClient.updateStuff(item.id, data)
                    break
                case 'ACTION':
                    await apiClient.updateAction(item.id, data)
                    break
                case 'PROJECT':
                    await apiClient.updateProject(item.id, data)
                    break
                default:
                    throw new Error(`Unknown item type: ${item.type}`)
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

        loadSomeday,
        activateItem,
        trashItem,
        updateItem,
    }
}
