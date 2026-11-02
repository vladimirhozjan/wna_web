<template>
  <div
      ref="rootEl"
      class="item-list"
      :class="{ 'item-list--has-more': hasMore, 'item-list--drop-target': showDropTarget }"
      @dragover="onExternalDragOver"
      @dragenter="onExternalDragEnter"
      @dragleave="onExternalDragLeave"
      @drop="onExternalDrop"
  >
    <!-- Loading state -->
    <div v-if="loading && items.length === 0 && !leaveHold" class="loading-state">
      <Spinner :size="32" delayed />
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && (items.length === 0 || arriveHold) && !leaveHold" ref="emptyEl" class="empty-state">
      <slot name="empty" />
    </div>

    <template v-else>
    <!-- Draggable list -->
    <VueDraggable
        v-model="items"
        :delay="LONG_PRESS_MS"
        :delay-on-touch-only="true"
        :animation="150"
        :chosen-class="'item-wrapper-chosen'"
        :ghost-class="'item-wrapper-ghost'"
        :disabled="disabled"
        :sort="reorderable"
        :class="{ 'item-list--dragging': isDragging, 'item-list--has-more': hasMore }"
        @start="onDragStart"
        @end="onDragEnd"
    >
      <div
          v-for="(item, index) in items"
          :key="item.id"
          class="item-wrapper"
          :data-row-id="item.id"
          :data-testid="rowTestid"
          :data-id="rowTestid ? item.id : undefined"
          :class="{
            'item-wrapper--active': activeId != null && activeId === item.id,
            'item-wrapper--dragging': nativeDraggingId === item.id,
            'item-wrapper--overdue': itemIsOverdue(item),
            'item-wrapper--wiggle': showHint && index === 0 && items.length >= 3,
            'item-wrapper--completing': completingIdSet.has(item.id)
          }"
          :draggable="!!sourceType && !disabled"
          @dragstart.capture="onNativeDragStart($event, item)"
          @dragend.capture="onNativeDragEnd"
      >
        <Item
            :id="item.id"
            :title="item.title"
            :loading="loadingIdSet.has(item.id)"
            :checked="item.checked"
            :editable="editable"
            :no-hover="isDragging"
            :no-checkbox="noCheckbox"
            :no-initial-animation="noInitialAnimation"
            :checkbox-disabled="checkboxDisabled"
            :swipe-right="swipeFor(item, swipeRight)"
            :swipe-left="swipeFor(item, swipeLeft)"
            @update="(id, data) => emit('update', id, data)"
            @check="(id, checked) => emit('check', id, checked)"
            @swipe-right="id => emit('swipe-right', id)"
            @swipe-left="id => emit('swipe-left', id)"
            @click="onItemClick(item, index)"
        >
          <template v-if="$slots.prefix" #prefix>
            <slot name="prefix" :item="item" />
          </template>
          <template v-if="$slots['title-suffix']" #title-suffix>
            <slot name="title-suffix" :item="item" />
          </template>
          <template v-if="$slots.subtitle" #subtitle>
            <slot name="subtitle" :item="item" />
          </template>
          <template #actions>
            <slot name="actions" :item="item">
              <ActionBtn v-if="!noDefaultAction" @click="emit('delete', item.id)" />
            </slot>
          </template>
        </Item>
      </div>
    </VueDraggable>
    </template>

    <!-- Drag hint (centered overlay) -->
    <div v-if="showHint && items.length >= 3" class="text-body-m drag-hint">
      <span class="drag-hint__icon">↕</span>
      <span>{{ isTouch ? 'Hold to reorder' : 'Drag to reorder' }}</span>
    </div>

    <!-- Load more -->
    <div class="load-more" v-if="hasMore && items.length > 0">
      <Btn
          variant="secondary"
          size="sm"
          :loading="loading"
          :disabled="disabled"
          @click="emit('load-more')"
      >
        Load more
      </Btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import Item from './Item.vue'
