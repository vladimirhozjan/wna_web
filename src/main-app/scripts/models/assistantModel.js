import { reactive, computed, watch, effectScope, onMounted, onBeforeUnmount } from 'vue'
import {
    getAssistant,
    setAssistantModel,
    getAssistantConversation,
    deleteAssistantConversation,
    sendAssistantMessage,
    getAssistantRequest,
    stopAssistantRequest,
    getAssistantMemory,
    saveAssistantMemory,
    clearAssistantMemory,
    startCanvasConvert,
} from '../core/apiClient.js'
import { authModel } from '../core/authModel.js'
import { flagsModel } from '../core/flagsModel.js'
import { offlineModel } from '../core/offlineModel.js'
import { errorModel } from '../core/errorModel.js'
import { statsModel } from './statsModel.js'

// contracts/limits.md §AI assistant
export const ASSISTANT_POLL_MS = 2000
export const ASSISTANT_TEXT_MAX = 4000
export const ASSISTANT_PASTED_MAX = 20000

// Extra credits before a pack checkout, so the return can tell when the new ones have landed
export const CREDITS_BEFORE_CHECKOUT_KEY = 'assistant-credits-before-checkout'

// Unicode code points, as the API counts them
export const charCount = (s) => [...(s || '')].length

const changeListeners = new Set()

