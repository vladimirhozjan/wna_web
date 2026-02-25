import { ref } from 'vue'
import apiClient from './apiClient.js'
import { statsModel } from './statsModel.js'

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)
const totalItems = ref(0)
const activeTags = ref(null)

export function waitingModel() {

    async function loadWaiting({ reset = false, tags = undefined } = {}) {
        loading.value = true
        error.value = null

        try {
            if (tags !== undefined) {
                activeTags.value = tags
            }

            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const tagsParam = activeTags.value?.length ? activeTags.value.join(',') : null

            const data = await apiClient.listWaiting({
                limit: limit.value,
                cursor: cursor.value,
                tags: tagsParam,
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

            const count_data = await apiClient.waitingCount()
            totalItems.value = count_data.count

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getWaitingByPosition(position) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.getWaitingByPosition(position)
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

    async function addWaiting(title, waitingFor) {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addAction({ title, state: 'WAITING', waiting_for: waitingFor })
            await loadWaiting({ reset: true })
            statsModel().refreshStats()
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateWaiting(actionId, data) {
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

            statsModel().refreshStats()
            return updated
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function trashWaiting(actionId) {
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
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function moveWaiting(actionId, toIndex) {
        error.value = null

        try {
            await apiClient.moveWaitingPosition(actionId, toIndex)
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function completeWaiting(actionId) {
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
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function unwaitAction(actionId) {
        loading.value = true
        error.value = null

        try {
            const result = await apiClient.unwaitAction(actionId)
            items.value = items.value.filter(i => i.id !== actionId)

            if (cursor.value === actionId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === actionId) {
                current.value = null
            }

            statsModel().refreshStats()
            return result
        } catch (err) {
            error.value = err
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

        loadWaiting,
        getWaitingByPosition,
        addWaiting,
        updateWaiting,
        trashWaiting,
        moveWaiting,
        completeWaiting,
        unwaitAction,
    }
}
