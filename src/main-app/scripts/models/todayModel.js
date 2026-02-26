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
const activeTags = ref(null)

let loadVersion = 0

export function todayModel() {

    async function loadActions({ reset = false, tags = undefined } = {}) {
        loading.value = true
        error.value = null

        const myVersion = ++loadVersion

        try {
            if (tags !== undefined) {
                activeTags.value = tags
            }

            if (reset) {
                cursor.value = null
                hasMore.value = true
            }

            const tagsParam = activeTags.value?.length ? activeTags.value.join(',') : null

            const data = await apiClient.listTodayActions({
                limit: limit.value,
                cursor: cursor.value,
                tags: tagsParam,
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

            hasMore.value = data.length >= limit.value

            const count_data = await apiClient.todayCount()
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

    async function getAction(actionId) {
        error.value = null

        try {
            const data = await apiClient.getAction(actionId)
            current.value = data
            return data
        } catch (err) {
            error.value = err
            current.value = null
            throw err
        }
    }

    async function addAction(title, description = '') {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addAction({ title, description, state: 'TODAY' })
            await loadActions({ reset: true })
            statsModel().refreshStats()
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateAction(actionId, data) {
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

            if (current.value?.id === actionId) {
                current.value = null
            }
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
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
        }
    }

    async function changeActionState(actionId, state, title) {
        error.value = null

        try {
            await apiClient.changeActionState(actionId, state, title)
            items.value = items.value.filter(i => i.id !== actionId)

            if (cursor.value === actionId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === actionId) {
                current.value = { ...current.value, state }
            }
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function getActionByPosition(position) {
        error.value = null

        try {
            const data = await apiClient.getTodayActionByPosition(position)
            current.value = data
            return data
        } catch (err) {
            error.value = err
            current.value = null
            throw err
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
        trashAction,
        moveAction,
        completeAction,
        changeActionState,
    }
}
