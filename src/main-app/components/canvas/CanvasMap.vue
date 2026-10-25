<template>
  <div
      ref="surfaceRef"
      class="cm-surface"
      :class="{ 'cm-surface--panning': panning }"
      :style="surfaceStyle"
      tabindex="0"
      data-testid="canvas-map"
      @keydown="onKeydown"
      @pointerdown="onSurfacePointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @wheel.prevent="onWheel"
  >
    <div class="cm-layer" :style="layerStyle">
      <svg class="cm-lines" aria-hidden="true">
        <path
            v-for="line in layout.lines"
            :key="line.id"
            :d="line.d"
            :style="{ stroke: line.color }"
            :stroke-width="line.width"
            fill="none"
        />
      </svg>

      <div
          v-for="item in layout.items"
          :key="item.node.id"
          :ref="el => setNodeEl(el, item.node.id)"
          class="cm-node"
          :class="nodeClasses(item)"
          :style="{ left: `${item.left}px`, top: `${item.top}px`, '--branch': item.color }"
          :data-node-id="item.node.id"
          @pointerdown="onNodePointerDown($event, item)"
          @dblclick.stop="onNodeDoubleClick(item)"
          @contextmenu.prevent.stop="openMenu($event, item.node.id)"
      >
        <span v-if="item.node.converted" class="cm-converted" title="In the backlog"><CheckIcon /></span>
        <span class="cm-label" :class="{ 'cm-label--editing': editingId === item.node.id }">
          <span
              class="cm-text"
              :class="[textClass(item), { 'cm-text--blank': isBlank(item), 'cm-text--hidden': editingId === item.node.id }]"
          >{{ editingId === item.node.id ? (draft || ' ') : labelOf(item) }}</span>
          <textarea
              v-if="editingId === item.node.id"
              ref="editorRef"
              v-model="draft"
              class="cm-editor"
              :class="textClass(item)"
              :maxlength="NODE_TEXT_LIMIT"
              rows="1"
              @input="onEditorInput"
              @keydown="onEditorKeydown"
              @blur="onEditorBlur(item.node.id)"
              @pointerdown.stop
          ></textarea>
        </span>
        <p v-if="editingId === item.node.id && draft.length >= NODE_TEXT_LIMIT" class="text-caption color-text-secondary cm-cap">
          Ideas can be up to {{ NODE_TEXT_LIMIT }} characters.
        </p>
        <button
            v-if="hasChildren(item) && item.depth > 0"
            type="button"
            class="cm-fold"
            :class="{ 'cm-fold--folded': item.node.folded }"
            :title="item.node.folded ? `${hiddenCount(item)} hidden ideas — click to unfold` : 'Fold'"
            @pointerdown.stop
            @click.stop="toggleFold(item.node.id)"
        >
          <span v-if="item.node.folded" class="text-footnote">{{ hiddenCount(item) }}</span>
          <component v-else :is="item.side < 0 ? ChevronRightIcon : ChevronLeftIcon" class="cm-fold-icon" />
        </button>
        <button
            v-if="canvas.canEdit.value && editingId !== item.node.id"
            type="button"
            class="cm-add"
            :class="{ 'cm-add--far': hasChildren(item) && item.depth > 0 }"
            title="Add idea"
            @pointerdown.stop
            @click.stop="addChildOf(item.node.id)"
        >
          <PlusIcon />
        </button>
      </div>

      <!-- Empty canvas -->
      <div v-if="rootOnly && rootItem" class="cm-empty" :style="emptyStyle">
        <template v-if="canvas.canEdit.value">
          <h4 class="text-h4 cm-empty-title">Brainstorm this project</h4>
          <p class="text-body-s color-text-secondary cm-empty-text">Get every idea out of your head — no order, no judging. Press Tab to add an idea and Enter for the next one. When you're ready, Convert to backlog turns the ideas you pick into actions.</p>
          <Lnk text="" link="How brainstorming works" @pointerdown.stop @action="emit('help')" />
        </template>
        <p v-else class="text-body-s color-text-secondary cm-empty-text">{{ canvas.isOwner.value ? 'No ideas were added to this brainstorm.' : 'The project owner hasn\'t added any ideas yet.' }}</p>
      </div>
    </div>

    <!-- Zoom cluster -->
    <div class="cm-zoom" @pointerdown.stop>
      <Btn variant="icon" title="Zoom out" @click="zoomBy(1 / ZOOM_STEP)">−</Btn>
      <Btn variant="icon" title="Zoom in" @click="zoomBy(ZOOM_STEP)">+</Btn>
      <Btn variant="icon" title="Fit all" @click="fitAll">Fit</Btn>
    </div>

    <!-- Context menu -->
    <Teleport to="body">
      <template v-if="menu">
        <div class="cm-menu-backdrop" @click="menu = null" @contextmenu.prevent="menu = null"></div>
        <div class="cm-menu" :style="{ left: `${menu.x}px`, top: `${menu.y}px` }" data-testid="canvas-context-menu">
          <template v-if="menuNode?.parent_id == null">
            <button class="dropdown-item cm-menu-item" @click="menuAction(id => addChildOf(id))">Add idea</button>
          </template>
          <template v-else-if="menuNode">
            <button class="dropdown-item cm-menu-item" @click="menuAction(id => addChildOf(id))">
              Add idea under it <span class="text-caption color-text-secondary cm-menu-key">Tab</span>
            </button>
            <button class="dropdown-item cm-menu-item" @click="menuAction(id => startEdit(id))">
              Edit <span class="text-caption color-text-secondary cm-menu-key">Space</span>
            </button>
            <button v-if="canvas.childrenOf(menu.id).length" class="dropdown-item cm-menu-item" @click="menuAction(id => toggleFold(id))">
              {{ menuNode.folded ? 'Unfold' : 'Fold' }}
              <span class="text-caption color-text-secondary cm-menu-key">{{ modKey }} {{ menuNode.folded ? '↓' : '↑' }}</span>
            </button>
            <button class="dropdown-item cm-menu-item" @click="menuAction(id => emit('move', id))">Move to…</button>
            <button v-if="menuNode.converted" class="dropdown-item cm-menu-item" @click="menuAction(id => canvas.unmarkConverted(id))">Mark as not converted</button>
            <button class="dropdown-item dropdown-item--danger cm-menu-item" @click="menuAction(id => deleteIdea(id))">
              {{ deleteLabel(menu.id) }} <span class="text-caption color-text-secondary cm-menu-key">Del</span>
            </button>
          </template>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import Btn from '../Btn.vue'
