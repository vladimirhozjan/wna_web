<template>
  <div
      :class="[
        'text-footnote calendar-item',
        `calendar-item--${displayClass}`,
        {
          'calendar-item--dragging': isDragging,
          'calendar-item--compact': compact,
        }
      ]"
      :draggable="draggable"
      @click="onClick"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
  >
    <span v-if="showTime && time" class="fw-semibold calendar-item__time">{{ time }}</span>
    <RecurringIcon v-if="item.recurring_parent_id" class="calendar-item__recurring" width="12" height="12" />
    <span class="calendar-item__title">{{ item.title }}</span>
    <div v-if="resizable" class="calendar-item__resize" @mousedown.stop.prevent="onResizeStart"></div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calendarModel } from '../../scripts/models/calendarModel.js'
import RecurringIcon from '../../assets/RecurringIcon.vue'

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
  },
  resizable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click', 'drag-start', 'drag-end', 'resize-start'])

const calendar = calendarModel()
const isDragging = ref(false)
let suppressClick = false

const displayType = computed(() => calendar.getItemDisplayType(props.item))
const isOverdueItem = computed(() => calendar.isItemOverdue(props.item))

const displayClass = computed(() => {
  // Overdue first: timed scheduled slots report displayType 'scheduled' (never 'due'), so a due-only guard can't redden them.
  if (isOverdueItem.value) return 'overdue'
  if (displayType.value === 'due') return 'due'
  if (displayType.value === 'start') return 'start'
  return 'scheduled'
})

const time = computed(() => calendar.getItemTime(props.item))

function onClick(e) {
  e.stopPropagation()
  if (suppressClick) return
  emit('click', props.item)
}

function onResizeStart(e) {
  // The click that follows the resize mouseup must not open the detail page
  suppressClick = true
  document.addEventListener('mouseup', () => setTimeout(() => { suppressClick = false }, 0), { once: true })
  emit('resize-start', props.item, e)
}

function onDragStart(e) {
  isDragging.value = true
  e.dataTransfer.setData('text/plain', JSON.stringify({
    id: props.item.id,
    type: 'calendar-item',
    hasScheduledDate: !!props.item.scheduled_date,
    hasStartDate: !!props.item.start_date,
    hasDueDate: !!props.item.due_date,
  }))
  e.dataTransfer.effectAllowed = 'move'
  // Offset of the grab point from the block's top edge, so drop previews follow the block, not the pointer
  emit('drag-start', props.item, e.clientY - e.currentTarget.getBoundingClientRect().top)
}

function onDragEnd() {
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
  line-height: var(--lh-snug);
  cursor: grab;
  transition: opacity 0.15s, transform 0.15s;
  overflow: hidden;
  border-left: 3px solid transparent;
  user-select: none;
  box-sizing: border-box;
  position: relative;
}

.calendar-item__resize {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6px;
  cursor: ns-resize;
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

.calendar-item--start {
  background: var(--color-calendar-start);
  border-left-color: var(--color-calendar-start-border);
  color: var(--color-calendar-start-text);
}

.calendar-item--due {
  background: var(--color-calendar-due);
  border-left-color: var(--color-calendar-due-border);
  color: var(--color-calendar-due-text);
}

.calendar-item--overdue {
  background: var(--color-calendar-overdue);
  border-left-color: var(--color-calendar-overdue-border);
  color: var(--color-calendar-overdue-text);
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
}

.calendar-item__time {
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
