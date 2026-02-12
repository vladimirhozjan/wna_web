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
        time: '',
        showTime: false,
        duration: 15,
        // Waiting fields
        waitingFor: '',
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
            state.time = options.time || ''
            state.showTime = !!options.time
            state.duration = options.duration || 15
            state.visible = true

            state.onConfirm = () => {
                const result = {
                    date: state.date,
                    time: state.showTime ? state.time : null,
                    duration: state.showTime ? state.duration : null
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
     * Show waiting for input modal
     * @param {Object} options - Initial values
     * @returns {Promise<string | null>} - The waiting_for value or null if cancelled
     */
    function showWaiting(options = {}) {
        return new Promise((resolve) => {
            state.type = 'waiting'
            state.title = options.title || 'Who/what are you waiting on?'
            state.waitingFor = options.waitingFor || ''
            state.visible = true

            state.onConfirm = () => {
                const value = state.waitingFor.trim()
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

    instance = { state, showSchedule, showWaiting, close }
    return instance
}
