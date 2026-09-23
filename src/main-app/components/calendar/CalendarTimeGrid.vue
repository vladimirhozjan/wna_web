<template>
  <div class="time-grid" ref="gridRef" @dragend="onGridDragEnd">
    <!-- Hour rows -->
    <div
        v-for="hour in hours"
        :key="hour"
        :class="['time-grid__row', { 'time-grid__row--outside-business': !isBusinessHour(hour) }]"
        :style="{ height: hourHeight + 'px' }"
    >
      <div class="text-footnote time-grid__label">
        {{ formatHour(hour) }}
      </div>
      <div class="time-grid__cell-container">
        <!-- First half (:00) -->
        <div
            class="time-grid__cell"
            @click="onCellClick(hour, 0)"
            @mousedown="onCellMouseDown"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
        ></div>
        <!-- Second half (:30) -->
        <div
            class="time-grid__cell time-grid__cell--half"
            @click="onCellClick(hour, 30)"
            @mousedown="onCellMouseDown"
            @dragover.prevent="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
        ></div>
      </div>
    </div>

    <!-- Slot preview: drop target while dragging, or drag-to-create selection -->
    <div
        v-if="slotPreview"
        class="time-grid__slot-preview"
        :style="{ top: slotPreview.top + 'px', height: slotPreview.height + 'px' }"
    ></div>

    <!-- Quick-add form, sized like the block it will create -->
    <div
        v-if="quickFormSlot"
        class="time-grid__slot-preview time-grid__quick-form"
        :style="{ top: minutesToPx(quickFormSlot.minutes) + 'px', height: minutesToPx(Math.max(quickFormSlot.duration || 30, 30)) + 'px' }"
    >
      <CalendarQuickForm
          :date="date"
          :time="quickFormSlot.time"
          :duration="quickFormSlot.duration"
          @submit="onQuickFormSubmit"
          @cancel="onQuickFormCancel"
      />
    </div>

    <!-- Items layer -->
    <div class="time-grid__items">
      <div
          v-for="item in positionedItems"
          :key="item.id"
          class="time-grid__item-wrapper"
          :style="{
            top: item.top + 'px',
            height: item.height + 'px',
            left: (item.column / item.totalColumns * 100) + '%',
            width: (100 / item.totalColumns) + '%',
          }"
          @dragover.prevent="onDragOver"
          @drop="onDrop"
      >
        <CalendarItem
            :item="item"
            :show-time="true"
            :resizable="!!item.scheduled_time"
            @click="onItemClick"
            @drag-start="(item, offsetY) => $emit('drag-start', item, offsetY)"
            @drag-end="$emit('drag-end', $event)"
            @resize-start="onResizeStart"
        />
      </div>
    </div>

    <!-- Start date indicators -->
    <div
        v-for="item in startIndicators"
        :key="`start-${item.id}`"
        class="time-grid__indicator time-grid__indicator--start"
        :style="{ top: item.top + 'px' }"
    >
      <div class="time-grid__indicator-rule"></div>
      <div class="time-grid__indicator-body">
        <div class="text-footnote time-grid__indicator-label" @click.stop="onItemClick(item)">
          {{ item.title }}
        </div>
      </div>
    </div>

    <!-- Due date indicators -->
    <div
        v-for="item in dueIndicators"
        :key="`due-${item.id}`"
        class="time-grid__indicator time-grid__indicator--due"
        :style="{ top: item.top + 'px' }"
    >
      <div class="time-grid__indicator-body">
        <div class="text-footnote time-grid__indicator-label" @click.stop="onItemClick(item)">
          {{ item.title }}
        </div>
      </div>
      <div class="time-grid__indicator-rule"></div>
    </div>

    <!-- Current time indicator -->
    <div
        v-if="showCurrentTime && currentTimePosition !== null"
        class="time-grid__now"
        :style="{ top: currentTimePosition + 'px' }"
    >
      <div class="time-grid__now-dot"></div>
      <div class="time-grid__now-line"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isToday, parseISO } from '../../scripts/core/dateUtils.js'
import { calendarModel } from '../../scripts/models/calendarModel.js'
import { layoutOverlappingItems } from '../../scripts/core/calendarLayout.js'
import CalendarItem from './CalendarItem.vue'
import CalendarQuickForm from './CalendarQuickForm.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  date: {
    type: String,
    required: true
  },
  hourHeight: {
    type: Number,
    default: 60
  },
  draggingItem: {
    type: Object,
    default: null
  },
  dragOffset: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['item-click', 'create', 'reschedule', 'resize', 'drag-start', 'drag-end'])

const calendar = calendarModel()
const gridRef = ref(null)
const quickFormSlot = ref(null)
const dragOverMinutes = ref(null)
const selection = ref(null)
const resizing = ref(null)
const currentTimePosition = ref(null)
let timeUpdateInterval = null
let suppressClick = false

