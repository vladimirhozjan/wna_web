<template>
  <div
      :class="[
        'calendar-item',
        {
          'calendar-item--scheduled': isScheduled,
          'calendar-item--deferred': !isScheduled,
          'calendar-item--dragging': isDragging,
          'calendar-item--compact': compact,
        }
      ]"
      :draggable="draggable"
      @click="onClick"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
  >
    <span v-if="showTime && time" class="calendar-item__time">{{ time }}</span>
    <svg v-if="item.recurring_parent_id" class="calendar-item__recurring" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
    </svg>
    <span class="calendar-item__title">{{ item.title }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calendarModel } from '../../scripts/calendarModel.js'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  showTime: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'drag-start', 'drag-end'])

const calendar = calendarModel()
const isDragging = ref(false)

const isScheduled = computed(() => calendar.isScheduledItem(props.item))
const time = computed(() => calendar.getItemTime(props.item))

function onClick(e) {
  e.stopPropagation()
  emit('click', props.item)
}

function onDragStart(e) {
  isDragging.value = true
  e.dataTransfer.setData('text/plain', JSON.stringify({
    id: props.item.id,
    type: 'calendar-item'
  }))
  e.dataTransfer.effectAllowed = 'move'
  emit('drag-start', props.item)
}

function onDragEnd(e) {
  isDragging.value = false
  emit('drag-end', props.item)
}
</script>

<style scoped>
.calendar-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  line-height: 1.3;
  cursor: grab;
  transition: opacity 0.15s, transform 0.15s;
  overflow: hidden;
  border-left: 3px solid transparent;
  user-select: none;
  box-sizing: border-box;
}

.calendar-item:active {
  cursor: grabbing;
}

.calendar-item--scheduled {
  background: var(--color-calendar-scheduled);
  border-left-color: var(--color-calendar-scheduled-border);
  color: var(--color-calendar-scheduled-text);
}

.calendar-item--deferred {
  background: var(--color-calendar-deferred);
  border-left-color: var(--color-calendar-deferred-border);
  color: var(--color-calendar-deferred-text);
}

.calendar-item:hover {
  opacity: 0.85;
}

.calendar-item--dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.calendar-item--compact {
  padding: 2px 6px;
  font-size: var(--font-size-footnote);
}

.calendar-item__time {
  font-weight: 600;
  flex-shrink: 0;
}

.calendar-item__recurring {
  flex-shrink: 0;
  opacity: 0.6;
}

.calendar-item__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
