import { ref, computed } from 'vue'
import {
    formatDate,
    navigateDate,
    getDateRange,
} from './dateUtils.js'
import { listCalendar, getCalendarDensity, addAction, deferAction } from './apiClient.js'

const STORAGE_KEY = 'calendar_view_mode'
const validViewModes = ['day', 'week', 'month', 'year']

function loadSavedViewMode() {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved && validViewModes.includes(saved) ? saved : 'month'
}

function getCalendarSettings() {
    return {
        timeFormat: localStorage.getItem('calendar_time_format') || '12h',
        businessHoursStart: parseInt(localStorage.getItem('calendar_business_hours_start')) || 9,
        businessHoursEnd: parseInt(localStorage.getItem('calendar_business_hours_end')) || 17,
        businessDays: JSON.parse(localStorage.getItem('calendar_business_days') || '[1,2,3,4,5]'),
    }
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

    const dateRange = computed(() =>
        getDateRange(currentDate.value, viewMode.value)
    )

    function getItemsForDate(date) {
        const dateStr = formatDate(date)
        return items.value.filter(item => {
            const itemDate = item.scheduled_date || item.start_date
            return itemDate === dateStr
        })
    }

    function getItemsForDateRange(startDate, endDate) {
        const startStr = formatDate(startDate)
        const endStr = formatDate(endDate)
        return items.value.filter(item => {
            const itemDate = item.scheduled_date || item.start_date
            return itemDate >= startStr && itemDate <= endStr
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

    function hasTime(item) {
        return !!(item.scheduled_time || item.start_time)
    }

    function getItemTime(item) {
        return item.scheduled_time || item.start_time || null
    }

    function getItemDate(item) {
        return item.scheduled_date || item.start_date
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
            // Create action with scheduled date/time
            const actionData = {
                title,
                scheduled_date: date,
            }
            if (time) {
                actionData.scheduled_time = time
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
                duration: null,
                due_date: null,
            }

            items.value = [...items.value, newItem]
            return newItem
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function rescheduleAction(actionId, newDate, newTime) {
        loading.value = true
        error.value = null

        try {
            // Use defer API to reschedule
            const type = 'scheduled'
            await deferAction(actionId, type, newDate, newTime)

            // Update local state
            items.value = items.value.map(item => {
                if (item.id === actionId) {
                    return {
                        ...item,
                        scheduled_date: newDate,
                        scheduled_time: newTime,
                        start_date: null,
                        start_time: null,
                    }
                }
                return item
            })
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
        hasTime,
        getItemTime,
        getItemDate,

        loadCalendarItems,
        loadDensity,
        createScheduledAction,
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