const hours = Array.from({ length: 24 }, (_, i) => i)

const calendarSettings = computed(() => calendar.getCalendarSettings())

const slotPreview = computed(() => {
  if (selection.value) {
    const { start, end } = selection.value
    return { top: minutesToPx(start), height: minutesToPx(end - start) }
  }
  if (dragOverMinutes.value !== null) {
    return { top: minutesToPx(dragOverMinutes.value), height: minutesToPx(props.draggingItem?.duration || 60) }
  }
  return null
})

const showCurrentTime = computed(() => {
  try {
    return isToday(parseISO(props.date))
  } catch {
    return false
  }
})

const positionedItems = computed(() => {
  const minHeight = props.hourHeight / 4  // 15 minutes minimum
  const defaultDuration = 15  // 15 minutes default

  const items = props.items
      .filter(item => item._displayReason !== 'start' && item._displayReason !== 'due' && calendar.hasTime(item))
      .map(item => {
        const time = calendar.getItemTime(item)
        const [hours, minutes] = time.split(':').map(Number)
        const top = (hours * props.hourHeight) + (minutes / 60) * props.hourHeight

        const duration = (resizing.value?.id === item.id ? resizing.value.duration : item.duration) || defaultDuration
        const durationHeight = (duration / 60) * props.hourHeight
        const height = Math.max(minHeight, durationHeight) - 2  // -2 for visual spacing

        return {
          ...item,
          top,
          height,
        }
      })

  return layoutOverlappingItems(items)
})

function computeIndicatorPosition(item) {
  const time = calendar.getItemTime(item)
  const [h, m] = time.split(':').map(Number)
  return (h * props.hourHeight) + (m / 60) * props.hourHeight
}

const startIndicators = computed(() => {
  return props.items
      .filter(item => item._displayReason === 'start' && calendar.hasTime(item))
      .map(item => ({ ...item, top: computeIndicatorPosition(item) }))
})

const dueIndicators = computed(() => {
  return props.items
      .filter(item => item._displayReason === 'due' && calendar.hasTime(item))
      .map(item => ({ ...item, top: computeIndicatorPosition(item) }))
})

function formatHour(hour) {
  return calendar.formatHour(hour, calendarSettings.value.timeFormat)
}

function isBusinessHour(hour) {
  return calendar.isBusinessHour(hour, calendarSettings.value)
}

