import { reactive } from 'vue'

let instance = null

export function upgradeModel() {
    if (instance) return instance

    const state = reactive({
        visible: false,
        message: '',
        limit: null,
        kind: null,
    })

    function show({ message, limit, kind }) {
        state.message = message || 'You have reached a limit on your current plan.'
        state.limit = limit ?? null
        state.kind = kind ?? null
        state.visible = true
    }

    function close() {
        state.visible = false
        state.message = ''
        state.limit = null
        state.kind = null
    }

    instance = { state, show, close }
    return instance
}
