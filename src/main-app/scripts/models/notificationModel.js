import { reactive } from 'vue'
import { getNotificationSettings, updateNotificationSettings, getPushConfig, putPushSubscription, deletePushSubscription } from '../core/apiClient.js'

// Settings → Notifications rows; team = shown to Team only, web: false = email only (announcements never go to devices)
export const NOTIFICATION_GROUPS = [
    { name: 'Your work', events: [
        { event: 'daily_digest', label: 'Daily digest', hint: 'Today, next actions and what\'s due, in your timezone' },
        { event: 'project_needs_next_action', label: 'Project needs a next action' },
    ] },
    { name: 'Delegation', events: [
        { event: 'delegated_to_you', label: 'Delegated to you', team: true },
        { event: 'delegation_completed', label: 'Delegation completed', hint: 'An action you delegated is done', team: true },
    ] },
    { name: 'Shared projects', events: [
        { event: 'project_shared', label: 'Project shared with you', team: true },
        { event: 'project_unshared', label: 'Project no longer shared', team: true },
        { event: 'member_added', label: 'Member added', team: true },
        { event: 'member_removed', label: 'Member removed', team: true },
        { event: 'member_role_changed', label: 'Your role changed', team: true },
        { event: 'action_assigned', label: 'A member took an action', hint: 'In projects you own', team: true },
        { event: 'action_unassigned', label: 'A member gave an action back', hint: 'In projects you own', team: true },
    ] },
    { name: 'Connections', events: [
        { event: 'connection_invite', label: 'Connection invitations' },
        { event: 'connection_accepted', label: 'Invitation accepted', team: true },
        { event: 'connection_declined', label: 'Invitation declined', team: true },
    ] },
    { name: 'Product news', events: [
        { event: 'announcement', label: 'Announcements', hint: 'Product news and feature announcements', web: false },
    ] },
]

const EVENTS = NOTIFICATION_GROUPS.flatMap(g => g.events)
const WEB_EVENTS = EVENTS.filter(e => e.web !== false)

// The offer banner was answered in this sign-in (D10); cleared on every sign-in and sign-out
const ANSWERED_KEY = 'wna_push_answered'

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

let instance = null

