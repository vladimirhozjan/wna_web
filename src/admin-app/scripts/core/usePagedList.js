import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorModel } from './errorModel.js'

// Server-paged list whose page + filters live in the URL query; fetcher gets { offset, limit, ...non-empty filters }.
export function usePagedList(fetcher, filterDefaults = {}, errorText = 'Failed to load') {
    const route = useRoute()
    const router = useRouter()
    const toaster = errorModel()
    const routeName = route.name
    const pageSize = 20

    const items = ref([])
    const total = ref(0)
    const loading = ref(true)

    const page = computed(() => Number(route.query.page) || 1)
    const filters = computed(() => Object.fromEntries(
        Object.entries(filterDefaults).map(([key, def]) => [key, route.query[key] || def])))

    function setQuery(patch) {
        router.replace({ query: { ...route.query, ...patch } })
    }

    function setPage(p) {
        setQuery({ page: p > 1 ? String(p) : undefined })
    }

    function setFilter(key, value) {
        setQuery({ [key]: value && value !== filterDefaults[key] ? value : undefined, page: undefined })
    }

    async function load() {
        loading.value = true
        try {
            const params = { offset: (page.value - 1) * pageSize, limit: pageSize }
            for (const [key, value] of Object.entries(filters.value)) {
                if (value) params[key] = value
            }
            const data = await fetcher(params)
            items.value = data.items || []
            total.value = data.total_count || 0
        } catch (err) {
            toaster.push(err.message || errorText)
        } finally {
            loading.value = false
        }
    }

    // fires once more while leaving the route — skip that
    watch(() => route.fullPath, () => { if (route.name === routeName) load() }, { immediate: true })

    return { items, total, loading, page, pageSize, filters, setPage, setFilter, reload: load }
}