// Call from a page's setup with the function its load / pull-to-refresh runs
export function onAssistantChange(fn) {
    onMounted(() => changeListeners.add(fn))
    onBeforeUnmount(() => changeListeners.delete(fn))
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let instance = null

export function assistantModel() {
    if (instance) return instance

    const auth = authModel()
    const flags = flagsModel()
    const toaster = errorModel()
    const { isOffline } = offlineModel()

    const state = reactive({
        account: null,
        accountError: false,
        panelOpen: false,
        conversationLoaded: false,
        conversationLoading: false,
        conversationError: false,
        messages: [],
        requestId: null,
        stopping: false,
        sending: false,
        draft: '',
        // {code, resetsAt, modelName} after a 402 — out_of_credits / not_enough_for_model
        creditCard: null,
        disabled: false,
    })

    // Detached: the first component to call the model must not take its computeds and watchers down on unmount
    const scope = effectScope(true)
    const { enabled, working, hasConversation, selectedModel } = scope.run(() => ({
        enabled: computed(() => auth.isAuthenticated.value && flags.hasFlag('ai_assistant')),
        working: computed(() => !!state.requestId),
        hasConversation: computed(() =>
            state.conversationLoaded ? state.messages.length > 0 : !!state.account?.has_conversation),
        selectedModel: computed(() =>
            state.account?.models?.find(m => m.id === state.account.selected_model_id) || null),
    }))

    let pollTimer = null
    let tempId = 0
    let conversationPromise = null
    // request id → changes_total already announced to the open pages
    const announced = new Map()

    async function loadAccount() {
        try {
            state.account = await getAssistant()
            state.accountError = false
            state.disabled = false
            return state.account
        } catch (err) {
            if (err.code === 'assistant_disabled') onDisabled()
            else state.accountError = true
            throw err
        }
    }

    async function setModel(modelId) {
        state.account = await setAssistantModel(modelId)
        return state.account
    }

    function onDisabled() {
        state.disabled = true
        flags.loadPublicFlags()
    }

    // ── Conversation ──

    function applyConversation(conversation) {
        state.messages = conversation?.messages || []
        state.conversationLoaded = true
        state.conversationError = false
        const last = [...state.messages].reverse().find(m => m.role === 'assistant')
        if (last?.status === 'working' && last.request_id) {
            announced.set(last.request_id, last.changes_total || 0)
            startPoll(last.request_id)
        }
    }

    function loadConversation() {
        if (conversationPromise) return conversationPromise
        state.conversationLoading = true
        conversationPromise = getAssistantConversation()
            .then(data => applyConversation(data.conversation))
            .catch(err => {
                if (err.code === 'assistant_disabled') onDisabled()
                else state.conversationError = true
            })
            .finally(() => {
                state.conversationLoading = false
                conversationPromise = null
            })
        return conversationPromise
    }

    function openPanel() {
        state.panelOpen = true
        if (!state.conversationLoaded) loadConversation()
    }

    function closePanel() {
        state.panelOpen = false
    }

    function upsertMessage(msg) {
        const i = state.messages.findIndex(m => m.id === msg.id)
        if (i >= 0) state.messages.splice(i, 1, msg)
        else state.messages.push(msg)
    }

    // A follow-up answer continues the request: its earlier messages give up the request fields to the newest one
    function settleEarlierMessages(requestId) {
        for (const m of state.messages) {
            if (m.role !== 'assistant' || m.request_id !== requestId) continue
            Object.assign(m, { status: 'done', choices: null, changes: [], changes_total: 0, credits_charged: 0 })
        }
    }

    async function send(text, pastedText = '') {
        text = text.trim()
        if (!text) return
        openPanel()
        if (charCount(text) > ASSISTANT_TEXT_MAX || charCount(pastedText) > ASSISTANT_PASTED_MAX) {
            state.draft = pastedText ? `${text}\n${pastedText}` : text
            return
        }
        if (state.conversationLoading) await conversationPromise

        state.sending = true
        state.creditCard = null
        const pending = { id: `pending-${++tempId}`, role: 'user', text: pastedText ? `${text}\n${pastedText}` : text }
        state.messages.push(pending)
        try {
            const data = await sendAssistantMessage({ text, pastedText })
            state.messages = state.messages.filter(m => m.id !== pending.id)
            const requestId = data.request_id
            settleEarlierMessages(requestId)
            upsertMessage(data.user_message)
            upsertMessage(data.assistant_message)
            if (!announced.has(requestId)) announced.set(requestId, 0)
            if (state.account) state.account.has_conversation = true
            state.disabled = false
            startPoll(requestId)
        } catch (err) {
            state.messages = state.messages.filter(m => m.id !== pending.id)
            state.draft = pending.text
            onSendError(err)
        } finally {
            state.sending = false
        }
    }

    async function onSendError(err) {
        if (err.code === 'out_of_credits' || err.code === 'not_enough_for_model') {
            state.creditCard = { code: err.code, resetsAt: err.data?.monthly_resets_at, modelName: err.data?.model_name }
            loadAccount().catch(() => {})
        } else if (err.code === 'assistant_busy') {
            // Another tab started a request — show it and wait for it
            const account = await loadAccount().catch(() => null)
            if (account?.working_request_id) await loadConversation()
        } else if (err.code === 'assistant_disabled') {
            onDisabled()
        } else if (err.status === 429) {
            toaster.push('Too many requests. Wait a moment and try again.', 'error', { keepOffline: true })
        } else if (err.status === null) {
            toaster.push('Couldn\'t reach the AI assistant. Check your connection and try again.', 'error', { keepOffline: true })
        } else if (err.code !== 'text_too_long') {
            toaster.push(err.message || 'Couldn\'t reach the AI assistant. Check your connection and try again.', 'error', { keepOffline: true })
        }
    }

    // ── Polling (runs whether the panel is open or not) ──

    function startPoll(id) {
        state.requestId = id
        state.stopping = false
        clearTimeout(pollTimer)
        pollTimer = setTimeout(pollOnce, ASSISTANT_POLL_MS)
    }

    function endPoll() {
        clearTimeout(pollTimer)
        pollTimer = null
        state.requestId = null
        state.stopping = false
    }

    async function pollOnce() {
        const id = state.requestId
        if (!id) return
        let data
        try {
            data = await getAssistantRequest(id)
        } catch (err) {
            if (id !== state.requestId) return
            if (err.status === 404) return endPoll()
            if (err.code === 'assistant_disabled') {
                onDisabled()
                return endPoll()
            }
            pollTimer = setTimeout(pollOnce, ASSISTANT_POLL_MS)
            return
        }
        if (id !== state.requestId) return
        if (data.message) upsertMessage(data.message)
        if (data.status === 'working') {
            pollTimer = setTimeout(pollOnce, ASSISTANT_POLL_MS)
            return
        }
        endPoll()
        onRequestEnded(id, data)
    }

    function onRequestEnded(id, data) {
        const msg = data.message
        const total = msg?.changes_total || 0
        if (total > (announced.get(id) || 0)) {
            announced.set(id, total)
            changeListeners.forEach(fn => fn())
            statsModel().refreshStats()
        }
        if (!state.panelOpen && data.status === 'done') {
            toaster.success(msg?.summary ? `AI assistant is done: ${msg.summary}` : 'AI assistant is done')
        }
        loadAccount().catch(() => {})
    }

    async function stop() {
        const id = state.requestId
        if (!id || state.stopping) return
        state.stopping = true
        try {
            await stopAssistantRequest(id)
        } catch (err) {
            // Already ended — the next poll brings the result
            if (err.code !== 'request_not_running') {
                state.stopping = false
                toaster.push('Couldn\'t reach the AI assistant. Check your connection and try again.', 'error', { keepOffline: true })
            }
        }
    }

    async function newConversation() {
        await deleteAssistantConversation()
        endPoll()
        state.messages = []
        state.conversationLoaded = true
        state.conversationError = false
        state.creditCard = null
        if (state.account) state.account.has_conversation = false
        loadAccount().catch(() => {})
    }

    // ── Canvas convert: one request, polled by its own modal ──

    async function startCanvas(projectId) {
        const data = await startCanvasConvert(projectId)
        return data.request_id
    }

    // Resolves with the request once it stops working; isCancelled() ends the wait quietly (null)
    async function waitForRequest(id, isCancelled = () => false) {
        for (;;) {
            await sleep(ASSISTANT_POLL_MS)
            if (isCancelled()) return null
            let data
            try {
                data = await getAssistantRequest(id)
            } catch (err) {
                if (err.status !== null) throw err
                continue
            }
            if (isCancelled()) return null
            if (data.status !== 'working') {
                loadAccount().catch(() => {})
                return data
            }
        }
    }

    // ── Memory ──

    const getMemory = () => getAssistantMemory()
    const saveMemory = (text) => saveAssistantMemory(text)
    const clearMemory = () => clearAssistantMemory()

    function reset() {
        endPoll()
        announced.clear()
        Object.assign(state, {
            account: null,
            accountError: false,
            panelOpen: false,
            conversationLoaded: false,
            conversationLoading: false,
            conversationError: false,
            messages: [],
            sending: false,
            draft: '',
            creditCard: null,
            disabled: false,
        })
    }

    // A reloaded page picks up a request that is still running
    scope.run(() => {
        watch(enabled, async (on) => {
            if (!on) return reset()
            const account = await loadAccount().catch(() => null)
            if (account?.working_request_id) loadConversation()
        }, { immediate: true })
    })

    instance = {
        state,
        enabled,
        isOffline,
        working,
        hasConversation,
        selectedModel,
        loadAccount,
        setModel,
        loadConversation,
        openPanel,
        closePanel,
        send,
        stop,
        newConversation,
        startCanvas,
        waitForRequest,
        getMemory,
        saveMemory,
        clearMemory,
    }
    return instance
}
