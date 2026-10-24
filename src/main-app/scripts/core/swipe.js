import { watch, onBeforeUnmount } from 'vue'

export const LONG_PRESS_MS = 400
export const SNAP_MS = 150

const LOCK_PX = 10
const MOBILE_QUERY = '(max-width: 768px)'

export function isMobileViewport() {
    return window.matchMedia(MOBILE_QUERY).matches
}

// onMove(delta) returns true while it consumes the gesture; a hold past holdLimit is left to long-press drag
export function useSwipe(elRef, { axis = 'x', holdLimit = LONG_PRESS_MS, canStart = () => true, onMove, onEnd }) {
    let attached = null
    let startX = 0
    let startY = 0
    let startTime = 0
    let tracking = false
    let locked = false
    let consumed = false

    function onTouchStart(e) {
        tracking = e.touches.length === 1 && isMobileViewport() && canStart()
        if (!tracking) return
        locked = false
        consumed = false
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
        startTime = Date.now()
    }

    function onTouchMove(e) {
        if (!tracking) return
        const dx = e.touches[0].clientX - startX
        const dy = e.touches[0].clientY - startY
        if (!locked) {
            if (Math.abs(dx) < LOCK_PX && Math.abs(dy) < LOCK_PX) return
            const lockedAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
            if (lockedAxis !== axis || Date.now() - startTime > holdLimit) {
                tracking = false
                return
            }
            locked = true
        }
        if (onMove(axis === 'x' ? dx : dy)) {
            consumed = true
            e.preventDefault()
        }
    }

    function onTouchEnd() {
        if (!tracking) return
        tracking = false
        if (!locked) return
        if (consumed) {
            const el = attached
            el.addEventListener('click', swallowClick, { capture: true, once: true })
            setTimeout(() => el.removeEventListener('click', swallowClick, { capture: true }), LONG_PRESS_MS)
        }
        onEnd()
    }

    function onTouchCancel() {
        if (!tracking) return
        tracking = false
        if (locked) onEnd()
    }

    function swallowClick(e) {
        e.stopPropagation()
        e.preventDefault()
    }

    function detach() {
        if (!attached) return
        attached.removeEventListener('touchstart', onTouchStart)
        attached.removeEventListener('touchmove', onTouchMove)
        attached.removeEventListener('touchend', onTouchEnd)
        attached.removeEventListener('touchcancel', onTouchCancel)
        attached = null
    }

    watch(elRef, (el) => {
        detach()
        if (!el) return
        el.addEventListener('touchstart', onTouchStart, { passive: true })
        el.addEventListener('touchmove', onTouchMove, { passive: false })
        el.addEventListener('touchend', onTouchEnd)
        el.addEventListener('touchcancel', onTouchCancel)
        attached = el
    }, { immediate: true })

    onBeforeUnmount(detach)
}
