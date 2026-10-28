import { ref } from 'vue'
import apiClient from '../core/apiClient.js'
import { PAGE_SIZE } from '../core/domains.js'
import { statsModel } from './statsModel.js'
import { errorModel } from '../core/errorModel.js'
import { truncateTitle } from '../core/textUtils.js'

// List rows carry the name as `title` too, so ItemList / Item render and rename them as-is
function toRow(t) {
    return { ...t, title: t.name }
}

const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const hasMore = ref(false)
const totalItems = ref(0)
const current = ref(null)

export function projectTemplateModel() {

    async function loadTemplates({ reset = false } = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) cursor.value = null

            const { total_count, items: data } = await apiClient.listProjectTemplates({
                limit: PAGE_SIZE,
                cursor: cursor.value,
            })

            if (reset) {
                items.value = data.map(toRow)
            } else if (data.length > 0) {
                items.value.push(...data.map(toRow))
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

    async function getTemplate(id) {
        const data = await apiClient.getProjectTemplate(id)
        current.value = data
        return data
    }

    async function saveFromProject(project) {
        const created = await apiClient.saveProjectAsTemplate(project.id)
        errorModel().success(`"${truncateTitle(project.title)}" saved as a template`)
        return created
    }

    async function renameTemplate(id, name) {
        await apiClient.renameProjectTemplate(id, name)
        const row = items.value.find(i => i.id === id)
        if (row) Object.assign(row, { name, title: name })
        if (current.value?.id === id) current.value.name = name
    }

    // A template already gone (404) counts as deleted
    async function deleteTemplate(id, name) {
        try {
            await apiClient.deleteProjectTemplate(id)
        } catch (err) {
            if (err.status !== 404) throw err
        }
        items.value = items.value.filter(i => i.id !== id)
        totalItems.value = Math.max(0, totalItems.value - 1)
        if (current.value?.id === id) current.value = null
        errorModel().success(`"${truncateTitle(name)}" deleted`)
    }

    async function addAction(id, title) {
        const created = await apiClient.addTemplateAction(id, { title })
        if (current.value?.id === id) current.value.actions.push(created)
        return created
    }

    async function updateAction(id, actionId, data) {
        await apiClient.updateTemplateAction(id, actionId, data)
        const action = current.value?.id === id && current.value.actions.find(a => a.id === actionId)
        if (action) Object.assign(action, data, data.description === '' ? { description: null } : {})
    }

    async function deleteAction(id, actionId) {
        await apiClient.deleteTemplateAction(id, actionId)
        if (current.value?.id === id) current.value.actions = current.value.actions.filter(a => a.id !== actionId)
    }

    async function moveAction(id, actionId, destination) {
        await apiClient.moveTemplateAction(id, actionId, destination)
    }

    async function instantiate(id, title, outcome) {
        const created = await apiClient.instantiateProjectTemplate(id, { title, outcome })
        statsModel().refreshStats()
        return created
    }

    async function listTargets(id) {
        const { items: targets } = await apiClient.listTemplateTargets(id)
        return targets
    }

    async function appendToProject(id, target) {
        const { added_count } = await apiClient.appendProjectTemplate(id, target.id)
        statsModel().refreshStats()
        const noun = added_count === 1 ? 'action' : 'actions'
        errorModel().success(`${added_count} ${noun} added to "${truncateTitle(target.title)}"`)
        return added_count
    }

    return {
        items,
        loading,
        error,
        hasMore,
        totalItems,
        current,

        loadTemplates,
        getTemplate,
        saveFromProject,
        renameTemplate,
        deleteTemplate,
        addAction,
        updateAction,
        deleteAction,
        moveAction,
        instantiate,
        listTargets,
        appendToProject,
    }
}