import Btn from './Btn.vue'
import ActionBtn from './ActionBtn.vue'
import { dragModel } from '../scripts/models/dragModel.js'
import { isOverdue, isScheduledOverdue } from '../scripts/core/dateUtils.js'
import Spinner from './Spinner.vue'
import { hapticFeedback } from '../scripts/core/haptics.js'
import { LONG_PRESS_MS } from '../scripts/core/swipe.js'
import { liveClient, onLivePacket } from '../scripts/core/liveClient.js'
import { useLiveMotion, MOTION_MS } from '../scripts/core/liveMotion.js'

const props = defineProps({
  loading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  loadingIds: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  // false disables in-list reorder but keeps items draggable OUT (native HTML5 to sidebar targets)
  reorderable: { type: Boolean, default: true },
  activeId: { type: [String, Number], default: null },
  editable: { type: Boolean, default: true },
  noCheckbox: { type: Boolean, default: false },
  sourceType: { type: String, default: null },
  completingIds: { type: Array, default: () => [] },
  acceptDrop: { type: Array, default: () => [] },
  noInitialAnimation: { type: Boolean, default: false },
  // Independent of disabled (drag): rows whose checkbox can't be ticked
  checkboxDisabled: { type: Boolean, default: false },
  // No default × when the page's actions slot renders nothing (read-only rows)
  noDefaultAction: { type: Boolean, default: false },
  swipeRight: { type: String, default: null },
  swipeLeft: { type: String, default: null },
  swipeFilter: { type: Function, default: null },
  // ui-tests hook: each row gets this data-testid plus data-id = the item id
  rowTestid: { type: String, default: undefined },
})

const drag = dragModel()
const nativeDraggingId = ref(null)

const emit = defineEmits(['update', 'check', 'click', 'delete', 'move', 'load-more', 'external-drop', 'swipe-right', 'swipe-left'])

const items = defineModel({ type: Array, required: true })

const rootEl = ref(null)
const emptyEl = ref(null)

// A row completed elsewhere leaves with the completion exit, as the user's own; the list re-reads after it and
// the row keeps its exit look until that re-read lands
const COMPLETE_EXIT_MS = 800
const liveCompletingIds = ref([])
let exitedIds = []

onLivePacket(changes => {
  const done = new Set((changes || []).filter(c => c.change === 'completed' && c.tab !== liveClient.tabId).map(c => c.id))
  const rows = items.value.filter(i => done.has(i.id) && !i.checked)
  if (!rows.length) return
  rows.forEach(i => { i.checked = true })
  const ids = rows.map(i => i.id)
  liveCompletingIds.value = [...liveCompletingIds.value, ...ids]
  liveClient.hold()
  setTimeout(() => {
    exitedIds.push(...ids)
    liveClient.release()
  }, COMPLETE_EXIT_MS)
})

const loadingIdSet = computed(() => new Set(props.loadingIds))
const completingIdSet = computed(() => new Set([...props.completingIds, ...liveCompletingIds.value]))

// Rows on screen keep their place when rows above them come or go
function scrollParent(el) {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const overflowY = getComputedStyle(p).overflowY
    if ((overflowY === 'auto' || overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p
  }
  return document.scrollingElement
}

watch(() => items.value, () => {
  if (isDragging.value || !rootEl.value) return
  const scroller = scrollParent(rootEl.value)
  if (!scroller || scroller.scrollTop === 0) return
  const viewTop = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top
  const anchor = [...rootEl.value.querySelectorAll('[data-row-id]')].find(el => el.getBoundingClientRect().bottom > viewTop)
  if (!anchor) return
  const id = anchor.dataset.rowId
  const before = anchor.getBoundingClientRect().top
  nextTick(() => {
    const row = rootEl.value?.querySelector(`[data-row-id="${CSS.escape(id)}"]`)
    if (row) scroller.scrollTop += row.getBoundingClientRect().top - before
  })
}, { flush: 'pre' })

// Foreign live changes animate (after the anchoring above); the empty state never shows under a leaving row and
// fades out before a first row arrives
const leaveHold = ref(false)
const arriveHold = ref(false)
const motion = useLiveMotion(rootEl, () => (arriveHold.value ? null : items.value), { skip: () => completingIdSet.value })

watch(() => items.value, (now, before) => {
  if (exitedIds.length) {
    const ids = exitedIds
    exitedIds = []
    nextTick(() => { liveCompletingIds.value = liveCompletingIds.value.filter(id => !ids.includes(id)) })
  }
  if (!liveClient.motion.active || !before) return
  if (!now.length && before.some(i => !completingIdSet.value.has(i.id))) {
    leaveHold.value = true
    setTimeout(() => {
      leaveHold.value = false
      nextTick(() => emptyEl.value?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MOTION_MS }))
    }, MOTION_MS)
  } else if (now.length && !before.length && emptyEl.value && !leaveHold.value) {
    arriveHold.value = true
    emptyEl.value.animate([{ opacity: 1 }, { opacity: 0 }], { duration: MOTION_MS, fill: 'forwards' }).onfinish = () => {
      motion.force()
      arriveHold.value = false
    }
  }
}, { flush: 'pre' })

