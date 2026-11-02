import { ref, watch, onBeforeUnmount } from 'vue'

export function useAutoHideScrollbar(elRef) {
    const scrolling = ref(false)
    let attached = null
    let timer = null

    function onScroll() {
        scrolling.value = true
        clearTimeout(timer)
        timer = setTimeout(() => { scrolling.value = false }, 1000)
    }

    watch(elRef, (value) => {
        const el = value?.$el ?? value
        if (el === attached) return
        if (attached) attached.removeEventListener('scroll', onScroll)
        attached = el instanceof HTMLElement ? el : null
        if (attached) attached.addEventListener('scroll', onScroll, { passive: true })
    }, { immediate: true })

    onBeforeUnmount(() => {
        clearTimeout(timer)
        if (attached) attached.removeEventListener('scroll', onScroll)
    })

    return { scrolling }
}
