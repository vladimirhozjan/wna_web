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

export function projectModel() {

    async function loadProjects({ reset = false, tags = undefined } = {}) {
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

            const data = await apiClient.listProjects({
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

            const count_data = await apiClient.projectsCount()
            totalItems.value = count_data.count

            return data
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function getProject(projectId) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.getProject(projectId)
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

    async function addProject(title, description = '', outcome = '') {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addProject({ title, description, outcome })
            await loadProjects({ reset: true })
            statsModel().refreshStats()
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function updateProject(projectId, data) {
        loading.value = true
        error.value = null

        try {
            const updated = await apiClient.updateProject(projectId, data)

            items.value = items.value.map(i =>
                i.id === projectId ? { ...i, ...data } : i
            )

            if (current.value?.id === projectId) {
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

    async function deleteProject(projectId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.deleteProject(projectId)
            items.value = items.value.filter(i => i.id !== projectId)

            if (cursor.value === projectId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === projectId) {
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

    async function trashProject(projectId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.trashProject(projectId)
            items.value = items.value.filter(i => i.id !== projectId)

            if (cursor.value === projectId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === projectId) {
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

    async function moveProject(projectId, toIndex) {
        error.value = null

        try {
            await apiClient.moveProject(projectId, toIndex)
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function getProjectByPosition(position) {
        loading.value = true
        error.value = null

        try {
            const data = await apiClient.getProjectByPosition(position)
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

    async function completeProject(projectId) {
        loading.value = true
        error.value = null

        try {
            await apiClient.completeProject(projectId)
            items.value = items.value.filter(i => i.id !== projectId)

            if (cursor.value === projectId) {
                const last = items.value[items.value.length - 1]
                cursor.value = last ? last.id : null
            }

            if (current.value?.id === projectId) {
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

    async function getProjectActions(projectId) {
        error.value = null

        try {
            const data = await apiClient.listProjectActions(projectId)
            return data
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
        cursor,
        limit,
        hasMore,
        totalItems,

        loadProjects,
        getProject,
        getProjectByPosition,
        addProject,
        updateProject,
        deleteProject,
        trashProject,
        moveProject,
        completeProject,
        getProjectActions,
    }
}