// A drag holds live updates so no row moves under the pointer; they apply on drop
let dragHeld = false
function holdForDrag(on) {
  if (on === dragHeld) return
  dragHeld = on
  if (on) liveClient.hold()
  else liveClient.release()
}
onBeforeUnmount(() => holdForDrag(false))

// Drag discoverability hint
const HINT_KEY = 'drag_hint_dismissed'
const showHint = ref(false)
const isTouch = window.matchMedia('(pointer: coarse)').matches

onMounted(() => {
  if (!props.disabled && props.reorderable && !localStorage.getItem(HINT_KEY)) {
    showHint.value = true
  }
})

function dismissHint() {
  showHint.value = false
  localStorage.setItem(HINT_KEY, '1')
}

function itemIsOverdue(item) {
  // an item carries at most one of due_date / scheduled_date, so the OR can't double-fire
  if (isOverdue(item.due_date)) return true
  return isScheduledOverdue(item.scheduled_date, item.scheduled_time, item.scheduled_duration)
}

// Drag state
const isDragging = ref(false)
let draggedItemId = null
let originalIndex = null

function swipeFor(item, action) {
  if (!action || isDragging.value) return null
  if (props.swipeFilter && !props.swipeFilter(item)) return null
  return action
}

function onItemClick(item, index) {
  if (isDragging.value) return
  emit('click', item, index)
}

function onDragStart(evt) {
  originalIndex = evt.oldIndex
  draggedItemId = items.value[evt.oldIndex]?.id
  isDragging.value = true
  holdForDrag(true)
  if (showHint.value) dismissHint()
  hapticFeedback()

  // Set native drag data for cross-component drops
  const item = items.value[evt.oldIndex]
  if (props.sourceType && item && evt.originalEvent?.dataTransfer) {
    nativeDraggingId.value = item.id
    drag.startDrag(item, props.sourceType)
    evt.originalEvent.dataTransfer.effectAllowed = 'move'
    evt.originalEvent.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      title: item.title,
      description: item.description || '',
      sourceType: props.sourceType,
      state: item.state || null,
      type: item.type || null,
      project_shared: !!item.project_shared,
      shared: !!item.shared
    }))
  }
}

function onDragEnd(evt) {
  const newIndex = evt.newIndex

  if (originalIndex !== newIndex && draggedItemId && !drag.state.droppedExternally) {
    emit('move', draggedItemId, newIndex)
  }

  draggedItemId = null
  originalIndex = null

  if (nativeDraggingId.value) {
    nativeDraggingId.value = null
    drag.endDrag()
  }

  // Delay clearing drag state to prevent hover flash on adjacent items after drop
  setTimeout(() => {
    isDragging.value = false
    holdForDrag(false)
  }, 50)
}

function onNativeDragStart(evt, item) {
  // Don't start native drag when inline-editing text
  if (evt.currentTarget.querySelector('.item--editing')) {
    evt.preventDefault()
    return
  }
  if (!props.sourceType) return

  holdForDrag(true)
  nativeDraggingId.value = item.id
  drag.startDrag(item, props.sourceType)
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('application/json', JSON.stringify({
    id: item.id,
    title: item.title,
    description: item.description || '',
    sourceType: props.sourceType,
    state: item.state || null,
    type: item.type || null,
    project_shared: !!item.project_shared,
    shared: !!item.shared
  }))
}

