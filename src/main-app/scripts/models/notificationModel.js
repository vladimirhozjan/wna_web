import { reactive } from 'vue'
import { getNotificationSettings, updateNotificationSettings } from '../core/apiClient.js'

let instance = null

export function notificationModel() {
    if (instance) return instance

    // Internal store: per-channel disabled event arrays
    let disabledEvents = {}

    const state = reactive({
        // UI state: true = enabled (not disabled)
        emailEnabled: true,       // master toggle: false when "*" in disabled_events.email
        dailyDigest: true,
        projectNeedsNextAction: true,
        delegatedToYou: true,
        delegationCompleted: true,
        connectionInvite: true,

        loading: false,
        loaded: false,
        saving: {
            emailEnabled: false,
            dailyDigest: false,
            projectNeedsNextAction: false,
            delegatedToYou: false,
            delegationCompleted: false,
            connectionInvite: false,
        },
        error: null,
    })

    function isDisabled(event) {
        const general = disabledEvents.general || []
        const email = disabledEvents.email || []
        return general.includes(event) || email.includes(event)
    }

    function applyToState() {
        const email = disabledEvents.email || []
        state.emailEnabled = !email.includes('*')
        state.dailyDigest = !isDisabled('daily_digest')
        state.projectNeedsNextAction = !isDisabled('project_needs_next_action')
        state.delegatedToYou = !isDisabled('delegated_to_you')
        state.delegationCompleted = !isDisabled('delegation_completed')
        state.connectionInvite = !isDisabled('connection_invite')
    }

    function buildDisabledEmail() {
        const disabled = []
        if (!state.dailyDigest) disabled.push('daily_digest')
        if (!state.projectNeedsNextAction) disabled.push('project_needs_next_action')
        if (!state.delegatedToYou) disabled.push('delegated_to_you')
        if (!state.delegationCompleted) disabled.push('delegation_completed')
        if (!state.connectionInvite) disabled.push('connection_invite')
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

    async function setDailyDigest(value) {
        return toggleEvent('dailyDigest', 'daily_digest', value)
    }

    async function setProjectNeedsNextAction(value) {
        return toggleEvent('projectNeedsNextAction', 'project_needs_next_action', value)
    }

    async function setDelegatedToYou(value) {
        return toggleEvent('delegatedToYou', 'delegated_to_you', value)
    }

    async function setDelegationCompleted(value) {
        return toggleEvent('delegationCompleted', 'delegation_completed', value)
    }

    async function setConnectionInvite(value) {
        return toggleEvent('connectionInvite', 'connection_invite', value)
    }

    instance = {
        state,
        load,
        setEmailEnabled,
        setDailyDigest,
        setProjectNeedsNextAction,
        setDelegatedToYou,
        setDelegationCompleted,
        setConnectionInvite,
    }

    return instance
}
