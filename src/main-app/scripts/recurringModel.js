import { ref } from 'vue'
import apiClient from './apiClient.js'
import { statsModel } from './statsModel.js'

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)

export function recurringModel() {

    async function loadRecurring() {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.listRecurring()
            items.value = Array.isArray(data) ? data : (data.items || [])
            return items.value
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getRecurring(id) {
        error.value = null

        try {
            const data = await apiClient.getRecurring(id)
            current.value = data
            return data
        } catch (err) {
            error.value = err
            current.value = null
            throw err
        }
    }

    async function createRecurring(data) {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.createRecurring(data)
            await loadRecurring()
            statsModel().refreshStats()
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateRecurring(id, data) {
        error.value = null

        try {
            const updated = await apiClient.updateRecurring(id, data)

            items.value = items.value.map(i =>
                i.id === id ? { ...i, ...data } : i
            )

            if (current.value?.id === id) {
                current.value = { ...current.value, ...data }
            }

            statsModel().refreshStats()
            return updated
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function deleteRecurring(id, deleteActiveInstance = false) {
        error.value = null

        try {
            await apiClient.deleteRecurring(id, deleteActiveInstance)
            items.value = items.value.filter(i => i.id !== id)

            if (current.value?.id === id) {
                current.value = null
            }
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function spawnRecurring(id) {
        error.value = null

        try {
            await apiClient.spawnRecurring(id)
            const updated = await getRecurring(id)
            statsModel().refreshStats()
            return updated
        } catch (err) {
            error.value = err
            throw err
        }
    }

    return {
        items,
        current,
        loading,
        error,

        loadRecurring,
        getRecurring,
        createRecurring,
        updateRecurring,
        deleteRecurring,
        spawnRecurring,
    }
}
