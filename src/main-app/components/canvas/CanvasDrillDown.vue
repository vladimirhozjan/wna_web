<template>
  <div class="dd" data-testid="canvas-drilldown">
    <div class="dd-content">
      <!-- Path -->
      <div v-if="ancestors.length" ref="pathRef" class="text-body-s color-text-secondary dd-path">
        <template v-for="(a, i) in ancestors" :key="a.id">
          <span v-if="i > 0" class="dd-path-sep">›</span>
          <a class="dd-path-segment" @click="goTo(a.id)">{{ canvas.displayText(a) }}</a>
        </template>
      </div>

      <div ref="swipeRef">
      <!-- Current idea -->
      <div v-if="current" class="dd-current">
        <div class="dd-current-row">
          <div class="dd-current-text-wrap">
            <textarea
                v-if="editingId === current.id"
                ref="editorRef"
                v-model="draft"
                class="text-h4 dd-editor"
                :maxlength="NODE_TEXT_LIMIT"
                rows="1"
                enterkeyhint="done"
                @input="onEditorInput"
                @keydown.enter.prevent="endEdit"
                @blur="onEditorBlur(current.id)"
            ></textarea>
            <h4
                v-else
                class="text-h4 dd-current-text"
                :class="{ 'dd-blank': isBlank(current) }"
                @click="startEdit(current.id)"
            >{{ canvas.displayText(current) }}</h4>
          </div>
          <Btn
              v-if="canvas.canEdit.value && !isRoot"
              variant="icon"
              title="More"
              @click="sheetId = current.id"
          ><MoreIcon class="dd-icon" /></Btn>
        </div>
        <p v-if="editingId === current.id && draft.length >= NODE_TEXT_LIMIT" class="text-caption color-text-secondary dd-cap">
          Ideas can be up to {{ NODE_TEXT_LIMIT }} characters.
        </p>
        <span v-if="current.converted" class="text-footnote color-text-secondary dd-converted">
          <CheckIcon class="dd-check" /> In the backlog
        </span>

        <!-- Sibling position -->
        <div v-if="siblings.length > 1" class="dd-siblings">
          <Btn variant="icon" title="Previous" :disabled="siblingIndex <= 0" @click="goSibling(-1)"><TriangleLeftIcon class="dd-icon" /></Btn>
          <span v-if="siblings.length > MAX_DOTS" class="text-footnote color-text-secondary">{{ siblingIndex + 1 }} of {{ siblings.length }}</span>
          <span v-else class="dd-dots">
            <span v-for="(s, i) in siblings" :key="s.id" class="dd-dot" :class="{ 'dd-dot--current': i === siblingIndex }"></span>
          </span>
          <Btn variant="icon" title="Next" :disabled="siblingIndex >= siblings.length - 1" @click="goSibling(1)"><TriangleRightIcon class="dd-icon" /></Btn>
        </div>
      </div>

      <!-- Children -->
      <div class="dd-list">
        <div
            v-for="child in listChildren"
            :key="child.id"
            class="dd-row"
            @click="onRowClick(child)"
            @touchstart.passive="onRowTouchStart($event, child)"
            @touchmove.passive="onRowTouchMove"
            @touchend="onRowTouchEnd"
            @contextmenu.prevent="openRowMenu(child)"
        >
          <textarea
              v-if="editingId === child.id"
              ref="editorRef"
              v-model="draft"
              class="text-body-m dd-editor dd-row-editor"
              :maxlength="NODE_TEXT_LIMIT"
              rows="1"
              enterkeyhint="done"
              @click.stop
              @input="onEditorInput"
              @keydown.enter.prevent="endEdit"
              @blur="onEditorBlur(child.id)"
          ></textarea>
          <span v-else class="text-body-m dd-row-text" :class="{ 'dd-blank': isBlank(child) }">{{ canvas.displayText(child) }}</span>
          <span class="dd-row-meta">
            <CheckIcon v-if="child.converted" class="dd-check" />
            <span v-if="canvas.descendantCount(child.id) > 0" class="text-footnote color-text-secondary">{{ canvas.descendantCount(child.id) }}</span>
            <ChevronRightIcon class="dd-icon dd-chevron" />
          </span>
        </div>

        <!-- New-idea row -->
        <div v-if="newRowId" class="dd-row dd-row--new">
          <textarea
              ref="editorRef"
              v-model="draft"
              class="text-body-m dd-editor dd-row-editor"
              :maxlength="NODE_TEXT_LIMIT"
              rows="1"
              enterkeyhint="next"
              placeholder="New idea"
              @input="onEditorInput"
              @keydown.enter.prevent="onNewRowEnter"
              @blur="onEditorBlur(newRowId)"
          ></textarea>
        </div>
        <p v-if="newRowId && draft.length >= NODE_TEXT_LIMIT" class="text-caption color-text-secondary dd-cap">
          Ideas can be up to {{ NODE_TEXT_LIMIT }} characters.
        </p>

        <!-- Empty -->
        <template v-if="!listChildren.length && !newRowId">
          <div v-if="isRoot && canvas.canEdit.value" class="dd-empty">
            <h4 class="text-h4 dd-empty-title">Brainstorm this project</h4>
            <p class="text-body-s color-text-secondary dd-empty-text">Get every idea out of your head — no order, no judging. Tap + to add an idea, then tap an idea to go deeper. When you're ready, Convert to backlog turns the ideas you pick into actions.</p>
            <Lnk text="" link="How brainstorming works" @action="emit('help')" />
          </div>
          <p v-else-if="isRoot" class="text-body-s color-text-secondary dd-empty-text">
            {{ canvas.isOwner.value ? 'No ideas were added to this brainstorm.' : 'The project owner hasn\'t added any ideas yet.' }}
          </p>
          <p v-else class="text-body-s color-text-secondary dd-empty-text">
            {{ canvas.canEdit.value ? 'No ideas under this one yet. Tap + to add one.' : 'No ideas under this one.' }}
          </p>
        </template>
      </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div v-if="canvas.canEdit.value" class="dd-bar">
      <div class="dd-bar-group">
        <Btn variant="ghost" size="sm" :disabled="!canvas.canUndo.value" @mousedown.prevent @click="onUndo">Undo</Btn>
        <Btn variant="ghost" size="sm" :disabled="!canvas.canRedo.value" @mousedown.prevent @click="onRedo">Redo</Btn>
      </div>
      <div class="dd-bar-group">
        <Btn variant="secondary" size="sm" :disabled="isRoot" @click="emit('move', current.id)">Move to</Btn>
        <Btn variant="primary" title="Add idea" @mousedown.prevent @click="addNewRow"><PlusIcon class="dd-icon" /></Btn>
      </div>
    </div>

    <!-- Idea menu -->
    <Teleport to="body">
      <BottomSheet v-if="sheetNode" @close="sheetId = null">
        <div class="dd-sheet" data-testid="canvas-idea-menu">
          <button class="dropdown-item" @click="sheetAction(id => startEdit(id))">Edit</button>
          <button class="dropdown-item" @click="sheetAction(id => emit('move', id))">Move to…</button>
          <button v-if="sheetNode.converted" class="dropdown-item" @click="sheetAction(id => canvas.unmarkConverted(id))">Mark as not converted</button>
          <button class="dropdown-item dropdown-item--danger" @click="sheetAction(id => deleteIdea(id))">{{ deleteLabel(sheetNode.id) }}</button>
        </div>
      </BottomSheet>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Btn from '../Btn.vue'
