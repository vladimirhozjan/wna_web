import { reactive, computed, watch } from 'vue'
import apiClient from '../core/apiClient.js'
import { authModel } from '../core/authModel.js'

export const HORIZON_LEVELS = ['area', 'goal', 'vision', 'purpose']

const NONE_LABEL = { area: 'No area', goal: 'No goal' }

function emptyLevels() {
    return { area: [], goal: [], vision: [], purpose: [] }
}

let instance = null

export function horizonModel() {
    if (instance) return instance

    const state = reactive({
        levels: emptyLevels(),
        unlinkedCount: 0,
        unlinkedProjects: [],
        dueLevels: [],
        loading: false,
        loaded: false,
        error: null,
    })

    // Only the newest load applies, so an older response can't overwrite a later one
    let loadSeq = 0

    const hasAreas = computed(() => state.levels.area.length > 0)
    const hasGoals = computed(() => state.levels.goal.length > 0)

    function apply(data) {
        const levels = emptyLevels()
        for (const level of HORIZON_LEVELS) levels[level] = data.levels?.[level] || []
        state.levels = levels
        state.unlinkedCount = data.unlinked_active_project_count ?? 0
        state.unlinkedProjects = data.unlinked_projects || []
        state.dueLevels = data.due_levels || []
    }

    async function load() {
        const seq = ++loadSeq
        state.loading = true
        state.error = null
        try {
            const data = await apiClient.getHorizons()
            if (seq !== loadSeq) return
            apply(data)
            state.loaded = true
        } catch (err) {
            if (seq === loadSeq) state.error = err
            throw err
        } finally {
            if (seq === loadSeq) state.loading = false
        }
    }

    // Background refresh after a write; failures keep what is on screen
    function refresh() {
        load().catch(() => {})
    }

    async function add(level, title) {
        const created = await apiClient.createHorizonItem({ level, title })
        const item = { ...created }
        if (level === 'area' || level === 'goal') {
            Object.assign(item, { active_project_count: 0, linked_project_count: 0, projects: [] })
        }
        state.levels[level] = [...state.levels[level], item]
        return item
    }

    async function rename(id, title) {
        const level = HORIZON_LEVELS.find(l => state.levels[l].some(i => i.id === id))
        const item = state.levels[level]?.find(i => i.id === id)
        const oldTitle = item?.title
        if (item) item.title = title
        try {
            const updated = await apiClient.updateHorizonItem(id, title)
            if (item) item.title = updated.title
        } catch (err) {
            if (item) item.title = oldTitle
            throw err
        }
    }

    async function move(id, destination) {
        try {
            await apiClient.moveHorizonItem(id, destination)
        } catch (err) {
            refresh()
            throw err
        }
    }

    async function remove(id, moveTo = null) {
        await apiClient.deleteHorizonItem(id, moveTo)
        for (const level of HORIZON_LEVELS) {
            state.levels[level] = state.levels[level].filter(i => i.id !== id)
        }
        refresh()
    }

    // Undo of a delete without links: re-create {level, title, position} at the old place (new id; nothing referenced the old one)
    async function restore(item) {
        await apiClient.createHorizonItem({ level: item.level, title: item.title, position: item.position })
        await load()
    }

    // Select options for the project area / goal pickers, in /horizons order
    function options(level) {
        return [
            { value: '', label: NONE_LABEL[level] },
            ...state.levels[level].map(i => ({ value: i.id, label: i.title })),
        ]
    }

    // Another user may sign in in this tab — never show the previous user's items
    watch(authModel().isAuthenticated, () => {
        loadSeq++
        apply({})
        state.loaded = false
        state.loading = false
    })

    instance = {
        state,
        hasAreas,
        hasGoals,
        load,
        refresh,
        add,
        rename,
        move,
        remove,
        restore,
        options,
    }

    return instance
}
