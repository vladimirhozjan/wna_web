import { reactive, watch, onBeforeUnmount } from 'vue'

// Reactive visual viewport — follows the on-screen keyboard. Listens only while active() is true.
export function useVisualViewport(active, onChange) {
    const viewport = reactive({ top: 0, height: window.innerHeight })

    function sync() {
        const vv = window.visualViewport
        viewport.height = vv ? vv.height : window.innerHeight
        viewport.top = vv ? vv.offsetTop : 0
        onChange?.()
    }

    function detach() {
        window.visualViewport?.removeEventListener('resize', sync)
        window.visualViewport?.removeEventListener('scroll', sync)
        window.removeEventListener('resize', sync)
    }

    watch(() => !!active(), (on) => {
        if (!on) return detach()
        sync()
        window.visualViewport?.addEventListener('resize', sync)
        window.visualViewport?.addEventListener('scroll', sync)
        window.addEventListener('resize', sync)
    }, { immediate: true })

    onBeforeUnmount(detach)

    return viewport
}