import Lnk from '../Lnk.vue'
import BottomSheet from '../BottomSheet.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import PlusIcon from '../../assets/PlusIcon.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'
import TriangleLeftIcon from '../../assets/TriangleLeftIcon.vue'
import TriangleRightIcon from '../../assets/TriangleRightIcon.vue'
import { canvasModel, NODE_TEXT_LIMIT } from '../../scripts/models/canvasModel.js'
import { useSwipe, LONG_PRESS_MS } from '../../scripts/core/swipe.js'

const emit = defineEmits(['move', 'help'])

const MAX_DOTS = 7
const SWIPE_PX = 60
const TAP_MOVE_PX = 10

const canvas = canvasModel()

const swipeRef = ref(null)
const pathRef = ref(null)
const editorRef = ref(null)
const currentId = ref(null)
const editingId = ref(null)
const newRowId = ref(null)
const draft = ref('')
const sheetId = ref(null)

let swipeDx = 0
let longPress = null

const rootNode = computed(() => canvas.nodes.value.find(n => n.parent_id == null) || null)
const current = computed(() => canvas.getNode(currentId.value) || rootNode.value)
const isRoot = computed(() => !current.value || current.value.parent_id == null)
const ancestors = computed(() => current.value ? canvas.pathTo(current.value.id).slice(0, -1) : [])
const siblings = computed(() => isRoot.value ? [] : canvas.childrenOf(current.value.parent_id))
const siblingIndex = computed(() => siblings.value.indexOf(current.value))
const listChildren = computed(() => current.value ? canvas.childrenOf(current.value.id).filter(c => c.id !== newRowId.value) : [])
const sheetNode = computed(() => sheetId.value ? canvas.getNode(sheetId.value) : null)

