import { ref } from 'vue'
import apiClient from '../core/apiClient.js'
import { statsModel } from './statsModel.js'

const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(10)
const hasMore = ref(true)
const activeTags = ref(null)

export function somedayModel() {

    async function loadSomeday({ reset = false, tags = undefined } = {}) {
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

            const data = await apiClient.listSomeday({
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
                    await apiClient.activateAction(item.id)
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
            statsModel().refreshStats()
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
            statsModel().refreshStats()
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

    async function addSomeday(title) {
        loading.value = true
        error.value = null

        try {
            const created = await apiClient.addStuff({ title, state: 'SOMEDAY' })
            await loadSomeday({ reset: true })
            statsModel().refreshStats()
            return created
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function moveItem(itemId, toIndex) {
        error.value = null

        try {
            await apiClient.moveSomeday(itemId, toIndex)
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
        addSomeday,
        activateItem,
        trashItem,
        updateItem,
        moveItem,
    }
}
