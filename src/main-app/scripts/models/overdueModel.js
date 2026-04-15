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

let loadVersion = 0

export function overdueModel() {

    async function loadItems({ reset = false } = {}) {
        loading.value = true
        error.value = null

        const myVersion = ++loadVersion

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const { total_count, items: data } = await apiClient.listOverdue({
                limit: limit.value,
                cursor: cursor.value,
            })

            if (myVersion !== loadVersion) return data

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

    async function updateAction(actionId, data) {
        error.value = null

        try {
            const updated = await apiClient.updateAction(actionId, data)

            items.value = items.value.map(i =>
                i.id === actionId ? { ...i, ...data } : i
            )

            statsModel().refreshStats()
            return updated
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function trashAction(actionId) {
        error.value = null

        try {
            await apiClient.trashAction(actionId)
            items.value = items.value.filter(i => i.id !== actionId)

            if (cursor.value === actionId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function completeAction(actionId) {
        error.value = null

        try {
            await apiClient.completeAction(actionId)
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    function removeItem(actionId) {
        items.value = items.value.filter(i => i.id !== actionId)

        if (cursor.value === actionId) {
            const last = items.value[items.value.length - 1]
            cursor.value = last ? last.id : null
        }
    }

    return {
        items,
        loading,
        error,
        hasMore,
        totalItems,

        loadItems,
        updateAction,
        trashAction,
        completeAction,
        removeItem,
    }
}