function isBlank(node) {
  return node.parent_id != null && !node.text.trim()
}

function deleteLabel(id) {
  const n = canvas.descendantCount(id)
  return n ? `Delete with ${n} sub-ideas` : 'Delete'
}

function goTo(id) {
  endEdit()
  currentId.value = id
}

function goSibling(step) {
  const next = siblings.value[siblingIndex.value + step]
  if (next) goTo(next.id)
}

function onRowClick(child) {
  if (editingId.value === child.id) return
  goTo(child.id)
}

// ── Editing ──

function focusEditor() {
  nextTick(() => {
    const ta = Array.isArray(editorRef.value) ? editorRef.value[0] : editorRef.value
    if (!ta) return
    ta.focus()
    ta.selectionStart = ta.selectionEnd = ta.value.length
  })
}

function startEdit(id) {
  const node = canvas.getNode(id)
  if (!node || node.parent_id == null || !canvas.canEdit.value) return
  endEdit()
  draft.value = node.text
  editingId.value = id
  focusEditor()
}

function onEditorInput(e) {
  const clean = e.target.value.replace(/[\r\n]+/g, ' ')
  if (clean !== draft.value) draft.value = clean
}

function onEditorBlur(id) {
  if (editingId.value === id || newRowId.value === id) endEdit()
}

// Saves the open edit; an empty new row is dropped → true
function endEdit() {
  const text = draft.value.trim()
  if (newRowId.value) {
    const id = newRowId.value
    newRowId.value = null
    draft.value = ''
    if (text) canvas.setText(id, text, { merge: true })
    else canvas.discardNew(id)
    return !text
  }
  if (!editingId.value) return
  const id = editingId.value
  editingId.value = null
  draft.value = ''
  canvas.setText(id, text)
}

function addNewRow() {
  if (!current.value) return
  endEdit()
  const id = canvas.addChild(current.value.id)
  if (!id) return
  newRowId.value = id
  draft.value = ''
  focusEditor()
}

function onNewRowEnter() {
  if (!draft.value.trim()) {
    endEdit()
    return
  }
  addNewRow()
}

function deleteIdea(id) {
  const node = canvas.getNode(id)
  if (!node) return
  if (current.value && canvas.isInBranch(current.value.id, id)) currentId.value = node.parent_id
  canvas.removeNode(id)
}

// Dropping an open empty new row is the undo
function onUndo() {
  if (!endEdit()) canvas.undo()
}

function onRedo() {
  endEdit()
  canvas.redo()
}

// ── Menu ──

function openRowMenu(child) {
  if (!canvas.canEdit.value) return
  endEdit()
  sheetId.value = child.id
}

function sheetAction(run) {
  const id = sheetId.value
  sheetId.value = null
  run(id)
}

