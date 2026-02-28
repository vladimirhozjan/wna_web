<template>
  <div class="item-list">
    <!-- Loading state -->
    <div v-if="loading && items.length === 0" class="loading-state">
      <span class="loading-spinner"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="!loading && items.length === 0" class="empty-state">
      <slot name="empty" />
    </div>

    <template v-else>
    <!-- Draggable list -->
    <VueDraggable
        v-model="items"
        :delay="150"
        :delay-on-touch-only="true"
        :animation="150"
        :chosen-class="'item-wrapper-chosen'"
        :ghost-class="'item-wrapper-ghost'"
        :disabled="disabled"
        :class="{ 'item-list--dragging': isDragging }"
        @start="onDragStart"
        @end="onDragEnd"
    >
      <div
          v-for="(item, index) in items"
          :key="item.id"
          class="item-wrapper"
          :class="{
            'item-wrapper--active': activeId != null && activeId === item.id,
            'item-wrapper--dragging': nativeDraggingId === item.id,
            'item-wrapper--overdue': itemIsOverdue(item),
            'item-wrapper--wiggle': showHint && index === 0
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
            @update="(id, data) => emit('update', id, data)"
            @check="(id, checked) => emit('check', id, checked)"
            @click="onItemClick(item, index)"
        >
          <template v-if="$slots.prefix" #prefix>
            <slot name="prefix" :item="item" />
          </template>
          <template v-if="$slots.subtitle" #subtitle>
            <slot name="subtitle" :item="item" />
          </template>
          <template #actions>
            <slot name="actions" :item="item">
              <ActionBtn @click="emit('delete', item.id)" />
            </slot>
          </template>
        </Item>
      </div>
    </VueDraggable>
    </template>

    <!-- Drag hint (centered overlay) -->
    <div v-if="showHint && items.length >= 2" class="drag-hint">
      <span class="drag-hint__icon">↕</span>
      <span>Drag to reorder</span>
    </div>

    <!-- Load more -->
    <div class="load-more" v-if="hasMore && items.length > 0">
      <Btn
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="emit('load-more')"
      >
        Load more
      </Btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import Item from './Item.vue'
import Btn from './Btn.vue'
import ActionBtn from './ActionBtn.vue'
import { dragModel } from '../scripts/models/dragModel.js'
import { isOverdue } from '../scripts/core/dateUtils.js'

const props = defineProps({
  loading: { type: Boolean, default: false },
  hasMore: { type: Boolean, default: false },
  loadingIds: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  activeId: { type: [String, Number], default: null },
  editable: { type: Boolean, default: true },
  noCheckbox: { type: Boolean, default: false },
  sourceType: { type: String, default: null },
})

const drag = dragModel()
const nativeDraggingId = ref(null)

const emit = defineEmits(['update', 'check', 'click', 'delete', 'move', 'load-more'])

const items = defineModel({ type: Array, required: true })

const loadingIdSet = computed(() => new Set(props.loadingIds))

// Drag discoverability hint
const HINT_KEY = 'drag_hint_dismissed'
const showHint = ref(false)

onMounted(() => {
  if (!props.disabled && !localStorage.getItem(HINT_KEY)) {
    showHint.value = true
  }
})

function dismissHint() {
  showHint.value = false
  localStorage.setItem(HINT_KEY, '1')
}

function itemIsOverdue(item) {
  return isOverdue(item.due_date)
}

// Drag state
const isDragging = ref(false)
let draggedItemId = null
let originalIndex = null

function onItemClick(item, index) {
  if (isDragging.value) return
  emit('click', item, index)
}

function onDragStart(evt) {
  originalIndex = evt.oldIndex
  draggedItemId = items.value[evt.oldIndex]?.id
  isDragging.value = true
  if (showHint.value) dismissHint()

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
      state: item.state || null
    }))
  }
}

function onDragEnd(evt) {
  isDragging.value = false
  const newIndex = evt.newIndex

  if (originalIndex !== newIndex && draggedItemId) {
    emit('move', draggedItemId, newIndex)
  }

  draggedItemId = null
  originalIndex = null

  // Clear native drag state
  if (nativeDraggingId.value) {
    nativeDraggingId.value = null
    drag.endDrag()
  }
}

function onNativeDragStart(evt, item) {
  if (!props.sourceType) return

  nativeDraggingId.value = item.id
  drag.startDrag(item, props.sourceType)
  evt.dataTransfer.effectAllowed = 'move'
  evt.dataTransfer.setData('application/json', JSON.stringify({
    id: item.id,
    title: item.title,
    description: item.description || '',
    sourceType: props.sourceType,
    state: item.state || null
  }))
}

function onNativeDragEnd() {
  nativeDraggingId.value = null
  drag.endDrag()
}
</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.item-wrapper .item {
  -webkit-touch-callout: none;
  user-select: none;
  border-left: 3px solid transparent;
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
  background-color: var(--color-bg-hover);
  border-left-color: transparent;
}

.item-wrapper--dragging.item-wrapper--active .item {
  background-color: var(--color-bg-hover);
  border-left-color: transparent;
}

.item-wrapper-ghost .item {
  background-color: var(--color-btn-ghost-hover);
}

.item-wrapper-ghost .item > * {
  opacity: 0;
}

.load-more {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Drag hint overlay */
.item-list {
  position: relative;
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
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
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
</style>
