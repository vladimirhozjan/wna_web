import { ref, computed } from 'vue'
import {
    formatDate,
    navigateDate,
    getDateRange,
    isSameDay,
    parseISO,
    addDays,
} from './dateUtils.js'

const items = ref([])
const currentDate = ref(new Date())
const viewMode = ref('month')
const loading = ref(false)
const error = ref(null)

let instance = null

function generateMockData() {
    const today = new Date()
    const mockItems = []

    mockItems.push({
        id: 'mock-1',
        title: 'Team standup meeting',
        type: 'ACTION',
        scheduled_date: formatDate(today),
        scheduled_time: '09:00',
    })

    mockItems.push({
        id: 'mock-2',
        title: 'Review quarterly report',
        type: 'ACTION',
        scheduled_date: formatDate(today),
        scheduled_time: '14:30',
    })

    mockItems.push({
        id: 'mock-3',
        title: 'Client presentation',
        type: 'ACTION',
        scheduled_date: formatDate(addDays(today, 1)),
        scheduled_time: '10:00',
    })

    mockItems.push({
        id: 'mock-4',
        title: 'Start new project research',
        type: 'ACTION',
        start_date: formatDate(addDays(today, 2)),
        start_time: '08:00',
    })

    mockItems.push({
        id: 'mock-5',
        title: 'Follow up with vendor',
        type: 'ACTION',
        start_date: formatDate(today),
        start_time: null,
    })

    mockItems.push({
        id: 'mock-6',
        title: 'Doctor appointment',
        type: 'ACTION',
        scheduled_date: formatDate(addDays(today, 3)),
        scheduled_time: '11:00',
    })

    mockItems.push({
        id: 'mock-7',
        title: 'Code review session',
        type: 'ACTION',
        scheduled_date: formatDate(addDays(today, -1)),
        scheduled_time: '15:00',
    })

    mockItems.push({
        id: 'mock-8',
        title: 'Prepare slides for workshop',
        type: 'ACTION',
        start_date: formatDate(addDays(today, 5)),
        start_time: '09:00',
    })

    mockItems.push({
        id: 'mock-9',
        title: 'All-day planning session',
        type: 'ACTION',
        scheduled_date: formatDate(addDays(today, 4)),
        scheduled_time: null,
    })

    mockItems.push({
        id: 'mock-10',
        title: 'Weekly sync',
        type: 'ACTION',
        scheduled_date: formatDate(addDays(today, 7)),
        scheduled_time: '10:30',
    })

    for (let i = 11; i <= 18; i++) {
        const dayOffset = Math.floor(Math.random() * 30) - 15
        const isScheduled = Math.random() > 0.3
        const hasTime = Math.random() > 0.3
        const hour = 8 + Math.floor(Math.random() * 10)
        const minute = Math.random() > 0.5 ? '00' : '30'

        if (isScheduled) {
            mockItems.push({
                id: `mock-${i}`,
                title: `Task ${i}`,
                type: 'ACTION',
                scheduled_date: formatDate(addDays(today, dayOffset)),
                scheduled_time: hasTime ? `${String(hour).padStart(2, '0')}:${minute}` : null,
            })
        } else {
            mockItems.push({
                id: `mock-${i}`,
                title: `Deferred task ${i}`,
                type: 'ACTION',
                start_date: formatDate(addDays(today, dayOffset)),
                start_time: hasTime ? `${String(hour).padStart(2, '0')}:${minute}` : null,
            })
        }
    }

    return mockItems
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
            // TODO: Replace with actual API call when backend is ready
            // const data = await apiClient.listCalendarActions({ start: startDate, end: endDate })
            await new Promise(resolve => setTimeout(resolve, 300))
            items.value = generateMockData()
            return items.value
        } catch (err) {
            error.value = err
            throw err
        } finally {
            loading.value = false
        }
    }

    async function createScheduledAction(date, time, title) {
        loading.value = true
        error.value = null

        try {
            // TODO: Replace with actual API call
            // const created = await apiClient.addAction({
            //     title,
            //     scheduled_date: date,
            //     scheduled_time: time
            // })
            await new Promise(resolve => setTimeout(resolve, 200))
            const created = {
                id: `mock-${Date.now()}`,
                title,
                type: 'ACTION',
                scheduled_date: date,
                scheduled_time: time,
            }
            items.value.push(created)
            return created
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
            // TODO: Replace with actual API call
            // await apiClient.updateAction(actionId, {
            //     scheduled_date: newDate,
            //     scheduled_time: newTime
            // })
            await new Promise(resolve => setTimeout(resolve, 200))
            items.value = items.value.map(item => {
                if (item.id === actionId) {
                    if (item.scheduled_date) {
                        return { ...item, scheduled_date: newDate, scheduled_time: newTime }
                    } else {
                        return { ...item, start_date: newDate, start_time: newTime }
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
    }

    function setCurrentDate(date) {
        currentDate.value = date
    }

    instance = {
        items,
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
        createScheduledAction,
        rescheduleAction,
        goToToday,
        goToPrev,
        goToNext,
        setViewMode,
        setCurrentDate,
    }

    return instance
}