function onRowTouchStart(e, child) {
  if (!canvas.canEdit.value || editingId.value === child.id) return
  const t = e.touches[0]
  longPress = {
    x: t.clientX,
    y: t.clientY,
    fired: false,
    timer: setTimeout(() => {
      longPress.fired = true
      openRowMenu(child)
    }, LONG_PRESS_MS),
  }
}

function onRowTouchMove(e) {
  if (!longPress) return
  const t = e.touches[0]
  if (Math.hypot(t.clientX - longPress.x, t.clientY - longPress.y) > TAP_MOVE_PX) {
    clearTimeout(longPress.timer)
    longPress = null
  }
}

function onRowTouchEnd(e) {
  if (!longPress) return
  clearTimeout(longPress.timer)
  if (longPress.fired) e.preventDefault()
  longPress = null
}

// ── Swipe between siblings ──

useSwipe(swipeRef, {
  canStart: () => siblings.value.length > 1 && !editingId.value && !newRowId.value,
  onMove(dx) {
    swipeDx = dx
    return true
  },
  onEnd() {
    if (swipeDx <= -SWIPE_PX) goSibling(1)
    else if (swipeDx >= SWIPE_PX) goSibling(-1)
    swipeDx = 0
  },
})

watch(ancestors, () => {
  nextTick(() => {
    if (pathRef.value) pathRef.value.scrollLeft = pathRef.value.scrollWidth
  })
})

// An undo or a reload can remove the idea on screen
watch(() => canvas.nodes.value, () => {
  if (currentId.value && !canvas.getNode(currentId.value)) currentId.value = null
  if (editingId.value && !canvas.getNode(editingId.value)) editingId.value = null
  if (newRowId.value && !canvas.getNode(newRowId.value)) newRowId.value = null
  if (sheetId.value && !canvas.getNode(sheetId.value)) sheetId.value = null
  if (!canvas.canEdit.value) {
    editingId.value = null
    newRowId.value = null
    sheetId.value = null
  }
})
</script>

<style scoped>
.dd {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.dd-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 16px;
}

.dd-path {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none;
  margin-bottom: 8px;
}

.dd-path-segment {
  color: var(--color-text-secondary);
  cursor: pointer;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dd-current-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.dd-current-text-wrap {
  flex: 1;
  min-width: 0;
}

.dd-current-text {
  margin: 0;
  color: var(--color-text-primary);
  word-break: break-word;
}

.dd-blank {
  color: var(--color-text-secondary);
  font-style: italic;
}

.dd-editor {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--color-text-primary);
  field-sizing: content;
}

.dd-cap {
  margin: 4px 0 0;
}

.dd-converted {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.dd-check {
  width: 12px;
  height: 12px;
  color: var(--color-text-success);
  flex-shrink: 0;
}

.dd-icon {
  width: 18px;
  height: 18px;
}

.dd-siblings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.dd-dots {
  display: inline-flex;
  gap: 6px;
}

.dd-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border-medium);
}

.dd-dot--current {
  background: var(--color-action);
}

.dd-list {
  margin-top: 12px;
}

.dd-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--touch-target-min);
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  user-select: none;
  -webkit-touch-callout: none;
}

.dd-row:last-child {
  border-bottom: none;
}

.dd-row:hover {
  background: var(--color-bg-secondary);
}

.dd-row--new {
  cursor: default;
}

.dd-row-text {
  flex: 1;
  min-width: 0;
  color: var(--color-text-primary);
  word-break: break-word;
}

.dd-row-editor {
  flex: 1;
}

.dd-row-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.dd-chevron {
  color: var(--color-text-secondary);
}

.dd-empty {
  text-align: center;
  padding: 16px 0;
}

.dd-empty-title {
  margin: 0 0 8px;
  color: var(--color-text-primary);
}

.dd-empty-text {
  margin: 0 0 8px;
}

.dd-bar {
  position: sticky;
  bottom: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px calc(8px + env(safe-area-inset-bottom));
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border-light);
}

.dd-bar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dd-sheet {
  display: flex;
  flex-direction: column;
}
</style>
