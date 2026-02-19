import { ref } from 'vue'
import { getTags } from './apiClient.js'
import { settingsModel } from './settingsModel.js'

export const DEFAULT_PRESETS = ['@computer', '@office', '@home', '@calls', '@anywhere', 'energy:high', 'energy:low', 'min:5', 'min:30']

let instance = null

export function tagModel() {
    if (instance) return instance

    const tags = ref([])
    const loaded = ref(false)
    const loading = ref(false)

    async function loadTags({ force = false } = {}) {
        if (loaded.value && !force) return
        if (loading.value) return

        loading.value = true
        try {
            const data = await getTags()
            tags.value = Array.isArray(data) ? data : []
            loaded.value = true
        } catch {
            // Silently fail - autocomplete is optional
        } finally {
            loading.value = false
        }
    }

    function addToCache(newTags) {
        if (!Array.isArray(newTags)) return
        for (const tag of newTags) {
            const normalized = tag.trim().toLowerCase()
            if (normalized && !tags.value.includes(normalized)) {
                tags.value.push(normalized)
            }
        }
    }

    function filterSuggestions(query, excludeTags = []) {
        const q = (query || '').trim().toLowerCase()
        return tags.value.filter(tag =>
            !excludeTags.includes(tag) &&
            (q === '' || tag.includes(q))
        )
    }

    function getPresets() {
        const settings = settingsModel()
        const custom = settings.state.tagPresets
        return (custom && custom.length > 0) ? custom : DEFAULT_PRESETS
    }

    function reset() {
        tags.value = []
        loaded.value = false
        loading.value = false
    }

    instance = { tags, loaded, loading, loadTags, addToCache, filterSuggestions, getPresets, reset }
    return instance
}
