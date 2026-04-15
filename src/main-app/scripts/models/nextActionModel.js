import { ref } from 'vue'
import apiClient from '../core/apiClient.js'
import { PAGE_SIZE } from '../core/domains.js'
import { statsModel } from './statsModel.js'
import { errorModel } from '../core/errorModel.js'

function truncateTitle(title, maxLen = 30) {
    if (!title || title.length <= maxLen) return title
    return title.slice(0, maxLen).trim() + '\u2026'
}

const items = ref([])
const current = ref(null)
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(PAGE_SIZE)
const hasMore = ref(true)
const totalItems = ref(0)
const activeTags = ref(null)

// Version counter to prevent stale loadActions responses from overwriting fresh data
let loadVersion = 0

export function nextActionModel() {

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

            const { total_count, items: data } = await apiClient.listActions({
                limit: limit.value,
                cursor: cursor.value,
                tags: tagsParam,
            })

            // Stale response — a newer loadActions was called while we were waiting
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

    async function getAction(actionId) {
        // Don't touch the shared loading ref — this is a detail-page operation
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
            const created = await apiClient.addAction({ title, description, state: 'NEXT' })
            await loadActions({ reset: true })
            statsModel().refreshStats()
            errorModel().success(`"${truncateTitle(title)}" added to Next`)
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

    async function deleteAction(actionId) {
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
            statsModel().refreshStats()
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

        if (current.value?.id === actionId) {
            current.value = null
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
        // Don't touch the shared loading ref — this is a detail-page operation
        error.value = null

        try {
            const data = await apiClient.getActionByPosition(position)
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
        deleteAction,
        trashAction,
        moveAction,
        completeAction,
        removeItem,
        changeActionState,
    }
}
