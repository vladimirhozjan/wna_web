<template>
  <div class="dd" data-testid="canvas-drilldown">
    <div ref="swipeRef" class="dd-content">
      <!-- Title -->
      <div v-if="current" class="dd-title-area">
        <textarea
            v-if="editingId === current.id"
            ref="editorRef"
            v-model="draft"
            class="text-h2 dd-title-input"
            :maxlength="NODE_TEXT_LIMIT"
            rows="1"
            enterkeyhint="done"
            @input="onEditorInput"
            @keydown.enter.prevent="endEdit"
            @keydown.esc.prevent="cancelEdit"
            @blur="onEditorBlur(current.id)"
        ></textarea>
        <h2
            v-else
            class="text-h2 dd-title dd-current-text"
            :class="{ 'dd-title--readonly': isRoot || !canvas.canEdit.value, 'dd-blank': isBlank(current) }"
            @click="startEdit(current.id)"
        >{{ canvas.displayText(current) }}</h2>
        <p v-if="editingId === current.id && draft.length >= NODE_TEXT_LIMIT" class="text-caption color-text-secondary dd-cap">
          Ideas can be up to {{ NODE_TEXT_LIMIT }} characters.
        </p>
        <span v-if="current.converted" class="text-footnote color-text-secondary dd-converted">
          <CheckIcon class="dd-check" /> In the backlog
        </span>
      </div>

      <!-- Root without ideas -->
      <div v-if="isRoot && !listChildren.length && !newRowId" class="dd-empty">
        <EmptyState
            v-if="canvas.canEdit.value"
            :icon="ProjectsIcon"
            title="Brainstorm this project"
            text="Get every idea out of your head — no order, no judging."
        >
          <Lnk text="" link="How brainstorming works" @action="emit('help')" />
        </EmptyState>
        <EmptyState
            v-else
            :icon="ProjectsIcon"
            title="No ideas yet"
            :text="canvas.isOwner.value ? 'No ideas were added to this brainstorm.' : 'The project owner hasn\'t added any ideas yet.'"
        />
      </div>

      <!-- Ideas -->
      <div v-else class="dd-section">
        <label class="text-body-s fw-semibold dd-section-label">Ideas</label>
        <div class="card dd-card">
          <Item
              v-for="child in listChildren"
              :key="child.id"
              :id="child.id"
              :title="canvas.displayText(child)"
              no-checkbox
              :editable="false"
              class="dd-row"
              @click="goTo(child.id)"
              @touchstart.passive="onRowTouchStart($event, child)"
              @touchmove.passive="onRowTouchMove"
              @touchend="onRowTouchEnd"
              @contextmenu.prevent="openRowMenu(child)"
          >
            <template #title>
              <template v-if="editingId === child.id">
                <textarea
                    ref="editorRef"
                    v-model="draft"
                    class="dd-editor dd-editor--inline"
                    :maxlength="NODE_TEXT_LIMIT"
                    rows="1"
                    enterkeyhint="done"
                    @click.stop
                    @input="onEditorInput"
                    @keydown.enter.prevent="endEdit"
                    @keydown.esc.prevent="cancelEdit"
                    @blur="onEditorBlur(child.id)"
                ></textarea>
                <p v-if="draft.length >= NODE_TEXT_LIMIT" class="text-caption color-text-secondary dd-cap">
                  Ideas can be up to {{ NODE_TEXT_LIMIT }} characters.
                </p>
              </template>
              <span v-else class="dd-row-text" :class="{ 'dd-blank': isBlank(child) }" @click="onRowTextClick($event, child.id)">{{ canvas.displayText(child) }}</span>
            </template>
            <template #actions>
              <span class="dd-row-meta">
                <CheckIcon v-if="child.converted" class="dd-check" />
                <span v-if="canvas.descendantCount(child.id) > 0" class="text-footnote color-text-secondary">{{ canvas.descendantCount(child.id) }}</span>
                <ChevronRightIcon class="dd-chevron" />
              </span>
            </template>
          </Item>

          <!-- New-idea row -->
          <div v-if="newRowId" class="dd-row-edit">
            <textarea
                ref="editorRef"
                v-model="draft"
                class="text-body-s dd-editor"
                :maxlength="NODE_TEXT_LIMIT"
                rows="1"
                enterkeyhint="next"
                placeholder="New idea"
                @input="onEditorInput"
                @keydown.enter.prevent="onNewRowEnter"
                @keydown.esc.prevent="cancelEdit"
                @blur="onEditorBlur(newRowId)"
            ></textarea>
            <p v-if="draft.length >= NODE_TEXT_LIMIT" class="text-caption color-text-secondary dd-cap">
              Ideas can be up to {{ NODE_TEXT_LIMIT }} characters.
            </p>
          </div>

          <p v-if="!listChildren.length && !newRowId" class="text-body-s color-text-secondary dd-card-empty">
            {{ canvas.canEdit.value ? 'No ideas under this one yet. Tap + to add one.' : 'No ideas under this one.' }}
          </p>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <button
          v-if="showFab"
          type="button"
          class="dd-fab"
          title="Add idea"
          data-testid="canvas-fab"
          @mousedown.prevent
          @click="addNewRow"
      >
        <PlusIcon width="20" height="20" />
      </button>

      <!-- Idea menu -->
      <BottomSheet v-if="sheetNode" @close="sheetId = null">
        <div class="dd-sheet" data-testid="canvas-idea-menu">
          <button class="dropdown-item" @click="sheetAction(id => startEdit(id))">Edit</button>
          <button class="dropdown-item" @click="sheetAction(id => emit('move', id))">Move to…</button>
          <button v-if="sheetNode.converted" class="dropdown-item" @click="sheetAction(id => canvas.unmarkConverted(id))">Mark as not converted</button>
          <button class="dropdown-item dropdown-item--danger" @click="sheetAction(id => emit('delete', id))">{{ deleteLabel(sheetNode.id) }}</button>
        </div>
      </BottomSheet>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import Lnk from '../Lnk.vue'
