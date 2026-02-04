import { ref } from 'vue'
import apiClient from './apiClient.js'

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)
const totalItems = ref(0)

export function nextActionModel() {

    async function loadActions({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const data = await apiClient.listActions({
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

            const count_data = await apiClient.nextActionCount()
            totalItems.value = count_data.count

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getAction(actionId) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.getAction(actionId)
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

    async function addAction(title, description = '') {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addAction({ title, description })
            await loadActions({ reset: true })
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateAction(actionId, data) {
        loading.value = true
        error.value = null

        try {
            const updated = await apiClient.updateAction(actionId, data)

            items.value = items.value.map(i =>
                i.id === actionId ? { ...i, ...data } : i
            )

            if (current.value?.id === actionId) {
                current.value = { ...current.value, ...data }
            }

            return updated
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function deleteAction(actionId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.deleteAction(actionId)
            items.value = items.value.filter(i => i.id !== actionId)

            if (cursor.value === actionId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === actionId) {
                current.value = null
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function trashAction(actionId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.trashAction(actionId)
            items.value = items.value.filter(i => i.id !== actionId)

            if (cursor.value === actionId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === actionId) {
                current.value = null
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function moveAction(actionId, toIndex) {
        error.value = null

        try {
            await apiClient.moveAction(actionId, toIndex)
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function completeAction(actionId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.completeAction(actionId)
            items.value = items.value.filter(i => i.id !== actionId)

            if (cursor.value === actionId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === actionId) {
                current.value = null
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getActionByPosition(position) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.getActionByPosition(position)
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

    return {
        items,
        current,
        loading,
        error,
        cursor,
        limit,
        hasMore,
        totalItems,

        loadActions,
        getAction,
        getActionByPosition,
        addAction,
        updateAction,
        deleteAction,
        trashAction,
        moveAction,
        completeAction,
    }
}
