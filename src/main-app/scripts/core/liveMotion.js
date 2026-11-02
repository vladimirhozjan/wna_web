import { watch, nextTick, onBeforeUnmount } from 'vue'
import { liveClient } from './liveClient.js'

// specs/features/wna-features.md §25.10 — motion for live changes not made in this tab
export const MOTION_MS = 250
export const HIGHLIGHT_MS = 1000
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'
const SLIDE_PX = 12

// The part of the screen the root is seen through: the window clipped by every clipping ancestor
function viewportOf(root) {
    const view = { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth }
    for (let p = root.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p)
        if (s.overflowX === 'visible' && s.overflowY === 'visible') continue
        const r = p.getBoundingClientRect()
        view.top = Math.max(view.top, r.top)
        view.left = Math.max(view.left, r.left)
        view.bottom = Math.min(view.bottom, r.bottom)
        view.right = Math.min(view.right, r.right)
    }
    return view
}

function inView(r, view) {
    return r.width + r.height > 0 && r.bottom > view.top && r.top < view.bottom && r.right > view.left && r.left < view.right
}

function paddingOf(el) {
    const s = getComputedStyle(el)
    return { paddingTop: s.paddingTop, paddingBottom: s.paddingBottom }
}

// The row's own text; parts marked data-motion-skip (counts of what is inside it) are not its change
function textOf(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
        acceptNode: n => (n.parentElement.closest('[data-motion-skip]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    })
    let text = ''
    while (walker.nextNode()) text += walker.currentNode.nodeValue
    return text
}

function highlightColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-bg-accent-light').trim()
}

// One running animation per call; `cancel()` drops it at once (a new run, unmount), its cleanup still runs
export function motionSet() {
    const running = new Set()

    function play(el, kind, keyframes, duration, cleanup, then) {
        el.setAttribute('data-motion', kind)
        const anim = el.animate(keyframes, { duration, easing: EASING })
        const entry = {
            anim,
            end() {
                if (!running.delete(entry)) return
                if (el.getAttribute('data-motion') === kind) el.removeAttribute('data-motion')
                cleanup?.()
            },
        }
        running.add(entry)
        anim.onfinish = () => {
            entry.end()
            then?.()
        }
        return anim
    }

    // Background --color-bg-accent-light fading back to the element's own
    function highlight(el) {
        const own = getComputedStyle(el).backgroundColor
        play(el, 'highlight', [{ backgroundColor: highlightColor() }, { backgroundColor: own }], HIGHLIGHT_MS)
    }

    // Closed = no height and no vertical padding; heights are border-box rects
    function enterRow(el, height, pad) {
        Object.assign(el.style, { overflow: 'hidden', boxSizing: 'border-box' })
        play(el, 'enter', [
            { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0, translate: `-${SLIDE_PX}px 0` },
            { height: `${height}px`, ...pad, opacity: 1, translate: '0 0' },
        ], MOTION_MS, () => Object.assign(el.style, { overflow: '', boxSizing: '' }), () => highlight(el))
    }

    function enterTile(el, from = 0.96) {
        play(el, 'enter', [{ opacity: 0, scale: String(from) }, { opacity: 1, scale: '1' }], MOTION_MS, null, () => highlight(el))
    }

    // mark: the element itself changed (not just pushed aside by others) — highlighted after the glide
    function move(el, dx, dy, mark = true) {
        play(el, 'move', [{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], MOTION_MS, null, mark ? () => highlight(el) : null)
    }

    // A detached element shown again where it was: fades out, then its height closes (rows below glide up)
    function leaveRow(ghost, height, pad) {
        Object.assign(ghost.style, { overflow: 'hidden', boxSizing: 'border-box' })
        play(ghost, 'leave', [
            { opacity: 1, height: `${height}px`, ...pad },
            { opacity: 0, height: `${height}px`, ...pad, offset: 0.4 },
            { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px' },
        ], MOTION_MS, () => ghost.remove())
    }

    // A table row cannot close its height: it fades, then the rows below glide up into its place
    function leaveTableRow(ghost) {
        const rows = [...ghost.parentNode.children].filter(r => r !== ghost)
        let tops = []
        play(ghost, 'leave', [{ opacity: 1 }, { opacity: 0 }], MOTION_MS / 2, () => {
            tops = rows.map(r => r.getBoundingClientRect().top)
            ghost.remove()
        }, () => rows.forEach((r, i) => {
            const dy = tops[i] - r.getBoundingClientRect().top
            if (r.isConnected && Math.abs(dy) > 1) play(r, 'move', [{ translate: `0 ${dy}px` }, { translate: '0 0' }], MOTION_MS / 2)
        }))
    }

    function fadeOut(ghost) {
        play(ghost, 'leave', [{ opacity: 1 }, { opacity: 0 }], MOTION_MS, () => ghost.remove())
    }

    function cancel() {
        for (const entry of [...running]) {
            entry.anim.cancel()
            entry.end()
        }
    }

    return { play, highlight, enterRow, enterTile, move, leaveRow, leaveTableRow, fadeOut, cancel }
}

// Absolutely placed over its old rect inside root (tiles, or a row whose list is gone)
function placeOver(ghost, rect, root) {
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative'
    const box = root.getBoundingClientRect()
    Object.assign(ghost.style, {
        position: 'absolute',
        left: `${rect.left - box.left - root.clientLeft + root.scrollLeft}px`,
        top: `${rect.top - box.top - root.clientTop + root.scrollTop}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        boxSizing: 'border-box',
    })
    root.appendChild(ghost)
}

/**
 * Animates what a foreign live re-read changed among root's `[idAttr]` elements: new → enter, gone → leave (its
 * detached element fades out where it was), moved → glide (FLIP), changed in place (id in the packet, or its text
 * changed) → highlight.
 * Only elements in the viewport move; scroll position never changes. `skip()` = ids that get no motion (the
 * completion exit, a queued capture swapped for its server row). `tiles`: enter by scale, leave without closing the gap. Returns `force()` — the next change of
 * `source` animates even outside a foreign dispatch (a list that waited for its empty state to fade out).
 */
export function useLiveMotion(rootRef, source, { idAttr = 'data-row-id', tiles = false, skip = () => new Set() } = {}) {
    const motion = motionSet()
    let forced = false

    watch(source, () => {
        const root = rootRef.value
        if (!root || !(liveClient.motion.active || forced)) return
        forced = false
        motion.cancel()
        const view = viewportOf(root)
        const before = new Map()
        const known = new Set()
        for (const el of root.querySelectorAll(`[${idAttr}]`)) {
            const id = el.getAttribute(idAttr)
            known.add(id)
            const rect = el.getBoundingClientRect()
            if (inView(rect, view)) {
                before.set(id, { el, rect, text: textOf(el), parent: el.parentNode, next: el.nextElementSibling })
            }
        }
        const skipped = new Set([...skip()].map(String))
        const changed = new Set([...liveClient.motion.ids].map(String))
        nextTick(() => {
            if (!root.isConnected) return
            // Measured again: a clipping card grows with the list, so a row added at its end is inside the new view
            const viewAfter = viewportOf(root)
            const after = new Map()
            for (const el of root.querySelectorAll(`[${idAttr}]`)) after.set(el.getAttribute(idAttr), el)

            // Rows that left come back as ghosts in their old place (last first, so each finds the one after it); a row
            // drawn anew elsewhere (another day column) glides there instead
            const ghosts = new Map()
            const leaving = [...before].filter(([id, b]) => !b.el.isConnected && !after.has(id) && !skipped.has(id)).map(([, b]) => b)
            for (const b of leaving.reverse()) {
                const ghost = b.el
                ghost.removeAttribute(idAttr)
                ghost.setAttribute('aria-hidden', 'true')
                ghost.style.pointerEvents = 'none'
                const inFlow = !tiles && b.parent.isConnected
                if (inFlow) {
                    const next = b.next?.parentNode === b.parent ? b.next : ghosts.get(b.next)?.ghost
                    b.parent.insertBefore(ghost, next?.parentNode === b.parent ? next : null)
                    Object.assign(ghost.style, { height: `${b.rect.height}px`, boxSizing: 'border-box' })
                } else {
                    placeOver(ghost, b.rect, root)
                }
                ghosts.set(b.el, { ghost, inFlow, height: b.rect.height, pad: inFlow && paddingOf(ghost) })
            }

            // New rows start closed, so the rest is measured where it starts out
            const entering = []
            for (const [id, el] of after) {
                // A changed row coming into view from off screen enters like a new one
                if (skipped.has(id) || (known.has(id) && (before.has(id) || !changed.has(id)))) continue
                const rect = el.getBoundingClientRect()
                if (!inView(rect, viewAfter)) continue
                entering.push({ el, height: rect.height, pad: paddingOf(el) })
                if (!tiles) Object.assign(el.style, { height: '0px', paddingTop: '0px', paddingBottom: '0px', boxSizing: 'border-box' })
            }
            const moves = []
            for (const [id, el] of after) {
                const b = before.get(id)
                if (!b || (b.el !== el && b.el.isConnected)) continue
                const rect = el.getBoundingClientRect()
                const dx = b.rect.left - rect.left
                const dy = b.rect.top - rect.top
                const mark = changed.has(id) || textOf(el) !== b.text
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moves.push({ el, dx, dy, mark })
                else if (mark) motion.highlight(el)
            }

            for (const { ghost, inFlow, height, pad } of ghosts.values()) {
                if (!inFlow) motion.fadeOut(ghost)
                else if (ghost.tagName === 'TR') motion.leaveTableRow(ghost)
                else motion.leaveRow(ghost, height, pad)
            }
            for (const { el, height, pad } of entering) {
                if (tiles) motion.enterTile(el)
                else motion.enterRow(el, height, pad)
                Object.assign(el.style, { height: '', paddingTop: '', paddingBottom: '' })
            }
            for (const { el, dx, dy, mark } of moves) motion.move(el, dx, dy, mark)
        })
    }, { flush: 'pre' })

    onBeforeUnmount(motion.cancel)

    return {
        force() {
            forced = true
        },
    }
}
