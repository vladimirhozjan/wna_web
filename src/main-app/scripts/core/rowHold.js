import { ref, nextTick } from 'vue'
import { liveClient } from './liveClient.js'
import { MOTION_MS } from './liveMotion.js'

// A project's active action leaving Next / Today keeps its row until the re-read shows what takes its slot
// (the promoted backlog action, handed over in place) or that nothing does (the row closes)

// End of the content's exit: complete = the first 60 % of item-complete-out (350 ms delay + 240 ms)
export const HOLD_LEAVE_MS = { complete: 590, leave: MOTION_MS }
// The row's height closing when nothing takes the slot: complete = the last 40 % of item-complete-out
export const HOLD_CLOSE_MS = { complete: 160, leave: MOTION_MS }

// Shared projects have no promotion; standalone and backlog rows leave as any other row
export function isHoldable(row) {
    return !!row?.project?.id && row.backlog_position === 0 && row.project_shared === false
}

// heldId → id of the new row of the same project now at its index; a held row with no entry closes
export function matchHeld(before, after, heldIds) {
    const held = new Set(heldIds)
    const beforeIds = new Set(before.map(r => r.id))
    const afterIds = new Set(after.map(r => r.id))
    const occupants = new Map()
    let gone = 0
    before.forEach((row, i) => {
        if (afterIds.has(row.id)) return
        const slot = after[i - gone]
        if (held.has(row.id) && slot && !beforeIds.has(slot.id) && slot.project?.id === row.project?.id) {
            occupants.set(row.id, slot.id)
        } else {
            gone++
        }
    })
    return occupants
}

export function createRowHold({ items, reread }) {
    const held = ref([])
    let running = null
    let trailing = null

    function isHeld(id) {
        return held.value.some(h => h.id === id)
    }

    function hold(id, kind) {
        if (isHeld(id)) return
        held.value = [...held.value, { id, kind }]
        liveClient.hold()
    }

    function unhold(id) {
        if (!isHeld(id)) return
        held.value = held.value.filter(h => h.id !== id)
        liveClient.release()
    }

    // Resolves true when the re-read applied or went stale, false when it failed
    function start() {
        const run = Promise.resolve().then(reread).then(() => true, () => false)
        running = run
        run.then(() => {
            running = null
            if (!trailing) return
            const next = trailing
            trailing = null
            next.go()
        })
        return run
    }

    // At most one re-read in flight; calls made meanwhile share one that starts when it ends
    function nextReread() {
        if (!running) return start()
        if (!trailing) {
            let go
            const promise = new Promise(resolve => { go = () => resolve(start()) })
            trailing = { promise, go }
        }
        return trailing.promise
    }

    // ids: the rows whose op has landed (default every held row); rows still waiting for their op stay held
    async function settle(ids = held.value.map(h => h.id)) {
        const waiting = new Set([].concat(ids))
        const ok = await nextReread()
        if (!ok) items.value = items.value.filter(i => !(waiting.has(i.id) && isHeld(i.id)))
        await nextTick()
        for (const { id } of [...held.value]) {
            if (waiting.has(id) || !items.value.some(i => i.id === id)) unhold(id)
        }
    }

    return { held, hold, unhold, settle }
}
