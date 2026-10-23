import { ref } from 'vue'
import apiClient from '../core/apiClient.js'

// contracts/limits.md §Search
export const SEARCH_MIN_LENGTH = 2
const DROPDOWN_LIMIT = 8
const PAGE_LIMIT = 20
// Same debounce as the Reference search
const DEBOUNCE_MS = 300

let instance = null

export function searchModel() {
    if (instance) return instance
    instance = {
        dropdown: createSearch(DROPDOWN_LIMIT),
        // Own instance — the palette can open over a SearchBox that keeps its term
        palette: createSearch(DROPDOWN_LIMIT),
        page: createSearch(PAGE_LIMIT),
    }
    return instance
}

function createSearch(limit) {
    const term = ref('')
    const types = ref([])
    const items = ref([])
    const totalCount = ref(0)
    const cursor = ref(null)
    const loading = ref(false)
    const loadingMore = ref(false)
    const error = ref(null)
    // Term of the last rendered response; null until one arrives
    const resultTerm = ref(null)

    // Bumped by every new search / reset so only the latest response renders
    let requestId = 0
    let timer = null

    function reset() {
        clearTimeout(timer)
        requestId++
        term.value = ''
        items.value = []
        totalCount.value = 0
        cursor.value = null
        loading.value = false
        loadingMore.value = false
        error.value = null
        resultTerm.value = null
    }

    function input(value, {debounce = true} = {}) {
        clearTimeout(timer)
        const q = value.trim()
        if (q.length < SEARCH_MIN_LENGTH) {
            reset()
            return
        }
        // Same term already loading or shown — no new request
        if (q === term.value && !error.value && (loading.value || resultTerm.value === q)) return
        if (!debounce) {
            run(q)
            return
        }
        timer = setTimeout(() => run(q), DEBOUNCE_MS)
    }

    function setTypes(value) {
        types.value = value
        if (term.value) run(term.value)
    }

    function retry() {
        if (term.value) run(term.value)
    }

    async function run(q) {
        clearTimeout(timer)
        const id = ++requestId
        term.value = q
        loading.value = true
        loadingMore.value = false
        error.value = null
        try {
            const data = await apiClient.searchItems({q, types: types.value, limit})
            if (id !== requestId) return
            items.value = data.items || []
            totalCount.value = data.total_count ?? items.value.length
            cursor.value = data.cursor ?? null
            resultTerm.value = q
        } catch (err) {
            if (id !== requestId) return
            items.value = []
            totalCount.value = 0
            cursor.value = null
            resultTerm.value = q
            error.value = err
        } finally {
            if (id === requestId) loading.value = false
        }
    }

    async function loadMore() {
        if (!cursor.value || loadingMore.value) return
        const id = requestId
        loadingMore.value = true
        try {
            const data = await apiClient.searchItems({q: term.value, types: types.value, limit, cursor: cursor.value})
            if (id !== requestId) return
            items.value.push(...(data.items || []))
            totalCount.value = data.total_count ?? totalCount.value
            cursor.value = data.cursor ?? null
        } finally {
            if (id === requestId) loadingMore.value = false
        }
    }

    return {
        term,
        types,
        items,
        totalCount,
        cursor,
        loading,
        loadingMore,
        error,
        resultTerm,
        input,
        setTypes,
        retry,
        loadMore,
        reset,
    }
}

export function searchRoute(item) {
    switch (item.type) {
        case 'stuff': return {name: 'stuff-detail', params: {id: item.id}}
        case 'action': return {name: 'action-detail', params: {id: item.id}}
        case 'project': return {name: 'project-detail', params: {id: item.id}}
        case 'recurring': return {name: 'recurring-detail', params: {id: item.id}}
        case 'reference': {
            const query = {side: item.reference?.side, file: item.id}
            if (item.reference?.folder_id) query.folder = item.reference.folder_id
            return {name: 'reference', query}
        }
        default: return null
    }
}

// Case- and accent-folded like the server's wna_unaccent(lower()); mappings NFD can't decompose stay unmarked
function fold(ch) {
    return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Splits text into [{text, mark}] parts, marking every occurrence of term
export function markParts(text, term) {
    if (!text) return []
    const needle = Array.from(term.trim()).map(fold).join('')
    if (!needle) return [{text, mark: false}]

    // folded char index → [start, end) in the original string
    let folded = ''
    const origin = []
    let pos = 0
    for (const ch of text) {
        const f = fold(ch)
        for (let i = 0; i < f.length; i++) origin.push([pos, pos + ch.length])
        folded += f
        pos += ch.length
    }

    const parts = []
    let last = 0
    let from = 0
    let idx
    while ((idx = folded.indexOf(needle, from)) !== -1) {
        const start = origin[idx][0]
        const end = origin[idx + needle.length - 1][1]
        if (start >= last) {
            if (start > last) parts.push({text: text.slice(last, start), mark: false})
            parts.push({text: text.slice(start, end), mark: true})
            last = end
        }
        from = idx + needle.length
    }
    if (last < text.length) parts.push({text: text.slice(last), mark: false})
    return parts
}
