import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'

// One-line button row: shows as many keys as fit, the rest go to a trailing ⋯.
// Only a trailing run of `overflowKeys` (the ones the ⋯ menu offers) may be hidden.
export function useOverflowFit(rowRef, keysRef, overflowKeys) {
    const fitCount = ref(Infinity)
    let widths = []
    let moreWidth = 0
    let observer = null

    const pinned = computed(() => {
        const keys = keysRef.value
        let i = keys.length
        while (i > 0 && overflowKeys.includes(keys[i - 1])) i--
        return i
    })

    const visibleCount = computed(() => Math.max(pinned.value, fitCount.value))

    function fit() {
        const row = rowRef.value
        if (!row || !widths.length) return
        const style = getComputedStyle(row)
        const gap = parseFloat(style.columnGap) || 0
        const avail = row.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
        const span = n => widths.slice(0, n).reduce((s, w) => s + w + gap, 0) - gap
        if (span(widths.length) <= avail) {
            fitCount.value = widths.length
            return
        }
        let n = widths.length - 1
        while (n > 0 && span(n) + gap + moreWidth > avail) n--
        fitCount.value = n
    }

    async function measure() {
        fitCount.value = Infinity
        await nextTick()
        const row = rowRef.value
        if (!row) return
        widths = [...row.children].slice(0, keysRef.value.length).map(el => el.getBoundingClientRect().width)
        fit()
        await nextTick()
        const more = rowRef.value?.children[visibleCount.value]
        if (more && more.getBoundingClientRect().width !== moreWidth) {
            moreWidth = more.getBoundingClientRect().width
            fit()
        }
    }

    watch([rowRef, () => keysRef.value.join()], ([row]) => {
        observer?.disconnect()
        observer = null
        if (!row) return
        // Fires once on observe too; button widths change across breakpoints, so every resize measures again
        observer = new ResizeObserver(() => measure())
        observer.observe(row)
    }, { immediate: true })

    document.fonts?.ready.then(measure)

    onBeforeUnmount(() => observer?.disconnect())

    return { visibleCount }
}
