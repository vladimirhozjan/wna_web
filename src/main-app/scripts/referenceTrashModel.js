import {ref, computed} from 'vue'
import apiClient from './apiClient.js'
import { statsModel } from './statsModel.js'

let instance = null

export function referenceTrashModel() {
    if (instance) return instance

    const files = ref([])
    const totalFiles = ref(0)
    const offset = ref(0)
    const limit = ref(20)
    const loading = ref(false)
    const error = ref(null)

    const hasMore = computed(() => offset.value + files.value.length < totalFiles.value)

    async function loadTrash({reset = false} = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                offset.value = 0
            }

            const data = await apiClient.listRefTrash({
                limit: limit.value,
                offset: offset.value,
            })

            const items = Array.isArray(data) ? data : (data.files || [])
            totalFiles.value = data.total ?? items.length

            if (reset) {
                files.value = items
            } else {
                files.value.push(...items)
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function loadMore() {
        offset.value = files.value.length
        await loadTrash()
    }

    async function restoreFile(id) {
        error.value = null
        try {
            await apiClient.restoreRefFile(id)
            files.value = files.value.filter(f => f.id !== id)
            totalFiles.value = Math.max(0, totalFiles.value - 1)
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function permanentDelete(id) {
        error.value = null
        try {
            await apiClient.permanentDeleteRefFile(id)
            files.value = files.value.filter(f => f.id !== id)
            totalFiles.value = Math.max(0, totalFiles.value - 1)
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    async function emptyTrash() {
        error.value = null
        try {
            await apiClient.emptyRefTrash()
            files.value = []
            totalFiles.value = 0
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        }
    }

    instance = {
        files,
        totalFiles,
        loading,
        error,
        hasMore,

        loadTrash,
        loadMore,
        restoreFile,
        permanentDelete,
        emptyTrash,
    }
    return instance
}
