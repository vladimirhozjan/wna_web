import { ref, computed } from 'vue'
import apiClient from '../core/apiClient.js'
import { PAGE_SIZE } from '../core/domains.js'
import { statsModel } from './statsModel.js'
import { errorModel } from '../core/errorModel.js'
import { authModel } from '../core/authModel.js'

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

const currentMembers = ref([])
const currentMembersLoading = ref(false)

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
            }

            const tagsParam = activeTags.value?.length ? activeTags.value.join(',') : null

            const { total_count, items: data } = await apiClient.listProjects({
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

            totalItems.value = total_count
            hasMore.value = total_count > items.value.length

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
            errorModel().success(`"${truncateTitle(title)}" added to Projects`)
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
            return await apiClient.listProjectActions(projectId)
        } catch (err) {
            error.value = err
            throw err
        }
    }

    // ── Shared project helpers ──

    const myUserId = computed(() => authModel().currentUser.value?.id || null)

    const currentRole = computed(() => {
        if (!myUserId.value) return null
        const me = currentMembers.value.find(m => m.user_id === myUserId.value)
        return me ? me.role : null
    })

    function isShared(project) {
        return !!(project && project.shared)
    }

    function isOwner(project) {
        if (!project || !myUserId.value) return false
        if (project.owner_id) return project.owner_id === myUserId.value
        if (project.my_role) return project.my_role === 'owner'
        return currentRole.value === 'owner'
    }

    function canWrite(project) {
        if (!isShared(project)) return true
        const tier = authModel().currentUser.value?.subscription_tier
        if (tier !== 'team') return false
        const role = project.my_role || currentRole.value
        return role === 'owner' || role === 'write'
    }

    async function loadMembers(projectId) {
        currentMembersLoading.value = true
        error.value = null
        try {
            const data = await apiClient.listProjectMembers(projectId)
            currentMembers.value = data.members || []
            return currentMembers.value
        } catch (err) {
            error.value = err
            currentMembers.value = []
            throw err
        } finally {
            currentMembersLoading.value = false
        }
    }

    async function shareProject(projectId, members) {
        error.value = null
        try {
            const data = await apiClient.shareProject(projectId, members)
            if (current.value?.id === projectId) {
                current.value = { ...current.value, shared: true, owner_id: myUserId.value, my_role: 'owner' }
            }
            items.value = items.value.map(i =>
                i.id === projectId ? { ...i, shared: true, owner_id: myUserId.value, my_role: 'owner' } : i
            )
            await loadMembers(projectId)
            errorModel().success('Project shared')
            return data
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function unshareProject(projectId) {
        error.value = null
        try {
            const data = await apiClient.unshareProject(projectId)
            if (current.value?.id === projectId) {
                current.value = { ...current.value, shared: false }
            }
            items.value = items.value.map(i =>
                i.id === projectId ? { ...i, shared: false } : i
            )
            currentMembers.value = []
            errorModel().success('Project unshared')
            return data
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function addMember(projectId, userId, role) {
        error.value = null
        try {
            const data = await apiClient.addProjectMember(projectId, userId, role)
            await loadMembers(projectId)
            return data
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function updateMemberRole(projectId, userId, role) {
        error.value = null
        try {
            const data = await apiClient.updateProjectMemberRole(projectId, userId, role)
            currentMembers.value = currentMembers.value.map(m =>
                m.user_id === userId ? { ...m, role } : m
            )
            return data
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function removeMember(projectId, userId) {
        error.value = null
        try {
            const data = await apiClient.removeProjectMember(projectId, userId)
            currentMembers.value = currentMembers.value.filter(m => m.user_id !== userId)
            if (data?.auto_unshared) {
                if (current.value?.id === projectId) {
                    current.value = { ...current.value, shared: false }
                }
                items.value = items.value.map(i =>
                    i.id === projectId ? { ...i, shared: false } : i
                )
                currentMembers.value = []
                errorModel().success('Last member left — project is personal again')
            }
            return data
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function assignAction(actionId) {
        error.value = null
        try {
            return await apiClient.assignAction(actionId)
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function unassignAction(actionId) {
        error.value = null
        try {
            return await apiClient.unassignAction(actionId)
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

        // Shared projects
        currentMembers,
        currentMembersLoading,
        currentRole,
        isShared,
        isOwner,
        canWrite,
        loadMembers,
        shareProject,
        unshareProject,
        addMember,
        updateMemberRole,
        removeMember,
        assignAction,
        unassignAction,
    }
}
