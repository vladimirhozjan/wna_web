import { reactive } from 'vue'

let instance = null

export function upgradeModel() {
    if (instance) return instance

    const state = reactive({
        visible: false,
        message: '',
        limit: null,
    })

    function show({ message, limit }) {
        state.message = message || 'You have reached a limit on your current plan.'
        state.limit = limit ?? null
        state.visible = true
    }

    function close() {
        state.visible = false
        state.message = ''
        state.limit = null
    }

    instance = { state, show, close }
    return instance
}