import Lnk from '../Lnk.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import PlusIcon from '../../assets/PlusIcon.vue'
import ChevronLeftIcon from '../../assets/ChevronLeftIcon.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'
import { canvasModel, NODE_TEXT_LIMIT } from '../../scripts/models/canvasModel.js'
import { LONG_PRESS_MS } from '../../scripts/core/swipe.js'

const emit = defineEmits(['move', 'help'])

// For the header Undo / Redo: ends an open edit; true when that dropped an empty new idea (the drop is the undo)
defineExpose({ finishEdit: () => !commitEdit() })

const BRANCH_COLORS = [
  'var(--color-action)', 'var(--color-project)', 'var(--color-info)',
  'var(--color-success)', 'var(--color-review)', 'var(--color-file-blue)',
]
const DEFAULT_SIZE = { w: 120, h: 32 }
const DRAG_START_PX = 4
const TAP_MOVE_PX = 10
const DOUBLE_TAP_MS = 300
const MIN_ZOOM = 0.25
const MAX_ZOOM = 2
const ZOOM_STEP = 1.2
const VIEW_MARGIN = 48
const GRID_PX = 24

const canvas = canvasModel()
const modKey = /mac/i.test(navigator.platform) ? '⌘' : 'Ctrl'

const surfaceRef = ref(null)
const editorRef = ref(null)
const selectedId = ref(null)
const editingId = ref(null)
const editingIsNew = ref(false)
const draft = ref('')
const pan = reactive({ x: 0, y: 0 })
const zoom = ref(1)
const sizes = reactive({})
const drag = reactive({ id: null, active: false, dx: 0, dy: 0, branch: new Set(), targetId: null })
const panning = ref(false)
const menu = ref(null)