function formatTimeSlot(hour, minutes) {
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function minutesToPx(minutes) {
  return (minutes / 60) * props.hourHeight
}

function minutesFromY(clientY) {
  const gridRect = gridRef.value.getBoundingClientRect()
  return ((clientY - gridRect.top + gridRef.value.scrollTop) / props.hourHeight) * 60
}

// Start of the 15-minute slot under the pointer
function slotFromY(clientY) {
  return Math.max(0, Math.min(24 * 60 - 15, Math.floor(minutesFromY(clientY) / 15) * 15))
}

function openQuickForm(minutes, duration = null) {
  quickFormSlot.value = { minutes, time: formatTimeSlot(Math.floor(minutes / 60), minutes % 60), duration }
}

function onCellClick(hour, half) {
  if (suppressClick) return
  openQuickForm(hour * 60 + half)
}

function onCellMouseDown(event) {
  if (event.button !== 0) return
  event.preventDefault()
  const start = slotFromY(event.clientY)

  const onMove = (e) => {
    const current = slotFromY(e.clientY)
    if (current === start && !selection.value) return
    selection.value = { start: Math.min(start, current), end: Math.max(start, current) + 15 }
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    const sel = selection.value
    selection.value = null
    if (!sel) return
    // The click that follows this mouseup must not reopen the form without duration
    suppressClick = true
    setTimeout(() => { suppressClick = false }, 0)
    openQuickForm(sel.start, sel.end - sel.start)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onResizeStart(item) {
  const [h, m] = item.scheduled_time.split(':').map(Number)
  const start = h * 60 + m

  const onMove = (e) => {
    const end = Math.min(24 * 60, Math.max(start + 15, Math.round(minutesFromY(e.clientY) / 15) * 15))
    const duration = end - start
    if (resizing.value?.duration !== duration) resizing.value = { id: item.id, duration }
  }
  const onUp = () => {
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    const duration = resizing.value?.duration
    resizing.value = null
    if (duration && duration !== item.duration) {
      emit('resize', { actionId: item.id, date: item.scheduled_date, time: item.scheduled_time, duration })
    }
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onItemClick(item) {
  emit('item-click', item)
}

function onQuickFormSubmit(data) {
  emit('create', data)
  quickFormSlot.value = null
}

function onQuickFormCancel() {
  quickFormSlot.value = null
}

function onDragOver(event) {
  const minutes = slotFromY(event.clientY - props.dragOffset)
  if (dragOverMinutes.value !== minutes) dragOverMinutes.value = minutes
}

function onDragLeave() {
  // Don't clear here - dragover on new cell will update, drop/dragend will clear
}

function onGridDragEnd() {
  dragOverMinutes.value = null
}

function onDrop(event) {
  event.preventDefault()
  const minutes = slotFromY(event.clientY - props.dragOffset)
  dragOverMinutes.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      const newTime = formatTimeSlot(Math.floor(minutes / 60), minutes % 60)
      emit('reschedule', {
        actionId: data.id,
        newDate: props.date,
        newTime,
        hasDueDate: data.hasDueDate,
        hasScheduledDate: data.hasScheduledDate,
        hasStartDate: data.hasStartDate,
        dropX: event.clientX,
        dropY: event.clientY,
      })
    }
  } catch (e) {
    // Ignore parse errors
  }
}

function updateCurrentTime() {
  if (!showCurrentTime.value) {
    currentTimePosition.value = null
    return
  }

  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  currentTimePosition.value = (hours * props.hourHeight) + (minutes / 60) * props.hourHeight
}

onMounted(() => {
  updateCurrentTime()
  timeUpdateInterval = setInterval(updateCurrentTime, 60000)
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>

<style scoped>
.time-grid {
  position: relative;
  background: var(--color-bg-primary);
}

.time-grid__row {
  display: flex;
  position: relative;
  box-sizing: border-box;
}

.time-grid__row--outside-business {
  background: var(--color-calendar-outside-business);
}

.time-grid__row--outside-business .time-grid__label {
  color: var(--color-text-tertiary);
}

.time-grid__row::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 64px;
  right: 0;
  border-top: 1px dashed var(--color-calendar-grid-line);
  pointer-events: none;
}

.time-grid__label {
  flex-shrink: 0;
  width: 64px;
  padding: 0 8px;
  line-height: var(--lh-none);
  color: var(--color-calendar-hour-text);
  text-align: right;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  margin-top: -6px;
}

.time-grid__cell-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--color-calendar-grid-line);
  border-bottom: 1px solid var(--color-calendar-grid-line);
  position: relative;
}

.time-grid__cell {
  flex: 1;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
  overflow: hidden;
}

.time-grid__cell:hover {
  background: var(--color-bg-secondary);
}

.time-grid__slot-preview {
  position: absolute;
  left: 64px;
  right: 0;
  background: var(--color-calendar-deferred);
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
  pointer-events: none;
  z-index: 1;
}

.time-grid__quick-form {
  pointer-events: auto;
  z-index: 6;
}

.time-grid__quick-form :deep(.quick-form__input) {
  border-color: transparent;
}

.time-grid__items {
  position: absolute;
  top: 0;
  left: calc(64px + 4px);
  right: 4px;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.time-grid__item-wrapper {
  position: absolute;
  pointer-events: auto;
  z-index: 1;
}

.time-grid__item-wrapper > * {
  height: 100%;
}

.time-grid__now {
  position: absolute;
  left: 64px;
  right: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
  z-index: 10;
}

.time-grid__now-dot {
  width: 12px;
  height: 12px;
  background: var(--color-action);
  border-radius: 50%;
  margin-left: -6px;
}

.time-grid__now-line {
  flex: 1;
  height: 2px;
  background: var(--color-action);
}

/* Start/Due date indicators */
.time-grid__indicator {
  position: absolute;
  left: 64px;
  right: 0;
  pointer-events: none;
  z-index: 8;
}

.time-grid__indicator--due {
  transform: translateY(-100%);
}

.time-grid__indicator-rule {
  height: 3px;
}

.time-grid__indicator--start .time-grid__indicator-rule {
  background: var(--color-calendar-start-border);
}

.time-grid__indicator--due .time-grid__indicator-rule {
  background: var(--color-danger);
}

.time-grid__indicator-body {
  padding-bottom: 16px;
}

.time-grid__indicator--start .time-grid__indicator-body {
  background: linear-gradient(to bottom, var(--color-calendar-start), transparent);
}

.time-grid__indicator--due .time-grid__indicator-body {
  background: linear-gradient(to top, rgba(239, 68, 68, 0.2), transparent);
  padding-bottom: 0;
  padding-top: 16px;
}

.time-grid__indicator-label {
  padding: 0 8px;
  pointer-events: auto;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--lh-snug);
}

.time-grid__indicator--start .time-grid__indicator-label {
  color: var(--color-calendar-start-text);
}

.time-grid__indicator--due .time-grid__indicator-label {
  color: var(--color-calendar-due-text);
}
</style>
