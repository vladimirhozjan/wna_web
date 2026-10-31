import { reactive, watch, onBeforeUnmount } from 'vue'

// Reactive visual viewport — follows the on-screen keyboard. Listens only while active() is true.
// holdPage: while active, the document under a full-screen surface never scrolls or bounces.
export function useVisualViewport(active, onChange, options = {}) {
    const viewport = reactive({ top: 0, height: window.innerHeight })
    let heldY = 0

    function sync() {
        const vv = window.visualViewport
        viewport.height = vv ? vv.height : window.innerHeight
        viewport.top = vv ? vv.offsetTop : 0
        onChange?.()
    }

    function hold() {
        if (window.scrollY !== heldY) window.scrollTo(0, heldY)
    }

    function detach() {
        window.visualViewport?.removeEventListener('resize', sync)
        window.visualViewport?.removeEventListener('scroll', sync)
        window.removeEventListener('resize', sync)
        if (!options.holdPage) return
        window.removeEventListener('scroll', hold)
        document.documentElement.style.removeProperty('overscroll-behavior-y')
    }

    watch(() => !!active(), (on) => {
        if (!on) return detach()
        sync()
        window.visualViewport?.addEventListener('resize', sync)
        window.visualViewport?.addEventListener('scroll', sync)
        window.addEventListener('resize', sync)
        if (!options.holdPage) return
        heldY = window.scrollY
        document.documentElement.style.overscrollBehaviorY = 'none'
        window.addEventListener('scroll', hold)
    }, { immediate: true })

    onBeforeUnmount(detach)

    return viewport
}

// iOS scrolls the page to reveal a focused input near the bottom; focusing it while shifted off-screen prevents that.
export function focusWithoutReveal(el) {
    el.style.transform = 'translateY(-2000px)'
    el.focus()
    requestAnimationFrame(() => { el.style.transform = '' })
}
