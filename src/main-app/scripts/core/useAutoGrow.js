import { watch, nextTick, onBeforeUnmount } from 'vue'

const supportsFieldSizing =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('field-sizing', 'content')

export function useAutoGrow(elRef) {
    if (supportsFieldSizing) return

    let attached = null

    function resize() {
        const el = elRef.value
        if (!el) return
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
    }

    watch(elRef, (el) => {
        if (attached) {
            attached.removeEventListener('input', resize)
            attached = null
        }
        if (el) {
            el.addEventListener('input', resize)
            attached = el
            nextTick(resize)
        }
    }, { immediate: true })

    onBeforeUnmount(() => {
        if (attached) attached.removeEventListener('input', resize)
    })
}
