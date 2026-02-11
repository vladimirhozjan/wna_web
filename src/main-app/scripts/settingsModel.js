import { reactive, watch } from 'vue'
import { getSettings, updateSettings } from './apiClient.js'

// Default settings matching backend defaults
const DEFAULTS = {
    application: {
        new_items_position: 'end',
    },
    calendar: {
        time_format: '24-hour',
        business_hours_start: '09:00',
        business_hours_end: '17:00',
        business_days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    },
    debug: {
        enabled: false,
    },
}

// Map day names to numbers and vice versa
const DAY_NAME_TO_NUM = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
const DAY_NUM_TO_NAME = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

let instance = null

export function settingsModel() {
    if (instance) return instance

    const state = reactive({
        // Application settings
        newItemsPosition: 'end',

        // Calendar settings
        timeFormat: '24-hour',
        businessHoursStart: 9,
        businessHoursEnd: 17,
        businessDays: [1, 2, 3, 4, 5], // 0=Sun, 1=Mon, ...

        // Debug settings
        debugEnabled: false,

        // Loading state
        loading: false,
        loaded: false,
        error: null,

        // Saving state per setting (for showing spinners)
        saving: {
            newItemsPosition: false,
            timeFormat: false,
            businessHoursStart: false,
            businessHoursEnd: false,
            businessDays: false,
            debugEnabled: false,
        },
    })

    // Parse HH:MM to hour number
    function parseHour(timeStr) {
        if (!timeStr) return 9
        const [hours] = timeStr.split(':')
        return parseInt(hours, 10)
    }

    // Format hour number to HH:MM
    function formatHour(hour) {
        return `${String(hour).padStart(2, '0')}:00`
    }

    // Convert day names array to numbers array
    function dayNamesToNumbers(names) {
        if (!Array.isArray(names)) return [1, 2, 3, 4, 5]
        return names.map(name => DAY_NAME_TO_NUM[name]).filter(n => n !== undefined).sort((a, b) => a - b)
    }

    // Convert day numbers array to names array
    function dayNumbersToNames(numbers) {
        if (!Array.isArray(numbers)) return ['mon', 'tue', 'wed', 'thu', 'fri']
        return numbers.map(n => DAY_NUM_TO_NAME[n]).filter(Boolean)
    }

    // Apply settings from API response to state
    function applySettings(settings) {
        if (settings.application) {
            state.newItemsPosition = settings.application.new_items_position || DEFAULTS.application.new_items_position
        }
        if (settings.calendar) {
            state.timeFormat = settings.calendar.time_format || DEFAULTS.calendar.time_format
            state.businessHoursStart = parseHour(settings.calendar.business_hours_start)
            state.businessHoursEnd = parseHour(settings.calendar.business_hours_end)
            state.businessDays = dayNamesToNumbers(settings.calendar.business_days)
        }
        if (settings.debug) {
            state.debugEnabled = settings.debug.enabled ?? DEFAULTS.debug.enabled
        }
    }

    // Load settings from localStorage as fallback
    function loadFromLocalStorage() {
        state.newItemsPosition = localStorage.getItem('pref-add-position') || 'end'

        const timeFormat = localStorage.getItem('calendar_time_format')
        state.timeFormat = timeFormat === '12h' ? '12-hour' : (timeFormat === '24h' ? '24-hour' : '24-hour')

        state.businessHoursStart = parseInt(localStorage.getItem('calendar_business_hours_start')) || 9
        state.businessHoursEnd = parseInt(localStorage.getItem('calendar_business_hours_end')) || 17
        state.businessDays = JSON.parse(localStorage.getItem('calendar_business_days') || '[1,2,3,4,5]')
        state.debugEnabled = localStorage.getItem('debug-window') !== null
    }

    // Save settings to localStorage for quick access
    function saveToLocalStorage() {
        localStorage.setItem('pref-add-position', state.newItemsPosition)

        // Convert API format to old localStorage format for backwards compatibility
        const timeFormatOld = state.timeFormat === '12-hour' ? '12h' : '24h'
        localStorage.setItem('calendar_time_format', timeFormatOld)

        localStorage.setItem('calendar_business_hours_start', state.businessHoursStart.toString())
        localStorage.setItem('calendar_business_hours_end', state.businessHoursEnd.toString())
        localStorage.setItem('calendar_business_days', JSON.stringify(state.businessDays))

        if (state.debugEnabled) {
            localStorage.setItem('debug-window', 'true')
        } else {
            localStorage.removeItem('debug-window')
        }
    }

    // Load settings from API
    async function load() {
        if (state.loading) return

        state.loading = true
        state.error = null

        try {
            const settings = await getSettings()
            applySettings(settings)
            saveToLocalStorage()
            state.loaded = true
        } catch (err) {
            state.error = err
            // Fall back to localStorage on error
            loadFromLocalStorage()
        } finally {
            state.loading = false
        }
    }

    // Save a specific setting section to API
    async function save(section, data) {
        try {
            await updateSettings({ [section]: data })
            saveToLocalStorage()
        } catch (err) {
            state.error = err
            throw err
        }
    }

    // Update application settings
    async function setNewItemsPosition(value) {
        const oldValue = state.newItemsPosition
        state.newItemsPosition = value
        state.saving.newItemsPosition = true
        saveToLocalStorage()
        try {
            await save('application', { new_items_position: value })
        } catch (err) {
            state.newItemsPosition = oldValue
            saveToLocalStorage()
            throw err
        } finally {
            state.saving.newItemsPosition = false
        }
    }

    // Update calendar settings
    async function setTimeFormat(value) {
        const oldValue = state.timeFormat
        state.timeFormat = value
        state.saving.timeFormat = true
        saveToLocalStorage()
        try {
            await save('calendar', { time_format: value })
        } catch (err) {
            state.timeFormat = oldValue
            saveToLocalStorage()
            throw err
        } finally {
            state.saving.timeFormat = false
        }
    }

    async function setBusinessHoursStart(value) {
        const oldValue = state.businessHoursStart
        state.businessHoursStart = value
        state.saving.businessHoursStart = true
        saveToLocalStorage()
        try {
            await save('calendar', { business_hours_start: formatHour(value) })
        } catch (err) {
            state.businessHoursStart = oldValue
            saveToLocalStorage()
            throw err
        } finally {
            state.saving.businessHoursStart = false
        }
    }

    async function setBusinessHoursEnd(value) {
        const oldValue = state.businessHoursEnd
        state.businessHoursEnd = value
        state.saving.businessHoursEnd = true
        saveToLocalStorage()
        try {
            await save('calendar', { business_hours_end: formatHour(value) })
        } catch (err) {
            state.businessHoursEnd = oldValue
            saveToLocalStorage()
            throw err
        } finally {
            state.saving.businessHoursEnd = false
        }
    }

    async function setBusinessDays(value) {
        const oldValue = [...state.businessDays]
        state.businessDays = value
        state.saving.businessDays = true
        saveToLocalStorage()
        try {
            await save('calendar', { business_days: dayNumbersToNames(value) })
        } catch (err) {
            state.businessDays = oldValue
            saveToLocalStorage()
            throw err
        } finally {
            state.saving.businessDays = false
        }
    }

    // Update debug settings
    async function setDebugEnabled(value) {
        const oldValue = state.debugEnabled
        state.debugEnabled = value
        state.saving.debugEnabled = true
        saveToLocalStorage()
        // Notify App.vue about the change
        window.dispatchEvent(new CustomEvent('debug-mode-changed', { detail: value }))
        try {
            await save('debug', { enabled: value })
        } catch (err) {
            state.debugEnabled = oldValue
            saveToLocalStorage()
            window.dispatchEvent(new CustomEvent('debug-mode-changed', { detail: oldValue }))
            throw err
        } finally {
            state.saving.debugEnabled = false
        }
    }

    // Get calendar settings object (for calendarModel compatibility)
    function getCalendarSettings() {
        return {
            timeFormat: state.timeFormat === '12-hour' ? '12h' : '24h',
            businessHoursStart: state.businessHoursStart,
            businessHoursEnd: state.businessHoursEnd,
            businessDays: state.businessDays,
        }
    }

    // Initialize from localStorage immediately (for components that mount before API load completes)
    loadFromLocalStorage()

    instance = {
        state,
        load,
        save,
        setNewItemsPosition,
        setTimeFormat,
        setBusinessHoursStart,
        setBusinessHoursEnd,
        setBusinessDays,
        setDebugEnabled,
        getCalendarSettings,
    }

    return instance
}