import Item from '../Item.vue'
import EmptyState from '../EmptyState.vue'
import BottomSheet from '../BottomSheet.vue'
import CheckIcon from '../../assets/CheckIcon.vue'
import PlusIcon from '../../assets/PlusIcon.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'
import { canvasModel, NODE_TEXT_LIMIT } from '../../scripts/models/canvasModel.js'
import { useSwipe, LONG_PRESS_MS } from '../../scripts/core/swipe.js'

const props = defineProps({
  currentId: { type: String, default: null },
})

const emit = defineEmits(['update:currentId', 'move', 'delete', 'help', 'sibling'])

const SWIPE_PX = 60
const TAP_MOVE_PX = 10

const canvas = canvasModel()

const swipeRef = ref(null)
const editorRef = ref(null)
const editingId = ref(null)
const newRowId = ref(null)
const draft = ref('')
const sheetId = ref(null)

let swipeDx = 0
let longPress = null

const rootNode = computed(() => canvas.nodes.value.find(n => n.parent_id == null) || null)
const current = computed(() => canvas.getNode(props.currentId) || rootNode.value)
const isRoot = computed(() => !current.value || current.value.parent_id == null)
const listChildren = computed(() => current.value ? canvas.childrenOf(current.value.id).filter(c => c.id !== newRowId.value) : [])
const sheetNode = computed(() => sheetId.value ? canvas.getNode(sheetId.value) : null)
const showFab = computed(() => canvas.canEdit.value && !editingId.value && !newRowId.value)

function isBlank(node) {
  return node.parent_id != null && !node.text.trim()
}

function deleteLabel(id) {
  const n = canvas.descendantCount(id)
  return n ? `Delete with ${n} sub-ideas` : 'Delete'
}