export function notificationModel() {
    if (instance) return instance

    // Server store: per-channel disabled event arrays
    let disabledEvents = {}
    let vapidKey = null
    let pushDisabled = false
    let permissionWatched = false

    const state = reactive({
        // true = on (not disabled)
        emailEnabled: true,       // master toggle: false when "*" in disabled_events.email
        email: Object.fromEntries(EVENTS.map(e => [e.event, true])),
        web: Object.fromEntries(WEB_EVENTS.map(e => [e.event, true])),

        loading: false,
        loaded: false,
        saving: {},               // 'emailEnabled' | '<channel>:<event>' → true while saving
        error: null,

        // This browser: unsupported | ios-tab (iPhone / iPad outside the Home Screen app) | blocked | off | on
        device: 'unsupported',
        deviceBusy: false,
        answered: localStorage.getItem(ANSWERED_KEY) === '1',
    })

    function applyToState() {
        const email = disabledEvents.email || []
        const web = disabledEvents.web || []
        state.emailEnabled = !email.includes('*')
        for (const { event } of EVENTS) state.email[event] = !email.includes(event)
        for (const { event } of WEB_EVENTS) state.web[event] = !web.includes('*') && !web.includes(event)
    }

    function buildPayload() {
        return {
            disabled_events: {
                email: state.emailEnabled ? EVENTS.filter(e => !state.email[e.event]).map(e => e.event) : ['*'],
                web: WEB_EVENTS.filter(e => !state.web[e.event]).map(e => e.event),
            },
        }
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

    // Values stay in the model while saving so the email cells keep theirs when the master toggle goes off and on
    async function save(savingKey, apply, revert) {
        apply()
        state.saving[savingKey] = true
        try {
            const data = await updateNotificationSettings(buildPayload())
            disabledEvents = data.disabled_events || {}
        } catch (err) {
            revert()
            throw err
        } finally {
            state.saving[savingKey] = false
        }
    }

    function setEmailEnabled(value) {
        const old = state.emailEnabled
        return save('emailEnabled', () => { state.emailEnabled = value }, () => { state.emailEnabled = old })
    }

    function setEvent(channel, event, value) {
        const old = state[channel][event]
        return save(`${channel}:${event}`, () => { state[channel][event] = value }, () => { state[channel][event] = old })
    }

    // ── This device (Web Push) ──

    function pushSupported() {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    }

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
    }

    // The service worker is registered in production builds only (main.js)
    async function registration() {
        if (!import.meta.env.PROD || !pushSupported()) return null
        return navigator.serviceWorker.ready
    }

    async function loadConfig() {
        if (vapidKey || pushDisabled) return vapidKey
        try {
            vapidKey = (await getPushConfig()).vapid_public_key || null
        } catch (err) {
            if (err.status === 404) pushDisabled = true
        }
        return vapidKey
    }

    function watchPermission() {
        if (permissionWatched || !navigator.permissions) return
        permissionWatched = true
        navigator.permissions.query({ name: 'notifications' })
            .then((status) => { status.onchange = () => refreshDevice() })
            .catch(() => {})
    }

    async function readDevice() {
        if (IS_IOS && !isStandalone()) return { device: 'ios-tab' }
        if (!pushSupported()) return { device: 'unsupported' }
        const [reg, key] = await Promise.all([registration(), loadConfig()])
        if (!reg || !key) return { device: 'unsupported' }
        if (Notification.permission === 'denied') return { device: 'blocked' }
        const sub = await reg.pushManager.getSubscription()
        return { device: Notification.permission === 'granted' && sub ? 'on' : 'off', sub }
    }

    async function refreshDevice() {
        watchPermission()
        const read = await readDevice().catch(() => ({ device: 'unsupported' }))
        if (!state.deviceBusy) state.device = read.device
        return read
    }

    // App start (F7): re-send this sign-in's subscription — the browser may have rotated the endpoint. Never subscribes.
    async function syncDevice() {
        const { device, sub } = await refreshDevice()
        if (device === 'on') putPushSubscription(sub.toJSON()).catch(() => {})
    }

    // Resolves 'on' | 'blocked' | 'dismissed' (prompt closed without a choice); throws when subscribing fails.
    // The permission prompt comes first so it still runs inside the click (Safari).
    async function enableDevice() {
        state.deviceBusy = true
        try {
            let permission = Notification.permission
            if (permission !== 'granted') permission = await Notification.requestPermission()
            if (permission === 'denied') {
                state.device = 'blocked'
                return 'blocked'
            }
            if (permission !== 'granted') {
                state.device = 'off'
                return 'dismissed'
            }
            const reg = await registration()
            const sub = await reg.pushManager.getSubscription()
                || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToBytes(vapidKey) })
            await putPushSubscription(sub.toJSON())
            state.device = 'on'
            return 'on'
        } catch (err) {
            state.device = 'off'
            throw err
        } finally {
            state.deviceBusy = false
        }
    }

    // This device only: other devices and the browser permission stay as they are
    async function disableDevice() {
        state.deviceBusy = true
        try {
            await deletePushSubscription()
            const sub = await (await registration())?.pushManager.getSubscription()
            await sub?.unsubscribe()
            state.device = 'off'
        } finally {
            state.deviceBusy = false
        }
    }

    function markAnswered() {
        localStorage.setItem(ANSWERED_KEY, '1')
        state.answered = true
    }

    // A browser subscription always belongs to the current sign-in (D10); the server row goes with the session
    async function resetDevice() {
        localStorage.removeItem(ANSWERED_KEY)
        state.answered = false
        try {
            const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null
            const sub = await reg?.pushManager?.getSubscription()
            await sub?.unsubscribe()
        } catch { /* nothing to remove */ }
        if (state.device === 'on') state.device = 'off'
    }

    instance = {
        state,
        load,
        setEmailEnabled,
        setEvent,
        refreshDevice,
        syncDevice,
        enableDevice,
        disableDevice,
        markAnswered,
        onSignIn: resetDevice,
        onSignOut: resetDevice,
    }

    return instance
}

function base64UrlToBytes(value) {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}
