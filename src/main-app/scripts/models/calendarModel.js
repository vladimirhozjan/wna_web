import { ref, computed } from 'vue'
import {
    formatDate,
    navigateDate,
    getDateRange,
    isOverdue,
} from '../core/dateUtils.js'
import { listCalendar, getCalendarDensity, addAction, deferAction } from '../core/apiClient.js'
import { statsModel } from './statsModel.js'
import { settingsModel } from './settingsModel.js'
import { errorModel } from '../core/errorModel.js'

function truncateTitle(title, maxLen = 30) {
    if (!title || title.length <= maxLen) return title
    return title.slice(0, maxLen).trim() + '\u2026'
}

const STORAGE_KEY = 'calendar_view_mode'
const validViewModes = ['day', 'week', 'month', 'year', 'recurring']

function loadSavedViewMode() {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && validViewModes.includes(saved) ? saved : 'month'
}

function getCalendarSettings() {
    const settings = settingsModel()
    return settings.getCalendarSettings()
}

function formatHour(hour, format) {
    if (format === '24h') {
        return `${String(hour).padStart(2, '0')}:00`
    }
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour} ${period}`
}

function isBusinessHour(hour, settings) {
    return hour >= settings.businessHoursStart && hour < settings.businessHoursEnd
}

function isBusinessDay(dayOfWeek, settings) {
    return settings.businessDays.includes(dayOfWeek)
}

const items = ref([])
const densityData = ref({})
const currentDate = ref(new Date())
const viewMode = ref(loadSavedViewMode())
const loading = ref(false)
const error = ref(null)

let instance = null

// Transform API item to calendar item format
function transformItem(apiItem) {
    // Convert time from HH:MM:SS to HH:MM
    const formatTime = (time) => {
        if (!time) return null
        return time.substring(0, 5)  // "09:00:00" -> "09:00"
    }

    return {
        id: apiItem.id,
        title: apiItem.title,
        type: apiItem.type,
        state: apiItem.state,
        scheduled_date: apiItem.scheduled_date || null,
        scheduled_time: formatTime(apiItem.scheduled_time),
        start_date: apiItem.start_date || null,
        start_time: formatTime(apiItem.start_time),
        duration: apiItem.scheduled_duration || null,
        due_date: apiItem.due_date || null,
        due_time: formatTime(apiItem.due_time),
        recurring_parent_id: apiItem.recurring_parent_id || null,
    }
}

export function calendarModel() {
    if (instance) return instance

    const scheduledItems = computed(() =>
        items.value.filter(i => i.scheduled_date)
    )

    const deferredItems = computed(() =>
        items.value.filter(i => i.start_date && !i.scheduled_date)
    )

    const dateRange = computed(() => {
        const settings = getCalendarSettings()
        return getDateRange(currentDate.value, viewMode.value, settings.weekStartsOn)
    })

    function getItemsForDate(date) {
        const dateStr = formatDate(date)
        const result = []
        for (const item of items.value) {
            if (item.scheduled_date === dateStr) {
                result.push({ ...item, _displayReason: 'scheduled' })
            } else if (item.start_date === dateStr) {
                result.push({ ...item, _displayReason: 'start' })
            } else if (item.due_date === dateStr && !item.scheduled_date) {
                // Due-only items show on their due date (skip if also has scheduled on another date)
                result.push({ ...item, _displayReason: 'due' })
            }
        }
        return result
    }

    function getItemsForDateRange(startDate, endDate) {
        const startStr = formatDate(startDate)
        const endStr = formatDate(endDate)
        const seen = new Set()
        return items.value.filter(item => {
            const dates = [item.scheduled_date, item.start_date, item.due_date].filter(Boolean)
            const inRange = dates.some(d => d >= startStr && d <= endStr)
            if (inRange && !seen.has(item.id)) {
                seen.add(item.id)
                return true
            }
            return false
        })
    }

    function getItemCountForDate(date) {
        const dateStr = formatDate(date)
        // Use density data if available for year view
        if (densityData.value[dateStr] !== undefined) {
            return densityData.value[dateStr]
        }
        return getItemsForDate(date).length
    }

    function isScheduledItem(item) {
        return !!item.scheduled_date
    }

    function isDeferredItem(item) {
        return !!item.start_date && !item.scheduled_date
    }

    function isDueOnlyItem(item) {
        return !!item.due_date && !item.scheduled_date && !item.start_date
    }

    function getItemDisplayType(item) {
        if (item._displayReason) return item._displayReason
        if (item.scheduled_date) return 'scheduled'
        if (item.start_date) return 'start'
        if (item.due_date) return 'due'
        return 'scheduled'
    }

    function isItemOverdue(item) {
        return !!item.due_date && isOverdue(item.due_date)
    }

    function hasTime(item) {
        if (item._displayReason === 'due') return !!item.due_time
        return !!(item.scheduled_time || item.start_time)
    }

    function getItemTime(item) {
        if (item._displayReason === 'due') return item.due_time || null
        return item.scheduled_time || item.start_time || null
    }

    function getItemDate(item) {
        if (item._displayReason === 'due') return item.due_date
        return item.scheduled_date || item.start_date || item.due_date
    }

    async function loadCalendarItems(startDate, endDate) {
        loading.value = true
        error.value = null

        try {
            const start = formatDate(startDate)
            const end = formatDate(endDate)
            const data = await listCalendar({ start, end })
            items.value = (data.items || []).map(transformItem)
            return items.value
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function loadDensity(startDate, endDate) {
        try {
            const start = formatDate(startDate)
            const end = formatDate(endDate)
            const data = await getCalendarDensity({ start, end })
            densityData.value = data.density || {}
            return densityData.value
        } catch (err) {
            console.error('Failed to load density:', err)
            return {}
        }
    }

    async function createScheduledAction(date, time, title) {
        loading.value = true
        error.value = null

        try {
            // Create action with scheduled date/time and CALENDAR state in one call
            const actionData = {
                title,
                state: 'CALENDAR',
                scheduled_date: date,
            }
            if (time) {
                actionData.scheduled_time = time
                // scheduled_duration defaults to 30 on backend
            }

            const created = await addAction(actionData)

            // API only returns { id, state, type }, so construct full item locally
            const newItem = {
                id: created.id,
                title,
                type: created.type || 'ACTION',
                state: created.state || 'CALENDAR',
                scheduled_date: date,
                scheduled_time: time || null,
                start_date: null,
                start_time: null,
                duration: time ? 30 : null,
                due_date: null,
            }

            items.value = [...items.value, newItem]
            statsModel().refreshStats()
            errorModel().success(`"${truncateTitle(title)}" added to Calendar`)
            return newItem
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function rescheduleAction(actionId, newDate, newTime, forcedType) {
        loading.value = true
        error.value = null

        try {
            // Auto-detect type from item's current dates when no forcedType
            let type = forcedType
            if (!type) {
                const item = items.value.find(i => i.id === actionId)
                if (item?.scheduled_date) {
                    type = 'scheduled'
                } else if (item?.start_date) {
                    type = 'start'
                } else {
                    type = 'scheduled'
                }
            }

            await deferAction(actionId, type, newDate, newTime)
            // Backend handles mutual exclusivity: /defer with type=scheduled clears due_date

            items.value = items.value.map(item => {
                if (item.id === actionId) {
                    if (type === 'scheduled') {
                        return {
                            ...item,
                            scheduled_date: newDate,
                            scheduled_time: newTime,
                            start_date: null,
                            start_time: null,
                            // Mutual exclusivity: scheduled clears due
                            due_date: null,
                            due_time: null,
                        }
                    } else {
                        return {
                            ...item,
                            start_date: newDate,
                            start_time: newTime,
                            scheduled_date: null,
                            scheduled_time: null,
                            // Keep due_date when using start_after
                        }
                    }
                }
                return item
            })
            statsModel().refreshStats()
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function createDeferredAction(date, time, title, dueDate) {
        loading.value = true
        error.value = null

        try {
            const actionData = {
                title,
                state: 'CALENDAR',
                start_date: date,
            }
            if (time) {
                actionData.start_time = time
            }
            if (dueDate) {
                actionData.due_date = dueDate
            }

            const created = await addAction(actionData)

            const newItem = {
                id: created.id,
                title,
                type: created.type || 'ACTION',
                state: created.state || 'CALENDAR',
                scheduled_date: null,
                scheduled_time: null,
                start_date: date,
                start_time: time || null,
                duration: null,
                due_date: dueDate || null,
                due_time: null,
                recurring_parent_id: null,
            }

            items.value = [...items.value, newItem]
            statsModel().refreshStats()
            errorModel().success(`"${truncateTitle(title)}" added to Calendar`)
            return newItem
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    function goToToday() {
        currentDate.value = new Date()
    }

    function goToPrev() {
        currentDate.value = navigateDate(currentDate.value, viewMode.value, 'prev')
    }

    function goToNext() {
        currentDate.value = navigateDate(currentDate.value, viewMode.value, 'next')
    }

    function setViewMode(mode) {
        viewMode.value = mode
        localStorage.setItem(STORAGE_KEY, mode)
    }

    function setCurrentDate(date) {
        currentDate.value = date
    }

    instance = {
        items,
        densityData,
        currentDate,
        viewMode,
        loading,
        error,
        scheduledItems,
        deferredItems,
        dateRange,

        getItemsForDate,
        getItemsForDateRange,
        getItemCountForDate,
        isScheduledItem,
        isDeferredItem,
        isDueOnlyItem,
        getItemDisplayType,
        isItemOverdue,
        hasTime,
        getItemTime,
        getItemDate,

        loadCalendarItems,
        loadDensity,
        createScheduledAction,
        createDeferredAction,
        rescheduleAction,
        goToToday,
        goToPrev,
        goToNext,
        setViewMode,
        setCurrentDate,

        // Settings
        getCalendarSettings,
        formatHour,
        isBusinessHour,
        isBusinessDay,
    }

    return instance
}