function onNativeDragEnd() {
  nativeDraggingId.value = null
  drag.endDrag()
  if (!isDragging.value) holdForDrag(false)
}

// Cross-list drop support
const isOverDrop = ref(false)

const canAcceptDrop = computed(() => {
  if (!props.acceptDrop.length) return false
  if (!drag.state.isDragging) return false
  if (!props.acceptDrop.includes(drag.state.sourceType)) return false
  // Don't show drop target if dragged item belongs to this list
  const draggedId = drag.state.draggedItem?.id
  return !(draggedId && items.value.some(i => i.id === draggedId))
})

const showDropTarget = computed(() => isOverDrop.value && canAcceptDrop.value)

function onExternalDragOver(e) {
  if (!canAcceptDrop.value) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onExternalDragEnter(e) {
  if (!canAcceptDrop.value) return
  e.preventDefault()
  isOverDrop.value = true
}

function onExternalDragLeave(e) {
  if (!e.currentTarget.contains(e.relatedTarget)) {
    isOverDrop.value = false
  }
}

function onExternalDrop(e) {
  isOverDrop.value = false
  if (!canAcceptDrop.value) return
  e.preventDefault()
  drag.markExternalDrop()
  try {
    const data = JSON.parse(e.dataTransfer.getData('application/json'))
    // Don't emit if dropping back into the same list
    if (items.value.some(i => i.id === data.id)) return
    emit('external-drop', data)
  } catch {}
}
</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.item-wrapper .item {
  -webkit-touch-callout: none;
  user-select: none;
  border-left: 3px solid transparent;
}

:deep(.item-wrapper:last-child .item) {
  border-bottom: none;
}

.item-wrapper--active .item {
  background-color: var(--color-bg-secondary);
  border-left-color: var(--color-action);
}

.item-wrapper--overdue .item {
  border-left-color: var(--color-danger);
  background-color: var(--color-danger-bg-subtle);
}

.item-wrapper--overdue.item-wrapper--active .item {
  border-left-color: var(--color-danger);
  background-color: var(--color-bg-secondary);
}

.item-wrapper-chosen .item,
.item-wrapper--dragging .item {
  background-color: var(--color-bg-row-hover);
  border-left-color: transparent;
}

.item-wrapper--dragging.item-wrapper--active .item {
  background-color: var(--color-bg-row-hover);
  border-left-color: transparent;
}

.item-wrapper-ghost .item {
  background-color: var(--color-btn-secondary-hover);
}

.item-wrapper-ghost .item > * {
  opacity: 0;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--color-border-subtle);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--card-radius);
  box-shadow: var(--shadow-card);
}

/* Spinner sits on the centre of the empty-state coin */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 129px 24px 48px;
}

@media (max-width: 768px) {
  .loading-state {
    padding-top: 109px;
  }
}


/* Drag hint overlay */
.item-list {
  position: relative;
}

.item-list--drop-target {
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
  border-radius: 8px;
  background: var(--color-bg-accent-light);
}

.drag-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-text-tertiary);
  pointer-events: none;
  opacity: 0;
  animation: hint-show 5s ease 0.4s forwards;
}

.drag-hint__icon {
  font-size: var(--font-size-3xl);
  line-height: var(--lh-none);
}

@keyframes hint-show {
  5%   { opacity: 1; }
  85%  { opacity: 1; }
  100% { opacity: 0; }
}

/* Wiggle animation on first item */
.item-wrapper--wiggle {
  animation: wiggle 0.5s ease-in-out 0.3s 1;
}

@keyframes wiggle {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

/* Completion exit animation */
.item-wrapper--completing {
  animation: item-complete-out 0.4s ease 0.35s forwards;
  pointer-events: none;
}

@keyframes item-complete-out {
  0% {
    opacity: 1;
    transform: translateX(0);
    max-height: 80px;
  }
  60% {
    opacity: 0;
    transform: translateX(20px);
    max-height: 80px;
  }
  100% {
    opacity: 0;
    transform: translateX(20px);
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin-top: 0;
    margin-bottom: 0;
  }
}
</style>
