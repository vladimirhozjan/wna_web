import { reactive } from 'vue'

let instance = null

/**
 * Singleton model for move operations that require additional input.
 * Used for:
 * - Schedule (move to Calendar) - requires date, optional time/duration
 * - Waiting For - requires waiting_for text
 */
export function moveModel() {
    if (instance) return instance

    const state = reactive({
        visible: false,
        type: null, // 'schedule' | 'waiting'
        title: '',
        // Schedule fields
        date: '',
        time: null,
        duration: null,
        // Waiting fields
        waitingFor: '',          // free text (always reflects label of picked value)
        waitingDelegate: null,   // null | {kind:'connection', userId, email, label} | {kind:'text', value}
        // Outcome fields
        outcome: '',
        // Callbacks
        onConfirm: null,
        onCancel: null,
    })

    /**
     * Show schedule input modal (for moving to Calendar)
     * @param {Object} options - Initial values
     * @returns {Promise<{date: string, time?: string, duration?: number} | null>}
     */
    function showSchedule(options = {}) {
        return new Promise((resolve) => {
            state.type = 'schedule'
            state.title = options.title || 'Schedule for when?'
            state.date = options.date || ''
            state.time = options.time || null
            state.duration = options.duration ?? null
            state.visible = true

            state.onConfirm = () => {
                const result = {
                    date: state.date,
                    time: state.time || null,
                    duration: state.time ? (state.duration || 30) : null
                }
                state.visible = false
                resolve(result)
            }

            state.onCancel = () => {
                state.visible = false
                resolve(null)
            }
        })
    }

    /**
     * Show waiting for input modal.
     * Resolves to one of:
     *   { kind: 'connection', userId, email, label }
     *   { kind: 'text', value }
     *   null (cancelled)
     */
    function showWaiting(options = {}) {
        return new Promise((resolve) => {
            state.type = 'waiting'
            state.title = options.title || 'Who/what are you waiting on?'
            const initial = options.waitingFor || ''
            state.waitingFor = initial
            state.waitingDelegate = initial ? { kind: 'text', value: initial } : null
            state.visible = true

            state.onConfirm = () => {
                const result = state.waitingDelegate
                state.visible = false
                if (!result) return resolve(null)
                if (result.kind === 'text' && !result.value.trim()) return resolve(null)
                resolve(result)
            }

            state.onCancel = () => {
                state.visible = false
                resolve(null)
            }
        })
    }

    /**
     * Show outcome input modal (for converting to project)
     * @param {Object} options - Initial values
     * @returns {Promise<string | null>} - The outcome value or null if cancelled
     */
    function showOutcome(options = {}) {
        return new Promise((resolve) => {
            state.type = 'outcome'
            state.title = options.title || 'What does done look like?'
            state.outcome = options.outcome || ''
            state.visible = true

            state.onConfirm = () => {
                const value = state.outcome.trim()
                state.visible = false
                resolve(value || null)
            }

            state.onCancel = () => {
                state.visible = false
                resolve(null)
            }
        })
    }

    function close() {
        if (state.onCancel) state.onCancel()
    }

    instance = { state, showSchedule, showWaiting, showOutcome, close }
    return instance
}
