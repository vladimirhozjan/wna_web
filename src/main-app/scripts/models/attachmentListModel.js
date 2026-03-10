import {ref, computed} from 'vue'
import apiClient from '../core/apiClient.js'
import {statsModel} from './statsModel.js'

let instance = null

export function attachmentListModel() {
    if (instance) return instance

    const items = ref([])
    const totalCount = ref(0)
    const offset = ref(0)
    const limit = ref(20)
    const loading = ref(false)
    const error = ref(null)

    const hasMore = computed(() => offset.value + items.value.length < totalCount.value)

    async function loadAttachments({reset = false} = {}) {
        loading.value = true
        error.value = null

        try {
            if (reset) {
                offset.value = 0
            }

            const data = await apiClient.listAllAttachments({
                limit: limit.value,
                offset: offset.value,
            })

            const list = Array.isArray(data) ? data : (data.attachments || [])
            totalCount.value = data.total ?? list.length

            if (reset) {
                items.value = list
            } else {
                items.value.push(...list)
            }
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function loadMore() {
        offset.value = items.value.length
        await loadAttachments()
    }

    function removeItem(id) {
        items.value = items.value.filter(a => a.id !== id)
        totalCount.value = Math.max(0, totalCount.value - 1)
        statsModel().refreshStats()
    }

    instance = {
        items,
        totalCount,
        loading,
        error,
        hasMore,

        loadAttachments,
        loadMore,
        removeItem,
    }
    return instance
}
