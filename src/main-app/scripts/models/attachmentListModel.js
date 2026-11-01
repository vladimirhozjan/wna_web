import {ref, computed} from 'vue'
import apiClient from '../core/apiClient.js'
import { PAGE_SIZE } from '../core/domains.js'
import {statsModel} from './statsModel.js'
import {referenceModel} from './referenceModel.js'

let instance = null

export function attachmentListModel() {
    if (instance) return instance

    const items = ref([])
    const totalCount = ref(0)
    const offset = ref(0)
    const limit = ref(PAGE_SIZE)
    const loading = ref(false)
    const error = ref(null)

    const hasMore = computed(() => offset.value + items.value.length < totalCount.value)

    // keepDepth: a live re-read — silent, at the loaded depth, dropped while a user load runs
    async function loadAttachments({reset = false, keepDepth = false} = {}) {
        if (keepDepth && loading.value) return
        if (!keepDepth) {
            loading.value = true
            error.value = null
        }

        try {
            if (reset) {
                offset.value = 0
            }

            const data = await apiClient.listAllAttachments({
                limit: keepDepth ? Math.max(limit.value, items.value.length) : limit.value,
                offset: offset.value,
                side: referenceModel().side.value,
            })

            if (keepDepth && loading.value) return

            const list = Array.isArray(data) ? data : (data.attachments || [])
            totalCount.value = data.total ?? list.length

            if (reset) {
                items.value = list
            } else {
                items.value.push(...list)
            }
        } catch (err) {
            if (!keepDepth) error.value = err
            throw err
        } finally {
            if (!keepDepth) loading.value = false
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
