import { ref, computed, watch } from 'vue'
import apiClient from '../core/apiClient.js'
import { PAGE_SIZE } from '../core/domains.js'
import { statsModel } from './statsModel.js'
import { settingsModel } from './settingsModel.js'
import { parseISO, format } from '../core/dateUtils.js'
import {
    bucketForDate,
    buildContext,
    buildSectionCounts,
    buildGroups,
    buildWeekChart,
    buildMonthChart,
    buildYearChart,
} from '../core/completedTimeline.js'

// ── List state ──
const items = ref([])
const loading = ref(false)
const error = ref(null)
const cursor = ref(null)
const limit = ref(PAGE_SIZE)
const hasMore = ref(true)
const totalItems = ref(0)

// ── Stats state (raw {daily, monthly, total} from /v1/completed/stats) ──
// Store the raw series; charts/counts are computed() derivations — no pre-bucketed map is stored.
const stats = ref(null)
const statsLoading = ref(false)
const statsError = ref(null)

const settings = settingsModel()
const weekStartsOn = computed(() => settings.getCalendarSettings().weekStartsOn)

// `now` is captured per evaluation (refreshes on reconcile, good enough for a page session).
const sectionCounts = computed(() =>
    stats.value ? buildSectionCounts(stats.value, new Date(), weekStartsOn.value) : null
)

const groups = computed(() =>
    buildGroups(items.value, sectionCounts.value, new Date(), weekStartsOn.value)
)

const charts = computed(() => {
    if (!stats.value) return null
    const now = new Date()
    return {
        week: buildWeekChart(stats.value, now, weekStartsOn.value),
        month: buildMonthChart(stats.value, now, weekStartsOn.value),
        year: buildYearChart(stats.value, now),
    }
})

// True only when there is at least one completion — drives "show charts" vs the cold empty state.
const hasCompletions = computed(() => (stats.value?.total || 0) > 0)

let reconcileTimer = null

async function loadCompleted({ reset = false } = {}) {
    loading.value = true
    error.value = null

    try {
        if (reset) {
            cursor.value = null
        }

        const { total_count, items: data } = await apiClient.listCompleted({
            limit: limit.value,
            cursor: cursor.value,
        })

        // Mark all items as checked since they're completed
        const checkedData = data.map(item => ({ ...item, checked: true }))

        if (reset) {
            items.value = checkedData
        } else if (checkedData.length > 0) {
            items.value.push(...checkedData)
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

// The stats fetch is INDEPENDENT of the list fetch — a failure here hides charts/degrades counts but must never block the list.
async function loadStats() {
    statsLoading.value = true
    statsError.value = null
    try {
        stats.value = await apiClient.getCompletedStats()
    } catch (err) {
        statsError.value = err
        stats.value = null
    } finally {
        statsLoading.value = false
    }
}

// Optimistically drop the restored item's contribution so counts/charts update in the same tick as the row removal.
function applyOptimisticRemoval(item) {
    if (!stats.value || !item?.completed_at) return
    const d = parseISO(item.completed_at)
    const b = bucketForDate(d, buildContext(new Date(), weekStartsOn.value))
    const next = { ...stats.value, daily: [...stats.value.daily], monthly: [...stats.value.monthly] }
    if (b.key[0] === 'm' && b.key[1] === '-') {
        const mk = format(d, 'yyyy-MM')
        const idx = next.monthly.findIndex(x => x.month === mk)
        if (idx >= 0 && next.monthly[idx].count > 0)
            next.monthly[idx] = { ...next.monthly[idx], count: next.monthly[idx].count - 1 }
    } else {
        const dk = format(d, 'yyyy-MM-dd')
        const idx = next.daily.findIndex(x => x.date === dk)
        if (idx >= 0 && next.daily[idx].count > 0)
            next.daily[idx] = { ...next.daily[idx], count: next.daily[idx].count - 1 }
    }
    if (next.total > 0) next.total -= 1
    stats.value = next
}

// Debounced, coalesced reconcile of stats + list; the list reloads to its current depth so loaded groups don't collapse to page one.
function reconcile() {
    clearTimeout(reconcileTimer)
    reconcileTimer = setTimeout(async () => {
        const depth = Math.max(limit.value, items.value.length)
        const [listRes, statsRes] = await Promise.allSettled([
            apiClient.listCompleted({ limit: depth, cursor: null }),
            apiClient.getCompletedStats(),
        ])
        if (listRes.status === 'fulfilled') {
            const data = listRes.value
            const rows = (data.items || []).map(it => ({ ...it, checked: true }))
            items.value = rows
            totalItems.value = data.total_count
            cursor.value = rows.length ? rows[rows.length - 1].id : null
            hasMore.value = data.total_count > rows.length
        }
        if (statsRes.status === 'fulfilled') {
            stats.value = statsRes.value
            statsError.value = null
        }
    }, 300)
}

// Watch the length getter: catches in-place splices but ignores per-row toggles, and a same-length re-fetch won't re-fire, so this can't loop.
watch(() => items.value.length, (len, prevLen) => {
    if (len < prevLen) reconcile()
})

async function uncompleteItem(item) {
    error.value = null

    try {
        switch (item.type) {
            case 'STUFF':
                await apiClient.uncompleteStuff(item.id)
                break
            case 'ACTION':
                await apiClient.uncompleteAction(item.id)
                break
            case 'PROJECT':
                await apiClient.uncompleteProject(item.id)
                break
            default:
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(`Unknown item type: ${item.type}`)
        }

        statsModel().refreshStats()
    } catch (err) {
        error.value = err
        throw err
    }
}

function removeItem(itemId) {
    const removed = items.value.find(i => i.id === itemId)
    // Optimistic count/chart update in the same tick as the row removal.
    if (removed) applyOptimisticRemoval(removed)

    items.value = items.value.filter(i => i.id !== itemId)

    if (cursor.value === itemId) {
        const last = items.value[items.value.length - 1]
        cursor.value = last ? last.id : null
    }
    // The items watcher schedules the coalesced reconcile of stats + list.
}

export function completedModel() {
    return {
        items,
        loading,
        error,
        cursor,
        limit,
        hasMore,

        // Stats / derivations
        stats,
        statsLoading,
        statsError,
        groups,
        charts,
        sectionCounts,
        hasCompletions,

        loadCompleted,
        loadStats,
        uncompleteItem,
        removeItem,
    }
}
