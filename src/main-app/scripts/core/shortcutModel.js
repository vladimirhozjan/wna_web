import { reactive, computed, shallowRef, onMounted, onBeforeUnmount } from 'vue'
import router from '../../router/router.js'
import { settingsModel } from '../models/settingsModel.js'
import { errorModel } from './errorModel.js'

const MOBILE_QUERY = '(max-width: 768px)'
// Every open modal / Clarify slide-over renders one of these overlays
const MODAL_SELECTOR = '.overlay, .clarify-slideover-overlay, .preview-overlay, .password-modal-overlay'
const MODIFIER_KEYS = new Set(['shift', 'meta', 'control', 'alt'])
const G_TIMEOUT_MS = 1000

// Key-map order; pages without a key are palette-only
const NAVIGATION = [
    {page: 'Engage', key: 'e', route: 'engage'},
    {page: 'Inbox', key: 'i', route: 'inbox'},
    {page: 'Today', key: 't', route: 'today'},
    {page: 'Next', key: 'n', route: 'next'},
    {page: 'Calendar', key: 'c', route: 'calendar'},
    {page: 'Waiting For', key: 'w', route: 'waiting-for'},
    {page: 'Projects', key: 'p', route: 'projects'},
    {page: 'Someday / Maybe', key: 's', route: 'someday'},
    {page: 'Reference', key: 'r', route: 'reference'},
    {page: 'Completed', key: 'd', route: 'completed'},
    {page: 'Trash', key: 'x', route: 'trash'},
    {page: 'Overdue', key: 'o', route: 'overdue'},
    {page: 'Weekly Review', key: 'v', route: 'review'},
    {page: 'Settings', key: ',', route: 'settings'},
    {page: 'Connections', route: 'connections'},
    {page: 'Help', route: 'help'},
].map(n => ({...n, hint: n.key ? `G ${n.key.toUpperCase()}` : ''}))

let instance = null

export function shortcutModel() {
    if (instance) return instance

    const settings = settingsModel()
    const toaster = errorModel()

    const state = reactive({
        paletteOpen: false,
        shortcutsOpen: false,
        // Bumped by C; TopNav opens QuickAdd on change
        captureRequest: 0,
    })

    const itemSource = shallowRef(null)
    let attached = 0
    // Time of the last G press; 0 when no sequence is pending
    let gPressedAt = 0

    const navigation = computed(() =>
        NAVIGATION.filter(n => n.route !== 'review' || settings.state.reviewEnabled)
    )

    // [{label, run}] for the buttons the current detail page renders enabled
    const itemCommands = computed(() => itemSource.value?.value || [])

    // Call from a detail page's setup with a computed of its item commands
    function registerItemCommands(source) {
        onMounted(() => { itemSource.value = source })
        onBeforeUnmount(() => {
            if (itemSource.value === source) itemSource.value = null
        })
    }

    function isBlocked() {
        return window.matchMedia(MOBILE_QUERY).matches || !!document.querySelector(MODAL_SELECTOR)
    }

    function isTyping(target) {
        return !!target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)
    }

    function onKeydown(e) {
        const key = e.key?.toLowerCase()
        if (!key) return

        if (key === 'k' && (e.metaKey || e.ctrlKey)) {
            gPressedAt = 0
            if (state.paletteOpen) {
                e.preventDefault()
                return
            }
            if (isBlocked()) return
            e.preventDefault()
            state.paletteOpen = true
            return
        }

        // Ctrl/Cmd+Z runs the visible Undo toast; native text undo stays in fields; no redo
        if (key === 'z' && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
            gPressedAt = 0
            const toast = toaster.undoToast()
            if (!toast || toast.undoing || e.repeat || isTyping(e.target) || isBlocked()) return
            e.preventDefault()
            toaster.runUndo()
            return
        }

        if (key === 'escape' && state.shortcutsOpen) {
            state.shortcutsOpen = false
            return
        }

        if (MODIFIER_KEYS.has(key)) return
        const sequence = Date.now() - gPressedAt <= G_TIMEOUT_MS
        gPressedAt = 0
        if (e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target) || isBlocked()) return

        if (sequence) {
            const target = navigation.value.find(n => n.key === key)
            if (!target) return
            e.preventDefault()
            router.push({name: target.route})
        } else if (key === 'g') {
            gPressedAt = Date.now()
        } else if (key === 'c') {
            e.preventDefault()
            state.captureRequest++
        } else if (key === '?') {
            e.preventDefault()
            state.shortcutsOpen = true
        }
    }

    // DashboardLayout attaches on mount — shortcuts live only inside the dashboard
    function attach() {
        if (attached++ === 0) document.addEventListener('keydown', onKeydown)
    }

    function detach() {
        if (--attached > 0) return
        document.removeEventListener('keydown', onKeydown)
        gPressedAt = 0
        state.paletteOpen = false
        state.shortcutsOpen = false
    }

    function closePalette() {
        state.paletteOpen = false
    }

    function closeShortcuts() {
        state.shortcutsOpen = false
    }

    instance = {
        state,
        navigation,
        itemCommands,
        registerItemCommands,
        attach,
        detach,
        closePalette,
        closeShortcuts,
    }
    return instance
}