function goTo(id) {
  endEdit()
  emit('update:currentId', id)
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

// Like other lists: tapping the text edits, the rest of the row drills in
function onRowTextClick(e, id) {
  if (!canvas.canEdit.value) return
  e.stopPropagation()
  startEdit(id)
}

function onEditorInput(e) {
  const clean = e.target.value.replace(/[\r\n]+/g, ' ')
  if (clean !== draft.value) draft.value = clean
}

function onEditorBlur(id) {
  if (editingId.value === id || newRowId.value === id) endEdit()
}

// Saves the open edit; an empty new row is dropped
function endEdit() {
  const text = draft.value.trim()
  if (newRowId.value) {
    const id = newRowId.value
    newRowId.value = null
    draft.value = ''
    if (text) canvas.setText(id, text, { merge: true })
    else canvas.discardNew(id)
    return
  }
  if (!editingId.value) return
  const id = editingId.value
  editingId.value = null
  draft.value = ''
  canvas.setText(id, text)
}

function cancelEdit() {
  if (!newRowId.value) editingId.value = null
  draft.value = ''
  endEdit()
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
  if (!canvas.canEdit.value) return
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
  canStart: () => !isRoot.value && canvas.childrenOf(current.value.parent_id).length > 1 && !editingId.value && !newRowId.value,
  onMove(dx) {
    swipeDx = dx
    return true
  },
  onEnd() {
    if (swipeDx <= -SWIPE_PX) emit('sibling', 1)
    else if (swipeDx >= SWIPE_PX) emit('sibling', -1)
    swipeDx = 0
  },
})

// Header navigation (back, siblings) ends the open edit
watch(() => props.currentId, () => endEdit())

// An undo or a reload can remove the idea being edited
defineExpose({ editingId: () => editingId.value || newRowId.value })

watch(() => canvas.nodes.value, () => {
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
  padding-bottom: calc(100px + env(safe-area-inset-bottom));
}

.dd-title-area {
  position: relative;
  padding: 16px 16px 0 32px;
}

.dd-title {
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  line-height: var(--lh-normal);
  white-space: pre-wrap;
  word-break: break-word;
  cursor: pointer;
}

.dd-title--readonly {
  cursor: default;
}

.dd-title-input {
  display: block;
  width: calc(100% + 16px);
  margin: 0 0 0 -8px;
  padding: 5px 8px;
  border: 1px solid var(--color-input-border-focus);
  border-radius: 6px;
  box-shadow: var(--shadow-focus-ring);
  line-height: var(--lh-normal);
  box-sizing: border-box;
  outline: none;
  resize: none;
  overflow: hidden;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  field-sizing: content;
}

.dd-blank {
  color: var(--color-text-tertiary);
  font-style: italic;
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

.dd-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 16px;
}

.dd-section {
  padding: 12px 16px 12px 32px;
}

.dd-section-label {
  display: block;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.dd-card {
  margin-top: 4px;
}

.dd-card > :last-child {
  border-bottom: none;
}

/* Idea text wraps in full — rows never ellipsise */
.dd-card :deep(.item__title) {
  white-space: normal;
  word-break: break-word;
}

.dd-card :deep(.item__content) {
  flex: 1;
}

.dd-card :deep(.item__separator) {
  display: none;
}

/* The meta is a display: a tap anywhere on the row drills in */
.dd-card :deep(.item__actions) {
  pointer-events: none;
  opacity: 1;
}

.dd-row-text {
  color: var(--color-text-primary);
}

.dd-row-text.dd-blank {
  color: var(--color-text-tertiary);
}

.dd-row-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dd-chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
}

.dd-row-edit {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: var(--touch-target-min);
  box-sizing: border-box;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
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

/* Editing in place keeps the row's text metrics, so nothing shifts */
.dd-editor--inline {
  font: inherit;
  line-height: inherit;
}

.dd-card-empty {
  margin: 0;
  padding: 12px 16px;
}

.dd-fab {
  position: fixed;
  right: 16px;
  bottom: calc(18px + env(safe-area-inset-bottom));
  z-index: 899;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  border: none;
  background: var(--color-btn-primary-bg);
  color: var(--color-btn-primary-text);
  cursor: pointer;
  box-shadow: var(--shadow-fab);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.dd-fab:active {
  transform: scale(0.94);
}

.dd-fab :deep(svg) {
  pointer-events: none;
}

.dd-sheet {
  display: flex;
  flex-direction: column;
}
</style>
