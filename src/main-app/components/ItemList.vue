<template>
  <div class="item-list">
    <!-- Empty state -->
    <div v-if="!loading && items.length === 0" class="empty-state">
      <slot name="empty" />
    </div>

    <!-- Draggable list -->
    <VueDraggable
        v-else
        v-model="items"
        :delay="100"
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
            'item-wrapper--dragging': nativeDraggingId === item.id
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
          <template #actions>
            <slot name="actions" :item="item">
              <button class="action-btn action-btn--danger" @click="emit('delete', item.id)">✕</button>
            </slot>
          </template>
        </Item>
      </div>
    </VueDraggable>

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
import { ref, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import Item from './Item.vue'
import Btn from './Btn.vue'
import { dragModel } from '../scripts/dragModel.js'

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
      sourceType: props.sourceType
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
    sourceType: props.sourceType
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
}

.item-wrapper--active .item {
  background-color: var(--color-bg-secondary);
  border-left: 3px solid var(--color-action);
}

.item-wrapper-chosen .item,
.item-wrapper--dragging .item {
  background-color: var(--color-bg-hover);
  border-left: none;
}

.item-wrapper--dragging.item-wrapper--active .item {
  background-color: var(--color-bg-hover);
  border-left: none;
}

.item-wrapper-ghost .item {
  background-color: var(--color-btn-ghost-hover);
}

.item-wrapper-ghost .item > * {
  opacity: 0;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn--danger {
  color: var(--color-danger);
}

.action-btn--danger:hover {
  background: var(--color-danger-light);
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
</style>
