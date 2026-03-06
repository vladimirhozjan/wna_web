import { reactive } from 'vue'
import { getNotificationSettings, updateNotificationSettings } from '../core/apiClient.js'

// Known events from backend
const EVENTS = ['task_due_today', 'daily_next_actions', 'project_needs_next_action']

let instance = null

export function notificationModel() {
    if (instance) return instance

    // Internal store: per-channel disabled event arrays
    let disabledEvents = {}

    const state = reactive({
        // UI state: true = enabled (not disabled)
        emailEnabled: true,       // master toggle: false when "*" in disabled_events.email
        taskDueToday: true,
        dailyNextActions: true,
        projectNeedsNextAction: true,

        loading: false,
        loaded: false,
        saving: {
            emailEnabled: false,
            taskDueToday: false,
            dailyNextActions: false,
            projectNeedsNextAction: false,
        },
        error: null,
    })

    function isDisabled(event) {
        // Check general first, then email channel
        const general = disabledEvents.general || []
        const email = disabledEvents.email || []
        return general.includes(event) || email.includes(event)
    }

    function applyToState() {
        const email = disabledEvents.email || []
        state.emailEnabled = !email.includes('*')
        state.taskDueToday = !isDisabled('task_due_today')
        state.dailyNextActions = !isDisabled('daily_next_actions')
        state.projectNeedsNextAction = !isDisabled('project_needs_next_action')
    }

    function buildDisabledEmail() {
        // Build the email disabled array from current UI state
        const disabled = []
        if (!state.taskDueToday) disabled.push('task_due_today')
        if (!state.dailyNextActions) disabled.push('daily_next_actions')
        if (!state.projectNeedsNextAction) disabled.push('project_needs_next_action')
        return disabled
    }

    async function load() {
        if (state.loading) return

        state.loading = true
        state.error = null

        try {
            const data = await getNotificationSettings()
            disabledEvents = data.disabled_events || {}
            applyToState()
            state.loaded = true
        } catch (err) {
            if (err.status !== 404) {
                state.error = err
            }
            // On 404, keep defaults (all enabled)
        } finally {
            state.loading = false
        }
    }

    async function toggleEvent(stateKey, event, value) {
        const oldValue = state[stateKey]
        state[stateKey] = value
        state.saving[stateKey] = true
        try {
            const emailDisabled = buildDisabledEmail()
            const payload = { disabled_events: { email: emailDisabled } }
            const data = await updateNotificationSettings(payload)
            disabledEvents = data.disabled_events || {}
        } catch (err) {
            state[stateKey] = oldValue
            throw err
        } finally {
            state.saving[stateKey] = false
        }
    }

    async function setEmailEnabled(value) {
        const oldValue = state.emailEnabled
        state.emailEnabled = value
        state.saving.emailEnabled = true
        try {
            const emailDisabled = value ? buildDisabledEmail() : ['*']
            const payload = { disabled_events: { email: emailDisabled } }
            const data = await updateNotificationSettings(payload)
            disabledEvents = data.disabled_events || {}
            applyToState()
        } catch (err) {
            state.emailEnabled = oldValue
            throw err
        } finally {
            state.saving.emailEnabled = false
        }
    }

    async function setTaskDueToday(value) {
        return toggleEvent('taskDueToday', 'task_due_today', value)
    }

    async function setDailyNextActions(value) {
        return toggleEvent('dailyNextActions', 'daily_next_actions', value)
    }

    async function setProjectNeedsNextAction(value) {
        return toggleEvent('projectNeedsNextAction', 'project_needs_next_action', value)
    }

    instance = {
        state,
        load,
        setEmailEnabled,
        setTaskDueToday,
        setDailyNextActions,
        setProjectNeedsNextAction,
    }

    return instance
}
