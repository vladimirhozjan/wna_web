import { ref, computed } from 'vue'
import apiClient from '../core/apiClient.js'
import { authModel } from '../core/authModel.js'
import { upgradeModel } from '../core/upgradeModel.js'
import { errorModel } from '../core/errorModel.js'
import { statsModel } from './statsModel.js'

// Caps — home: contracts/limits.md §Subscription tier limits (the server enforces only the technical cap)
const NODE_LIMITS = { free: 50, pro: 1000, team: 1000 }
export const NODE_TEXT_LIMIT = 500

const FORMAT = 1
export const ROOT_ID = 'root'
const SAVE_DEBOUNCE_MS = 1000
const RETRY_MS = [2000, 4000, 8000, 16000, 30000]
const KEEPALIVE_MAX_BYTES = 64 * 1024
const UNDO_LIMIT = 100

// New-idea placement (px): offsets are measured between the ideas' inner edges (root: its centre)
const ROOT_CHILD_DX = 200
const CHILD_DX = 180
export const CHILD_GAP = 40
const ROW_PX = 48
const LINE_PX = 22
const IDEA_MAX_WIDTH = 240
const CHAR_PX = 8

let instance = null

export function canvasModel() {
    if (instance) return instance

    const auth = authModel()
    const toaster = errorModel()

    const projectId = ref(null)
    const project = ref(null)
    const nodes = ref([])
    const revision = ref(0)
    const loading = ref(false)
    const loadError = ref(false)
    const notFound = ref(false)
    // idle | saving | saved | error | too_large
    const saveStatus = ref('idle')
    const conflict = ref(false)
    const undoStack = ref([])
    const redoStack = ref([])
    // Bumped by every change that ends an open canvas undo toast (edits, reloads, conversion)
    const commitSeq = ref(0)

    let sessionId = 0
    let dirty = false
    let inFlight = null
    let keepaliveNext = false
    let saveTimer = null
    let retryTimer = null
    let retryCount = 0

    const isOwner = computed(() => !!project.value && (!project.value.shared || project.value.my_role === 'owner'))
    const canEdit = computed(() => isOwner.value && project.value?.state === 'ACTIVE')
    const tier = computed(() => auth.currentUser.value?.subscription_tier || 'free')
    const nodeLimit = computed(() => NODE_LIMITS[tier.value] ?? NODE_LIMITS.free)
    const projectTitle = computed(() => project.value?.title || '')
    const canUndo = computed(() => canEdit.value && undoStack.value.length > 0)
    const canRedo = computed(() => canEdit.value && redoStack.value.length > 0)
    const unsaved = computed(() => saveStatus.value === 'error' || saveStatus.value === 'too_large')

    const index = computed(() => {
        const byId = new Map()
        const children = new Map()
        for (const n of nodes.value) {
            byId.set(n.id, n)
            if (n.parent_id == null) continue
            if (!children.has(n.parent_id)) children.set(n.parent_id, [])
            children.get(n.parent_id).push(n)
        }
        return { byId, children }
    })

    // ── Tree helpers ──

    function getNode(id) {
        return index.value.byId.get(id) || null
    }

    function childrenOf(id) {
        return index.value.children.get(id) || []
    }

    function descendantIds(id) {
        const out = []
        const stack = [...childrenOf(id)]
        while (stack.length) {
            const n = stack.pop()
            out.push(n.id)
            stack.push(...childrenOf(n.id))
        }
        return out
    }

    function descendantCount(id) {
        return descendantIds(id).length
    }

    function isInBranch(id, branchRootId) {
        let n = getNode(id)
        while (n) {
            if (n.id === branchRootId) return true
            n = getNode(n.parent_id)
        }
        return false
    }

    // Ancestors from the root down to the node itself
    function pathTo(id) {
        const out = []
        let n = getNode(id)
        while (n) {
            out.unshift(n)
            n = getNode(n.parent_id)
        }
        return out
    }

    function depthOf(id) {
        return pathTo(id).length - 1
    }

    function absoluteX(id) {
        let x = 0
        let n = getNode(id)
        while (n && n.parent_id != null) {
            x += n.dx
            n = getNode(n.parent_id)
        }
        return x
    }

    // -1 left of the root, 1 right, 0 the root
    function sideOf(id) {
        const n = getNode(id)
        if (!n || n.parent_id == null) return 0
        return absoluteX(id) < 0 ? -1 : 1
    }

    function displayText(node) {
        if (!node) return ''
        if (node.parent_id == null) return projectTitle.value
        return node.text.trim() || 'Untitled idea'
    }

    // Depth-first, siblings in array order — the conversion and Move to list order
    function treeOrder() {
        const out = []
        const root = nodes.value.find(n => n.parent_id == null)
        if (!root) return out
        const walk = (n) => {
            out.push(n)
            for (const c of childrenOf(n.id)) walk(c)
        }
        walk(root)
        return out
    }

    const convertCandidates = computed(() =>
        treeOrder().filter(n => n.parent_id != null && !n.converted && n.text.trim() && childrenOf(n.id).length === 0)
    )

    // ── Load ──

    function newRoot() {
        return { id: ROOT_ID, parent_id: null, text: '', dx: 0, dy: 0, folded: false, converted: false }
    }

    function applyCanvas(data) {
        const list = Array.isArray(data?.nodes) ? data.nodes : []
        revision.value = data?.revision ?? 0
        nodes.value = list.some(n => n.parent_id == null) ? list : [newRoot()]
        undoStack.value = []
        redoStack.value = []
        commitSeq.value++
        dirty = false
        retryCount = 0
        clearTimers()
        saveStatus.value = 'idle'
    }

    async function load(id) {
        const session = ++sessionId
        clearTimers()
        projectId.value = id
        project.value = null
        nodes.value = []
        loading.value = true
        loadError.value = false
        notFound.value = false
        conflict.value = false
        saveStatus.value = 'idle'
        dirty = false
        try {
            const [p, c] = await Promise.all([apiClient.getProject(id), apiClient.getProjectCanvas(id)])
            if (session !== sessionId) return
            project.value = p
            applyCanvas(c)
        } catch (err) {
            if (session !== sessionId) return
            if (err?.status === 404) notFound.value = true
            else loadError.value = true
        } finally {
            if (session === sessionId) loading.value = false
        }
    }

    async function reloadCanvas() {
        const session = sessionId
        try {
            const c = await apiClient.getProjectCanvas(projectId.value)
            if (session === sessionId) applyCanvas(c)
        } catch (err) {
            if (session !== sessionId) return
            if (err?.status === 404) notFound.value = true
            else loadError.value = true
        }
    }

    async function reloadAll() {
        const session = sessionId
        try {
            const [p, c] = await Promise.all([apiClient.getProject(projectId.value), apiClient.getProjectCanvas(projectId.value)])
            if (session !== sessionId) return
            project.value = p
            applyCanvas(c)
        } catch (err) {
            if (session !== sessionId) return
            if (err?.status === 404) notFound.value = true
            else loadError.value = true
        }
    }

    // The AI assistant changed this canvas on the server. Pending edits go out first (a 409 takes the conflict path);
    // the idea being edited survives the reload even if the server has not seen it yet, so no typing is lost
    async function refreshFromServer(editingId = null) {
        const session = sessionId
        await flush()
        if (session !== sessionId || dirty || unsaved.value || conflict.value) return
        const editing = editingId ? getNode(editingId) : null
        try {
            const [p, c] = await Promise.all([apiClient.getProject(projectId.value), apiClient.getProjectCanvas(projectId.value)])
            if (session !== sessionId || dirty) return
            project.value = p
            applyCanvas(c)
            if (editing && !getNode(editing.id) && getNode(editing.parent_id)) nodes.value = [...nodes.value, editing]
        } catch { /* the next save or visit loads it */ }
    }

    // Leaving the page: later responses of this session are ignored
    function close() {
        sessionId++
        clearTimers()
        dirty = false
        inFlight = null
        keepaliveNext = false
    }

    // ── Autosave ──

    function clearTimers() {
        clearTimeout(saveTimer)
        clearTimeout(retryTimer)
        saveTimer = null
        retryTimer = null
    }

    function scheduleSave() {
        dirty = true
        saveStatus.value = 'saving'
        clearTimers()
        saveTimer = setTimeout(() => flush(), SAVE_DEBOUNCE_MS)
    }

    function flush({ keepalive = false } = {}) {
        clearTimers()
        if (inFlight) {
            if (keepalive) keepaliveNext = true
            return inFlight
        }
        if (!dirty || !canEdit.value) return Promise.resolve()
        const run = saveLoop(keepalive).finally(() => { if (inFlight === run) inFlight = null })
        inFlight = run
        return run
    }

    async function saveLoop(keepalive) {
        const session = sessionId
        while (dirty && session === sessionId) {
            dirty = false
            saveStatus.value = 'saving'
            const body = JSON.parse(JSON.stringify({ revision: revision.value, format: FORMAT, nodes: nodes.value }))
            const wantKeepalive = keepalive || keepaliveNext
            keepaliveNext = false
            const useKeepalive = wantKeepalive && new TextEncoder().encode(JSON.stringify(body)).length <= KEEPALIVE_MAX_BYTES
            try {
                const res = await apiClient.saveProjectCanvas(projectId.value, body, { keepalive: useKeepalive })
                if (session !== sessionId) return
                revision.value = res.revision
                retryCount = 0
            } catch (err) {
                if (session !== sessionId) return
                dirty = true
                await onSaveError(err)
                return
            }
        }
        if (session === sessionId && !dirty) saveStatus.value = 'saved'
    }

    // A save or the AI convert answered 403 — the page reloads read-only
    async function onLostEditRights() {
        toaster.push('You can no longer edit this brainstorm, so your latest changes weren\'t saved.')
        await reloadAll()
    }

    async function onSaveError(err) {
        const status = err?.status
        if (status === 409) {
            conflict.value = true
            await reloadCanvas()
        } else if (status === 403) {
            await onLostEditRights()
        } else if (status === 404) {
            dirty = false
            notFound.value = true
        } else if (status === 400 && err.code === 'canvas_too_large') {
            saveStatus.value = 'too_large'
        } else {
            saveStatus.value = 'error'
            // 401: a keepalive save went out with an expired token — the retry goes through the refreshing client
            if (status == null || status >= 500 || status === 401) {
                retryTimer = setTimeout(() => flush(), RETRY_MS[Math.min(retryCount++, RETRY_MS.length - 1)])
            }
        }
    }

    function retryNow() {
        flush()
    }

    function dismissConflict() {
        conflict.value = false
    }

    // ── Undo / redo ──

    function snapshot() {
        return JSON.stringify(nodes.value)
    }

    function pushUndo() {
        undoStack.value.push(snapshot())
        if (undoStack.value.length > UNDO_LIMIT) undoStack.value.shift()
        redoStack.value = []
    }

    function commit(mutate, { undoable = true } = {}) {
        if (!canEdit.value) return false
        if (undoable) pushUndo()
        mutate()
        commitSeq.value++
        scheduleSave()
        return true
    }

    function undo() {
        if (!canUndo.value) return
        redoStack.value.push(snapshot())
        nodes.value = JSON.parse(undoStack.value.pop())
        scheduleSave()
    }

    function redo() {
        if (!canRedo.value) return
        undoStack.value.push(snapshot())
        nodes.value = JSON.parse(redoStack.value.pop())
        scheduleSave()
    }

    // ── Placement ──

    function estimatedWidth(node) {
        if (node.parent_id == null) return 280
        return Math.min(IDEA_MAX_WIDTH, node.text.length * CHAR_PX + 32)
    }

    function rowStep(node) {
        const lines = Math.max(1, Math.ceil((node.text.length * CHAR_PX) / IDEA_MAX_WIDTH))
        return ROW_PX + (lines - 1) * LINE_PX
    }

    function placementFor(parentId, excludeId = null) {
        const parent = getNode(parentId)
        const siblings = childrenOf(parentId).filter(n => n.id !== excludeId)
        if (parent.parent_id == null) {
            const right = siblings.filter(n => n.dx >= 0)
            const left = siblings.filter(n => n.dx < 0)
            const side = left.length < right.length ? -1 : 1
            const sameSide = side < 0 ? left : right
            const lowest = sameSide.reduce((a, b) => (!a || b.dy > a.dy ? b : a), null)
            return { dx: side * ROOT_CHILD_DX, dy: lowest ? lowest.dy + rowStep(lowest) : 0 }
        }
        const side = sideOf(parentId)
        const last = siblings[siblings.length - 1]
        return {
            dx: side * Math.max(CHILD_DX, estimatedWidth(parent) + CHILD_GAP),
            dy: last ? last.dy + rowStep(last) : 0,
        }
    }

    // Siblings' array order follows the screen: root children right side top → bottom, then left; others top → bottom
    function sortSiblings(parentId) {
        const parent = getNode(parentId)
        if (!parent) return
        const siblings = nodes.value.filter(n => n.parent_id === parentId)
        const slots = []
        nodes.value.forEach((n, i) => { if (n.parent_id === parentId) slots.push(i) })
        const isRoot = parent.parent_id == null
        const sorted = [...siblings].sort((a, b) => {
            if (isRoot && (a.dx < 0) !== (b.dx < 0)) return a.dx < 0 ? 1 : -1
            return a.dy - b.dy
        })
        slots.forEach((slot, i) => { nodes.value[slot] = sorted[i] })
    }

    function mirrorDescendants(id) {
        for (const d of descendantIds(id)) {
            const n = getNode(d)
            n.dx = -n.dx
        }
    }

    let idSeq = 0
    function makeNode(parentId) {
        idSeq = (idSeq + 1) % 1296
        return {
            id: `n${Date.now().toString(36)}${idSeq.toString(36)}`,
            parent_id: parentId,
            text: '',
            dx: 0,
            dy: 0,
            folded: false,
            converted: false,
        }
    }

    function canAdd() {
        if (nodes.value.length < nodeLimit.value) return true
        if (tier.value === 'free') {
            upgradeModel().show({
                message: 'You\'ve reached the idea limit for a brainstorm on the Free plan. Upgrade to Pro for bigger brainstorms.',
                limit: nodeLimit.value,
                kind: 'canvas',
            })
        } else {
            toaster.push('This brainstorm is full. Remove ideas you no longer need to add new ones.')
        }
        return false
    }

    // ── Edits (each is one undo step) ──

    function addChild(parentId) {
        const parent = getNode(parentId)
        if (!parent || !canEdit.value || !canAdd()) return null
        const node = makeNode(parentId)
        Object.assign(node, placementFor(parentId))
        commit(() => {
            nodes.value.push(node)
            parent.folded = false
            sortSiblings(parentId)
        })
        return node.id
    }

    function addSibling(id) {
        const current = getNode(id)
        if (!current) return null
        if (current.parent_id == null) return addChild(id)
        if (!canEdit.value || !canAdd()) return null
        const parentId = current.parent_id
        const isRootChild = getNode(parentId).parent_id == null
        const step = rowStep(current)
        const node = makeNode(parentId)
        node.dx = current.dx
        node.dy = current.dy + step
        commit(() => {
            for (const s of childrenOf(parentId)) {
                if (s === current || s.dy <= current.dy) continue
                if (isRootChild && (s.dx < 0) !== (current.dx < 0)) continue
                s.dy += step
            }
            nodes.value.splice(nodes.value.indexOf(current) + 1, 0, node)
            sortSiblings(parentId)
        })
        return node.id
    }

    function sanitizeText(text) {
        return (text || '').replace(/[\r\n]+/g, ' ').slice(0, NODE_TEXT_LIMIT)
    }

    // merge: the text of a just-added idea joins the add's undo step
    function setText(id, text, { merge = false } = {}) {
        const node = getNode(id)
        const clean = sanitizeText(text)
        if (!node || node.parent_id == null || node.text === clean) return
        commit(() => { node.text = clean }, { undoable: !merge })
    }

    // An empty new idea is dropped when its editing ends: its add step is taken back
    function discardNew(id) {
        if (!canEdit.value || !getNode(id) || !undoStack.value.length) return
        nodes.value = JSON.parse(undoStack.value.pop())
        scheduleSave()
    }

    function removeNode(id) {
        const node = getNode(id)
        if (!node || node.parent_id == null) return false
        const gone = new Set([id, ...descendantIds(id)])
        return commit(() => { nodes.value = nodes.value.filter(n => !gone.has(n.id)) })
    }

    function moveTo(id, targetId) {
        const node = getNode(id)
        const target = getNode(targetId)
        if (!node || !target || node.parent_id == null) return false
        if (node.parent_id === targetId || isInBranch(targetId, id)) return false
        const oldSide = sideOf(id)
        const pos = placementFor(targetId, id)
        return commit(() => {
            nodes.value.splice(nodes.value.indexOf(node), 1)
            node.parent_id = targetId
            node.dx = pos.dx
            node.dy = pos.dy
            nodes.value.push(node)
            target.folded = false
            if (sideOf(id) !== oldSide) mirrorDescendants(id)
            sortSiblings(targetId)
        })
    }

    // Drop on empty space: a new offset from the parent
    function setOffset(id, dx, dy) {
        const node = getNode(id)
        if (!node || node.parent_id == null) return
        const oldSide = sideOf(id)
        commit(() => {
            node.dx = Math.round(dx)
            node.dy = Math.round(dy)
            if (sideOf(id) !== oldSide) mirrorDescendants(id)
            sortSiblings(node.parent_id)
        })
    }

    // Read-only: folding works locally and is never saved
    function setFolded(id, folded) {
        const node = getNode(id)
        if (!node || node.folded === folded || !childrenOf(id).length) return
        if (!canEdit.value) {
            node.folded = folded
            return
        }
        commit(() => { node.folded = folded })
    }

    function unmarkConverted(id) {
        const node = getNode(id)
        if (!node || !node.converted) return
        commit(() => { node.converted = false })
    }

    // ── Turn into actions: existing create-action path, then one save of the marks ──

    // rows = [{ title, source_ids }] in backlog order; every source idea of a created row gets the converted mark
    // → { created, outcome: 'ok' | 'network' | 'closed' }
    async function convert(rows) {
        const closed = () => conflict.value || notFound.value || !canEdit.value
        await flush()
        if (closed()) return { created: 0, outcome: 'closed' }
        if (dirty || unsaved.value) return { created: 0, outcome: 'network' }

        const created = []
        let failed = false
        for (const row of rows) {
            try {
                await apiClient.addAction({ title: row.title.trim(), project_id: projectId.value, add_to_top: false })
                created.push(row)
            } catch {
                failed = true
                break
            }
        }

        if (created.length) {
            for (const row of created) {
                for (const id of row.source_ids) {
                    const node = getNode(id)
                    if (node) node.converted = true
                }
            }
            undoStack.value = []
            redoStack.value = []
            commitSeq.value++
            dirty = true
            statsModel().refreshStats()
            await flush()
        }
        if (closed()) return { created: created.length, outcome: 'closed' }
        return { created: created.length, outcome: failed ? 'network' : 'ok' }
    }

    instance = {
        project,
        nodes,
        loading,
        loadError,
        notFound,
        saveStatus,
        conflict,
        isOwner,
        canEdit,
        nodeLimit,
        projectTitle,
        canUndo,
        canRedo,
        unsaved,
        commitSeq,
        convertCandidates,
        getNode,
        childrenOf,
        descendantIds,
        descendantCount,
        isInBranch,
        pathTo,
        depthOf,
        absoluteX,
        sideOf,
        displayText,
        treeOrder,
        load,
        close,
        flush,
        retryNow,
        dismissConflict,
        undo,
        redo,
        addChild,
        addSibling,
        setText,
        discardNew,
        removeNode,
        moveTo,
        setOffset,
        setFolded,
        unmarkConverted,
        convert,
        onLostEditRights,
        refreshFromServer,
    }
    return instance
}
