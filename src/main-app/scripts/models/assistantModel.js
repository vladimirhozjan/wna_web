import { reactive, computed, watch, effectScope } from 'vue'
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
import { liveClient } from '../core/liveClient.js'

// contracts/limits.md §AI assistant
export const ASSISTANT_TEXT_MAX = 4000
export const ASSISTANT_PASTED_MAX = 20000

// Extra credits before a pack checkout, so the return can tell when the new ones have landed
export const CREDITS_BEFORE_CHECKOUT_KEY = 'assistant-credits-before-checkout'

// Unicode code points, as the API counts them
export const charCount = (s) => [...(s || '')].length

// A step's end and the next step's start arrive a few ms apart: packets within this window give one request read
const READ_DEBOUNCE_MS = 100

// A packet names this request, or anything may have changed (null: reconnect / resync); id null = conversation deleted
const touchesRequest = (changes, id) =>
    !changes || changes.some(c => c.entity === 'ai_request' && (c.id === null || String(c.id) === String(id)))

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

    let tempId = 0
    let conversationPromise = null
    let reading = false
    let readAgain = false
    let readTimer = null

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
        if (last?.status === 'working' && last.request_id) track(last.request_id)
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
            if (state.account) state.account.has_conversation = true
            state.disabled = false
            track(requestId)
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

    // ── The working request (whether the panel is open or not), re-read on its live packets ──

    function track(id) {
        state.requestId = id
        state.stopping = false
    }

    function untrack() {
        state.requestId = null
        state.stopping = false
    }

    async function readRequest() {
        const id = state.requestId
        if (!id) return
        if (reading) {
            readAgain = true
            return
        }
        reading = true
        try {
            const data = await getAssistantRequest(id)
            if (id !== state.requestId) return
            if (data.message) upsertMessage(data.message)
            if (data.status !== 'working') {
                untrack()
                onRequestEnded(data)
            }
        } catch (err) {
            if (id !== state.requestId) return
            if (err.status === 404) untrack()
            else if (err.code === 'assistant_disabled') {
                onDisabled()
                untrack()
            }
        } finally {
            reading = false
            if (readAgain) {
                readAgain = false
                readRequest()
            }
        }
    }

    liveClient.subscribe(changes => {
        if (!state.requestId || !touchesRequest(changes, state.requestId)) return
        clearTimeout(readTimer)
        readTimer = setTimeout(readRequest, READ_DEBOUNCE_MS)
    })

    function onRequestEnded(data) {
        const msg = data.message
        if (!state.panelOpen && data.status === 'done') {
            toaster.success(msg?.summary ? `AI assistant is done: ${msg.summary}` : 'AI assistant is done')
        }
        if (!state.panelOpen && data.status === 'error') {
            toaster.push('The AI assistant couldn\'t finish your request. Open the assistant to see why.', 'error')
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
            // Already ended — its live packet brings the result
            if (err.code !== 'request_not_running') {
                state.stopping = false
                toaster.push('Couldn\'t reach the AI assistant. Check your connection and try again.', 'error', { keepOffline: true })
            }
        }
    }

    async function newConversation() {
        await deleteAssistantConversation()
        untrack()
        state.messages = []
        state.conversationLoaded = true
        state.conversationError = false
        state.creditCard = null
        if (state.account) state.account.has_conversation = false
        loadAccount().catch(() => {})
    }

    // ── Canvas convert: one request, awaited by its own modal ──

    async function startCanvas(projectId) {
        const data = await startCanvasConvert(projectId)
        return data.request_id
    }

    // Resolves with the request once it stops working, re-read on its live packets; isCancelled() ends the wait quietly (null)
    function waitForRequest(id, isCancelled = () => false) {
        return new Promise((resolve, reject) => {
            let busy = false
            let again = false
            const off = liveClient.subscribe(changes => {
                if (isCancelled()) finish(null)
                else if (touchesRequest(changes, id)) read()
            })
            function finish(data) {
                off()
                resolve(data)
            }
            async function read() {
                if (busy) {
                    again = true
                    return
                }
                busy = true
                try {
                    const data = await getAssistantRequest(id)
                    if (isCancelled()) return finish(null)
                    if (data.status !== 'working') {
                        loadAccount().catch(() => {})
                        return finish(data)
                    }
                } catch (err) {
                    // Offline: the reconnect re-read tries again
                    if (err.status !== null) {
                        off()
                        return reject(err)
                    }
                } finally {
                    busy = false
                }
                if (again) {
                    again = false
                    read()
                }
            }
            read()
        })
    }

    // ── Memory ──

    const getMemory = () => getAssistantMemory()
    const saveMemory = (text) => saveAssistantMemory(text)
    const clearMemory = () => clearAssistantMemory()

    function reset() {
        untrack()
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