const nodeEls = new Map()
let resizeObserver = null
// Pointer bookkeeping for pan / pinch / node press
const pointers = new Map()
let press = null
let pinchStart = null
let longPressTimer = null
let lastTap = { id: null, at: 0 }

const rootNode = computed(() => canvas.nodes.value.find(n => n.parent_id == null) || null)
const rootOnly = computed(() => canvas.nodes.value.length === 1)
const menuNode = computed(() => menu.value ? canvas.getNode(menu.value.id) : null)

const surfaceStyle = computed(() => ({
  backgroundSize: `${GRID_PX * zoom.value}px ${GRID_PX * zoom.value}px`,
  backgroundPosition: `${pan.x}px ${pan.y}px`,
}))

const layerStyle = computed(() => ({
  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`,
}))

// Visible ideas with their box and the lines between them (root at 0,0)
const layout = computed(() => {
  const items = []
  const lines = []
  const root = rootNode.value
  if (!root) return { items, lines, byId: new Map() }
  const byId = new Map()
  const offX = drag.active ? drag.dx / zoom.value : 0
  const offY = drag.active ? drag.dy / zoom.value : 0

  const place = (node, x, y, depth, side, color) => {
    const size = sizes[node.id] || DEFAULT_SIZE
    const moved = drag.active && drag.branch.has(node.id)
    const ax = x + (moved ? offX : 0)
    const ay = y + (moved ? offY : 0)
    let left
    if (depth === 0) left = ax - size.w / 2
    else left = side < 0 ? ax - size.w : ax
    const item = { node, depth, side, color, left, top: ay - size.h / 2, w: size.w, h: size.h }
    items.push(item)
    byId.set(node.id, item)
    return item
  }

  const walk = (node, x, y, depth, side, color) => {
    const item = place(node, x, y, depth, side, color)
    if (depth > 0 && node.folded) return item
    canvas.childrenOf(node.id).forEach((child, i) => {
      const cx = x + child.dx
      const cy = y + child.dy
      const childSide = depth === 0 ? (child.dx < 0 ? -1 : 1) : (cx < 0 ? -1 : 1)
      const childColor = depth === 0 ? BRANCH_COLORS[i % BRANCH_COLORS.length] : color
      const childItem = walk(child, cx, cy, depth + 1, childSide, childColor)
      lines.push(lineBetween(item, childItem))
    })
    return item
  }
  walk(root, 0, 0, 0, 0, BRANCH_COLORS[0])
  return { items, lines, byId }
})

const rootItem = computed(() => rootNode.value ? layout.value.byId.get(rootNode.value.id) : null)

const emptyStyle = computed(() => {
  const r = rootItem.value
  return { left: `${r.left + r.w / 2}px`, top: `${r.top + r.h + 24}px` }
})

function lineBetween(parent, child) {
  const side = child.side
  const x1 = side < 0 ? parent.left : parent.left + parent.w
  const y1 = parent.depth >= 2 ? parent.top + parent.h : parent.top + parent.h / 2
  const x2 = side < 0 ? child.left + child.w : child.left
  const y2 = child.depth >= 2 ? child.top + child.h : child.top + child.h / 2
  const mx = (x1 + x2) / 2
  const width = child.depth === 1 ? 3 : child.depth === 2 ? 2 : 1.5
  return { id: child.node.id, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, color: child.color, width }
}

function nodeClasses(item) {
  const id = item.node.id
  return [
    `cm-node--d${Math.min(item.depth, 2)}`,
    {
      'cm-node--left': item.side < 0,
      'cm-node--selected': selectedId.value === id,
      'cm-node--editing': editingId.value === id,
      'cm-node--dragging': drag.active && drag.branch.has(id),
      'cm-node--drop': drag.active && drag.targetId === id,
      'cm-node--converted': item.node.converted,
      'cm-node--editable': canvas.canEdit.value,
    },
  ]
}

function textClass(item) {
  if (item.depth === 0) return 'text-h4'
  if (item.depth === 1) return 'text-body-m fw-medium'
  return 'text-body-s'
}

function isBlank(item) {
  return item.depth > 0 && !item.node.text.trim()
}

function labelOf(item) {
  if (item.depth === 0) return canvas.projectTitle.value
  return item.node.text.trim() || 'Untitled idea'
}

function hasChildren(item) {
  return canvas.childrenOf(item.node.id).length > 0
}

function hiddenCount(item) {
  return canvas.descendantCount(item.node.id)
}

function deleteLabel(id) {
  const n = canvas.descendantCount(id)
  return n ? `Delete with ${n} sub-ideas` : 'Delete'
}

// ── Size measuring ──

function setNodeEl(el, id) {
  const prev = nodeEls.get(id)
  if (prev === el) return
  if (prev) resizeObserver?.unobserve(prev)
  if (el) {
    nodeEls.set(id, el)
    resizeObserver?.observe(el)
  } else {
    nodeEls.delete(id)
    delete sizes[id]
  }
}

function onResize(entries) {
  for (const entry of entries) {
    const el = entry.target
    const id = el.dataset.nodeId
    if (!id) continue
    const w = el.offsetWidth
    const h = el.offsetHeight
    const old = sizes[id]
    if (!old || old.w !== w || old.h !== h) sizes[id] = { w, h }
  }
}

// ── Selection / view ──

function focusSurface() {
  surfaceRef.value?.focus({ preventScroll: true })
}

function select(id) {
  selectedId.value = id
}

function ensureVisible(id) {
  const item = layout.value.byId.get(id)
  const el = surfaceRef.value
  if (!item || !el) return
  const z = zoom.value
  const left = pan.x + item.left * z
  const top = pan.y + item.top * z
  const right = left + item.w * z
  const bottom = top + item.h * z
  if (left < VIEW_MARGIN) pan.x += VIEW_MARGIN - left
  else if (right > el.clientWidth - VIEW_MARGIN) pan.x -= right - (el.clientWidth - VIEW_MARGIN)
  if (top < VIEW_MARGIN) pan.y += VIEW_MARGIN - top
  else if (bottom > el.clientHeight - VIEW_MARGIN) pan.y -= bottom - (el.clientHeight - VIEW_MARGIN)
}

function centerRoot() {
  const el = surfaceRef.value
  if (!el) return
  pan.x = el.clientWidth / 2
  pan.y = el.clientHeight / 2
}

function zoomAround(factor, cx, cy) {
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * factor))
  const ratio = next / zoom.value
  pan.x = cx - (cx - pan.x) * ratio
  pan.y = cy - (cy - pan.y) * ratio
  zoom.value = next
}

function zoomBy(factor) {
  const el = surfaceRef.value
  zoomAround(factor, el.clientWidth / 2, el.clientHeight / 2)
}

function fitAll() {
  const el = surfaceRef.value
  const items = layout.value.items
  if (!el || !items.length) return
  const minX = Math.min(...items.map(i => i.left))
  const minY = Math.min(...items.map(i => i.top))
  const maxX = Math.max(...items.map(i => i.left + i.w))
  const maxY = Math.max(...items.map(i => i.top + i.h))
  const w = maxX - minX + VIEW_MARGIN * 2
  const h = maxY - minY + VIEW_MARGIN * 2
  zoom.value = Math.min(1, Math.max(MIN_ZOOM, Math.min(el.clientWidth / w, el.clientHeight / h)))
  pan.x = el.clientWidth / 2 - ((minX + maxX) / 2) * zoom.value
  pan.y = el.clientHeight / 2 - ((minY + maxY) / 2) * zoom.value
}

// ── Editing ──

function startEdit(id, { isNew = false, replaceWith = null } = {}) {
  const node = canvas.getNode(id)
  if (!node || node.parent_id == null || !canvas.canEdit.value) return
  select(id)
  editingIsNew.value = isNew
  draft.value = replaceWith ?? node.text
  editingId.value = id
  nextTick(() => {
    const ta = Array.isArray(editorRef.value) ? editorRef.value[0] : editorRef.value
    if (!ta) return
    ta.focus({ preventScroll: true })
    ta.selectionStart = ta.selectionEnd = ta.value.length
    ensureVisible(id)
  })
}

// → false when an empty new idea was dropped
function commitEdit() {
  const id = editingId.value
  if (!id) return true
  const text = draft.value.trim()
  const isNew = editingIsNew.value
  editingId.value = null
  editingIsNew.value = false
  if (isNew && !text) {
    const parentId = canvas.getNode(id)?.parent_id
    canvas.discardNew(id)
    select(parentId ?? rootNode.value?.id)
    return false
  }
  canvas.setText(id, text, { merge: isNew })
  return true
}

function onEditorInput(e) {
  const clean = e.target.value.replace(/[\r\n]+/g, ' ')
  if (clean !== draft.value) draft.value = clean
}

function onEditorKeydown(e) {
  const id = editingId.value
  if (['Tab', 'Enter', 'Escape'].includes(e.key)) e.stopPropagation()
  if (e.key === 'Tab') {
    e.preventDefault()
    if (commitEdit()) addAndEdit(() => canvas.addChild(id))
    else focusSurface()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (commitEdit()) addAndEdit(() => canvas.addSibling(id))
    else focusSurface()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    commitEdit()
    focusSurface()
  }
}

function onEditorBlur(id) {
  if (editingId.value === id) commitEdit()
}

function addAndEdit(add) {
  const newId = add()
  if (newId) startEdit(newId, { isNew: true })
  else focusSurface()
}

function addChildOf(id) {
  if (editingId.value) commitEdit()
  addAndEdit(() => canvas.addChild(id))
}

function deleteIdea(id) {
  const node = canvas.getNode(id)
  if (!node || node.parent_id == null) return
  canvas.removeNode(id)
  select(node.parent_id)
  focusSurface()
}

function toggleFold(id) {
  const node = canvas.getNode(id)
  if (!node) return
  canvas.setFolded(id, !node.folded)
  if (node.folded && selectedId.value !== id && canvas.isInBranch(selectedId.value, id)) select(id)
}

// ── Keyboard ──

function sameSideSiblings(node) {
  const parent = canvas.getNode(node.parent_id)
  let siblings = canvas.childrenOf(node.parent_id)
  if (parent?.parent_id == null) siblings = siblings.filter(s => (s.dx < 0) === (node.dx < 0))
  return [...siblings].sort((a, b) => a.dy - b.dy)
}

function firstChildToward(node, side) {
  let children = canvas.childrenOf(node.id)
  if (node.parent_id == null) children = children.filter(c => (c.dx < 0) === (side < 0))
  return [...children].sort((a, b) => a.dy - b.dy)[0] || null
}

function navigate(key, node) {
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    if (node.parent_id == null) return
    const list = sameSideSiblings(node)
    const i = list.indexOf(node) + (key === 'ArrowUp' ? -1 : 1)
    if (list[i]) select(list[i].id)
    return
  }
  const dir = key === 'ArrowLeft' ? -1 : 1
  const side = canvas.sideOf(node.id)
  if (node.parent_id == null) {
    const child = firstChildToward(node, dir)
    if (child) select(child.id)
    return
  }
  if (dir === -side) {
    select(node.parent_id)
    return
  }
  if (node.folded) canvas.setFolded(node.id, false)
  const child = firstChildToward(node, side)
  if (child) select(child.id)
}

function onKeydown(e) {
  if (editingId.value) return
  const key = e.key
  const lower = key.toLowerCase()
  const mod = e.ctrlKey || e.metaKey
  const node = selectedId.value ? canvas.getNode(selectedId.value) : null
  const editable = canvas.canEdit.value
  const consume = () => { e.preventDefault(); e.stopPropagation() }

  if (mod && lower === 'k') return
  if (key === '?' && !node) return

  if (mod && (lower === 'z' || lower === 'y')) {
    if (!editable) return
    consume()
    if (lower === 'y' || e.shiftKey) canvas.redo()
    else canvas.undo()
    if (selectedId.value && !canvas.getNode(selectedId.value)) select(rootNode.value?.id)
    return
  }

  if (key === 'Escape') {
    if (!node) return
    consume()
    select(null)
    return
  }

  if (!node) {
    if (editable && key.length === 1 && !mod && !e.altKey) e.stopPropagation()
    return
  }

  if (mod && (key === 'ArrowUp' || key === 'ArrowDown')) {
    consume()
    if (node.parent_id != null) canvas.setFolded(node.id, key === 'ArrowUp')
    return
  }

  if (key.startsWith('Arrow')) {
    consume()
    navigate(key, node)
    return
  }

  if (!editable || mod || e.altKey) return

  if (key === 'Tab') {
    consume()
    addAndEdit(() => canvas.addChild(node.id))
  } else if (key === 'Enter') {
    consume()
    addAndEdit(() => canvas.addSibling(node.id))
  } else if (key === ' ' || key === 'F2') {
    consume()
    startEdit(node.id)
  } else if (key === 'Delete' || key === 'Backspace') {
    consume()
    deleteIdea(node.id)
  } else if (key.length === 1) {
    consume()
    startEdit(node.id, { replaceWith: key })
  }
}

// ── Pointer: pan, pinch, node press / drag ──

function clearLongPress() {
  clearTimeout(longPressTimer)
  longPressTimer = null
}

function onSurfacePointerDown(e) {
  if (e.button > 0) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 2) {
    clearLongPress()
    press = null
    const [a, b] = [...pointers.values()]
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoom.value }
    return
  }
  if (e.target.closest('[data-node-id]')) return
  if (editingId.value) commitEdit()
  menu.value = null
  surfaceRef.value.setPointerCapture?.(e.pointerId)
  press = { kind: 'pan', x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, moved: false }
  focusSurface()
}

function onNodePointerDown(e, item) {
  if (e.button > 0) return
  if (editingId.value && editingId.value !== item.node.id) commitEdit()
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size > 1) return
  e.stopPropagation()
  menu.value = null
  const touch = e.pointerType !== 'mouse'
  press = { kind: touch ? 'touch-node' : 'node', id: item.node.id, x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y, moved: false }
  if (!touch) {
    select(item.node.id)
    focusSurface()
    return
  }
  if (canvas.canEdit.value) {
    longPressTimer = setTimeout(() => {
      longPressTimer = null
      if (press?.kind !== 'touch-node' || press.moved) return
      select(press.id)
      menu.value = { id: press.id, x: press.x, y: press.y }
      press = null
    }, LONG_PRESS_MS)
  }
}

function onPointerMove(e) {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pinchStart && pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const rect = surfaceRef.value.getBoundingClientRect()
    const factor = (pinchStart.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinchStart.dist) / zoom.value
    zoomAround(factor, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top)
    return
  }
  if (!press) return
  // released outside the canvas
  if (e.pointerType === 'mouse' && e.buttons === 0) {
    press = null
    panning.value = false
    resetDrag()
    return
  }
  const dx = e.clientX - press.x
  const dy = e.clientY - press.y
  const dist = Math.hypot(dx, dy)

  if (press.kind === 'node') {
    if (!drag.active) {
      const node = canvas.getNode(press.id)
      if (dist < DRAG_START_PX || !canvas.canEdit.value || node?.parent_id == null) return
      drag.id = press.id
      drag.branch = new Set([press.id, ...canvas.descendantIds(press.id)])
      drag.active = true
      panning.value = false
      surfaceRef.value.setPointerCapture?.(e.pointerId)
    }
    drag.dx = dx
    drag.dy = dy
    drag.targetId = dropTargetAt(e.clientX, e.clientY)
    return
  }

  // pan (empty space, or a touch that moved on an idea)
  if (!press.moved && dist < (press.kind === 'touch-node' ? TAP_MOVE_PX : DRAG_START_PX)) return
  press.moved = true
  clearLongPress()
  panning.value = true
  pan.x = press.panX + dx
  pan.y = press.panY + dy
}

function dropTargetAt(x, y) {
  const el = document.elementFromPoint(x, y)?.closest('[data-node-id]')
  const id = el?.dataset.nodeId
  if (!id || drag.branch.has(id)) return null
  return id
}

function onPointerUp(e) {
  pointers.delete(e.pointerId)
  if (pinchStart) {
    if (pointers.size < 2) pinchStart = null
    return
  }
  clearLongPress()
  const p = press
  press = null
  panning.value = false
  if (!p) return

  if (p.kind === 'node' && drag.active) {
    finishDrag()
    return
  }
  if (p.kind === 'pan' && !p.moved) {
    select(null)
    return
  }
  if (p.kind === 'touch-node' && !p.moved) {
    const now = Date.now()
    if (lastTap.id === p.id && now - lastTap.at < DOUBLE_TAP_MS) {
      lastTap = { id: null, at: 0 }
      startEdit(p.id)
    } else {
      lastTap = { id: p.id, at: now }
      select(p.id)
      focusSurface()
    }
  }
}

function onPointerCancel(e) {
  pointers.delete(e.pointerId)
  pinchStart = null
  press = null
  panning.value = false
  clearLongPress()
  resetDrag()
}

function resetDrag() {
  drag.active = false
  drag.id = null
  drag.dx = 0
  drag.dy = 0
  drag.targetId = null
  drag.branch = new Set()
}

function finishDrag() {
  const id = drag.id
  const node = canvas.getNode(id)
  const targetId = drag.targetId
  const ddx = drag.dx / zoom.value
  const ddy = drag.dy / zoom.value
  resetDrag()
  if (!node) return
  if (targetId && targetId !== node.parent_id && canvas.moveTo(id, targetId)) return
  canvas.setOffset(id, node.dx + ddx, node.dy + ddy)
}

function onNodeDoubleClick(item) {
  startEdit(item.node.id)
}

function onWheel(e) {
  if (e.ctrlKey || e.metaKey) {
    const rect = surfaceRef.value.getBoundingClientRect()
    zoomAround(Math.exp(-e.deltaY * 0.01), e.clientX - rect.left, e.clientY - rect.top)
    return
  }
  pan.x -= e.deltaX
  pan.y -= e.deltaY
}

// ── Context menu ──

function openMenu(e, id) {
  if (!canvas.canEdit.value) return
  if (editingId.value) commitEdit()
  select(id)
  menu.value = { id, x: e.clientX, y: e.clientY }
}

function menuAction(run) {
  const id = menu.value.id
  menu.value = null
  run(id)
}

watch(selectedId, (id) => {
  if (id) nextTick(() => ensureVisible(id))
})

// A reload (conflict, lost rights) can remove the selected or edited idea
watch(() => canvas.nodes.value, () => {
  if (selectedId.value && !canvas.getNode(selectedId.value)) select(rootNode.value?.id ?? null)
  if (editingId.value && !canvas.getNode(editingId.value)) editingId.value = null
  if (!canvas.canEdit.value) {
    editingId.value = null
    menu.value = null
  }
})

onMounted(() => {
  resizeObserver = new ResizeObserver(onResize)
  for (const el of nodeEls.values()) resizeObserver.observe(el)
  centerRoot()
  select(rootNode.value?.id ?? null)
  focusSurface()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  clearLongPress()
})
</script>

<style scoped>
.cm-surface {
  position: relative;
  overflow: hidden;
  outline: none;
  touch-action: none;
  cursor: default;
  background-color: var(--color-app-background);
  background-image: radial-gradient(circle, var(--color-border-light) 1px, transparent 1px);
}

.cm-surface--panning {
  cursor: grabbing;
}

.cm-layer {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}

.cm-lines {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
  pointer-events: none;
}

.cm-node {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 4px;
  width: max-content;
  max-width: 240px;
  box-sizing: border-box;
  color: var(--color-text-primary);
  user-select: none;
  word-break: break-word;
  transition: background-color 150ms ease;
}

.cm-node--editable {
  cursor: grab;
}

.cm-node:hover {
  background-color: var(--color-bg-row-hover);
}

.cm-node--d0 {
  max-width: 280px;
  padding: 12px 16px;
  text-align: center;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-action);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-card);
  cursor: default;
}

.cm-node--d1 {
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border: 2px solid var(--branch);
  border-radius: 8px;
}

.cm-node--d2 {
  padding: 2px 4px;
  border-bottom: 2px solid var(--branch);
}

.cm-node--selected {
  box-shadow: var(--shadow-focus-ring);
  background-color: var(--color-action-bg-subtle);
}

.cm-node--dragging {
  pointer-events: none;
  opacity: 0.85;
}

.cm-node--drop {
  outline: 2px dashed var(--color-action);
  outline-offset: 3px;
}

.cm-node--converted .cm-text {
  color: var(--color-text-secondary);
}

.cm-converted {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--color-text-success);
}

.cm-converted :deep(svg) {
  width: 12px;
  height: 12px;
}

.cm-label {
  position: relative;
  display: block;
  min-width: 0;
}

.cm-label--editing {
  min-width: 60px;
}

.cm-text {
  display: block;
  white-space: pre-wrap;
}

.cm-text--blank {
  color: var(--color-text-secondary);
  font-style: italic;
}

.cm-text--hidden {
  visibility: hidden;
}

.cm-editor {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  overflow: hidden;
  background: transparent;
  color: var(--color-text-primary);
  font-style: normal;
  user-select: text;
}

.cm-cap {
  position: absolute;
  left: 0;
  top: calc(100% + 6px);
  width: max-content;
  margin: 0;
}

.cm-add,
.cm-fold {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  padding: 0;
  cursor: pointer;
}

.cm-add {
  left: calc(100% + 6px);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-action);
  color: var(--color-text-inverse);
}

.cm-add--far {
  left: calc(100% + 32px);
}

.cm-add :deep(svg) {
  width: 12px;
  height: 12px;
}

.cm-node--left .cm-add {
  left: auto;
  right: calc(100% + 6px);
}

.cm-node--left .cm-add--far {
  right: calc(100% + 32px);
}

.cm-fold {
  left: calc(100% + 4px);
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: var(--color-bg-primary);
  color: var(--branch);
}

.cm-node--left .cm-fold {
  left: auto;
  right: calc(100% + 4px);
}

.cm-fold-icon {
  width: 14px;
  height: 14px;
}

.cm-fold--folded {
  display: inline-flex;
  padding: 0 6px;
  background: var(--branch);
  color: var(--color-text-inverse);
}

.cm-node--editable:hover .cm-add,
.cm-node--editable.cm-node--selected .cm-add,
.cm-node:hover .cm-fold,
.cm-node--selected .cm-fold {
  display: inline-flex;
}

.cm-node--dragging .cm-add,
.cm-node--editing .cm-add {
  display: none;
}

.cm-empty {
  position: absolute;
  width: 360px;
  transform: translateX(-50%);
  text-align: center;
}

.cm-empty-title {
  margin: 0 0 8px;
  color: var(--color-text-primary);
}

.cm-empty-text {
  margin: 0 0 8px;
}

.cm-zoom {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-card);
}

.cm-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.cm-menu {
  position: fixed;
  z-index: 1000;
  min-width: 220px;
  padding: 8px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-dropdown);
}

.cm-menu-item {
  justify-content: space-between;
  gap: 16px;
  padding: 6px 8px;
  border-radius: 4px;
}

.cm-menu-key {
  flex-shrink: 0;
}
</style>
