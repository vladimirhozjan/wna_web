import { reactive } from 'vue'

let instance = null

export function confirmModel() {
    if (instance) return instance

    const state = reactive({
        visible: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
    })

    function show({ title = 'Confirm', message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
        return new Promise((resolve) => {
            state.title = title
            state.message = message
            state.confirmText = confirmText
            state.cancelText = cancelText
            state.visible = true

            state.onConfirm = () => {
                state.visible = false
                resolve(true)
            }

            state.onCancel = () => {
                state.visible = false
                resolve(false)
            }
        })
    }

    function close() {
        state.visible = false
        if (state.onCancel) state.onCancel()
    }

    instance = { state, show, close }
    return instance
}