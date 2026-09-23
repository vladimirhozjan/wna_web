<template>
  <div class="week-view">
    <div class="week-view__scroll">
      <!-- Sticky header container (header + all-day) -->
      <div class="week-view__sticky-header">
        <!-- Day headers -->
        <div class="week-view__header">
          <div class="week-view__header-spacer"></div>
          <div
              v-for="day in weekDays"
              :key="day.dateStr"
              :class="[
                'week-view__header-cell',
                {
                  'week-view__header-cell--today': day.isToday,
                  'week-view__header-cell--weekend': day.isWeekend,
                }
              ]"
          >
            <div class="text-footnote week-view__header-weekday">{{ day.weekday }}</div>
            <div :class="['text-body-m fw-semibold week-view__header-date', { 'week-view__header-date--today': day.isToday }]">
              {{ day.dayNumber }}
            </div>
          </div>
        </div>

        <!-- All-day section -->
        <div class="week-view__all-day">
        <div class="text-footnote week-view__all-day-label">All day</div>
        <div
            v-for="day in weekDays"
            :key="`allday-${day.dateStr}`"
            :class="[
              'week-view__all-day-cell',
              {
                'week-view__all-day-cell--today': day.isToday,
                'week-view__all-day-cell--weekend': day.isWeekend,
                'week-view__all-day-cell--drag-over': dragOverDate === day.dateStr && dragOverMinutes === null,
              }
            ]"
            @click="onAllDayCellClick(day)"
            @dragover.prevent="onAllDayDragOver(day)"
            @dragleave="onDragLeave"
            @drop="onAllDayDrop(day, $event)"
        >
          <template v-if="quickFormSlot?.date === day.dateStr && quickFormSlot?.allDay">
            <CalendarQuickForm
                :date="day.dateStr"
                :time="null"
                @submit="onQuickFormSubmit"
                @cancel="onQuickFormCancel"
            />
          </template>
          <CalendarItem
              v-for="item in getAllDayItemsForDate(day.dateStr)"
              :key="item.id"
              :item="item"
              :show-time="false"
              :compact="true"
              @click="onItemClick"
              @drag-start="onItemDragStart"
              @drag-end="onItemDragEnd"
          />
        </div>
      </div>
      </div>

      <!-- Time grid -->
      <div class="week-view__grid">
        <!-- Hour labels -->
        <div class="week-view__hours">
          <div
              v-for="hour in hours"
              :key="hour"
              class="text-footnote week-view__hour-label"
              :style="{ height: hourHeight + 'px' }"
          >
            {{ formatHour(hour) }}
          </div>
        </div>

        <!-- Day columns -->
        <div
            v-for="day in weekDays"
            :key="`col-${day.dateStr}`"
            :class="[
              'week-view__column',
              {
                'week-view__column--today': day.isToday,
                'week-view__column--weekend': day.isWeekend,
              }
            ]"
        >
          <!-- Hour cells -->
          <div
              v-for="hour in hours"
              :key="`${day.dateStr}-${hour}`"
              :class="[
                'week-view__cell',
                { 'week-view__cell--outside-business': !isBusinessHour(hour) || !isBusinessDay(day.date.getDay()) }
              ]"
              :style="{ height: hourHeight + 'px' }"
              @click="onCellClick(day, hour)"
              @mousedown="onCellMouseDown(day, $event)"
              @dragover.prevent="onTimeDragOver(day, $event)"
              @dragleave="onDragLeave"
              @drop="onTimeDrop(day, $event)"
          ></div>

          <!-- Slot preview: drop target while dragging, or drag-to-create selection -->
          <div
              v-if="slotPreview?.date === day.dateStr"
              class="week-view__slot-preview"
              :style="{ top: slotPreview.top + 'px', height: slotPreview.height + 'px' }"
          ></div>

          <!-- Quick-add form, sized like the block it will create -->
          <div
              v-if="quickFormSlot?.date === day.dateStr && !quickFormSlot.allDay"
              class="week-view__slot-preview week-view__quick-form"
              :style="{ top: minutesToPx(quickFormSlot.minutes) + 'px', height: minutesToPx(Math.max(quickFormSlot.duration || 30, 30)) + 'px' }"
          >
            <CalendarQuickForm
                :date="day.dateStr"
                :time="quickFormSlot.time"
                :duration="quickFormSlot.duration"
                @submit="onQuickFormSubmit"
                @cancel="onQuickFormCancel"
            />
          </div>

          <!-- Items layer -->
          <div class="week-view__items">
            <div
                v-for="item in getPositionedItemsForDate(day.dateStr)"
                :key="item.id"
                class="week-view__item-wrapper"
                :style="{
                  top: item.top + 'px',
                  height: item.height + 'px',
                  left: (item.column / item.totalColumns * 100) + '%',
                  width: (100 / item.totalColumns) + '%',
                }"
                @dragover.prevent="onTimeDragOver(day, $event)"
                @drop="onTimeDrop(day, $event)"
            >
              <CalendarItem
                  :item="item"
                  :show-time="true"
                  :resizable="!!item.scheduled_time"
                  @click="onItemClick"
                  @drag-start="onItemDragStart"
                  @drag-end="onItemDragEnd"
                  @resize-start="onResizeStart"
              />
            </div>
          </div>

          <!-- Start date indicators -->
          <div
              v-for="item in getStartIndicatorsForDate(day.dateStr)"
              :key="`start-${item.id}`"
              class="week-view__indicator week-view__indicator--start"
              :style="{ top: item.top + 'px' }"
          >
            <div class="week-view__indicator-rule"></div>
            <div class="week-view__indicator-body">
              <div class="text-footnote week-view__indicator-label" @click.stop="onItemClick(item)">
                {{ item.title }}
              </div>
            </div>
          </div>

          <!-- Due date indicators -->
          <div
              v-for="item in getDueIndicatorsForDate(day.dateStr)"
              :key="`due-${item.id}`"
              class="week-view__indicator week-view__indicator--due"
              :style="{ top: item.top + 'px' }"
          >
            <div class="week-view__indicator-body">
              <div class="text-footnote week-view__indicator-label" @click.stop="onItemClick(item)">
                {{ item.title }}
              </div>
            </div>
            <div class="week-view__indicator-rule"></div>
          </div>

          <!-- Current time indicator -->
          <div
              v-if="day.isToday && currentTimePosition !== null"
              class="week-view__now"
              :style="{ top: currentTimePosition + 'px' }"
          ></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getWeekDays,
  formatDate,
  formatWeekdayShort,
  formatDayNumber,
  isToday,
} from '../../scripts/core/dateUtils.js'
import { calendarModel } from '../../scripts/models/calendarModel.js'
import { layoutOverlappingItems } from '../../scripts/core/calendarLayout.js'
import CalendarItem from './CalendarItem.vue'
import CalendarQuickForm from './CalendarQuickForm.vue'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true
  }
})

const emit = defineEmits(['item-click', 'create', 'reschedule', 'resize'])

const calendar = calendarModel()
const hourHeight = 60
const hours = Array.from({ length: 24 }, (_, i) => i)

const quickFormSlot = ref(null)
const dragOverDate = ref(null)
const dragOverMinutes = ref(null)
const draggingItem = ref(null)
const dragOffset = ref(0)
const selection = ref(null)
const resizing = ref(null)
const currentTimePosition = ref(null)
let timeUpdateInterval = null
let suppressClick = false

const calendarSettings = computed(() => calendar.getCalendarSettings())

const slotPreview = computed(() => {
  if (selection.value) {
    const { date, start, end } = selection.value
    return { date, top: minutesToPx(start), height: minutesToPx(end - start) }
  }
  if (dragOverDate.value && dragOverMinutes.value !== null) {
    return {
      date: dragOverDate.value,
      top: minutesToPx(dragOverMinutes.value),
      height: minutesToPx(draggingItem.value?.duration || 60),
    }
  }
  return null
})

const weekDays = computed(() => {
  const days = getWeekDays(props.currentDate, calendarSettings.value.weekStartsOn)
  return days.map(date => ({
    date,
    dateStr: formatDate(date),
    weekday: formatWeekdayShort(date),
    dayNumber: formatDayNumber(date),
    isToday: isToday(date),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  }))
})

// Cached per re-render: drag-over re-renders must not rescan items or re-run layout
const dayItemsByDate = computed(() => {
  const minHeight = hourHeight / 4  // 15 minutes minimum
  const defaultDuration = 15  // 15 minutes default
  const map = new Map()

  for (const day of weekDays.value) {
    const items = calendar.getItemsForDate(day.date)

    const positioned = items
        .filter(item => item._displayReason !== 'start' && item._displayReason !== 'due' && calendar.hasTime(item))
        .map(item => {
          const time = calendar.getItemTime(item)
          const [hours, minutes] = time.split(':').map(Number)
          const top = (hours * hourHeight) + (minutes / 60) * hourHeight

          const duration = (resizing.value?.id === item.id ? resizing.value.duration : item.duration) || defaultDuration
          const durationHeight = (duration / 60) * hourHeight
          const height = Math.max(minHeight, durationHeight) - 2  // -2 for visual spacing

          return {
            ...item,
            top,
            height,
          }
        })

    map.set(day.dateStr, {
      allDay: items.filter(item => !calendar.hasTime(item)),
      positioned: layoutOverlappingItems(positioned),
      startIndicators: items
          .filter(item => item._displayReason === 'start' && calendar.hasTime(item))
          .map(item => ({ ...item, top: computeIndicatorTop(item) })),
      dueIndicators: items
          .filter(item => item._displayReason === 'due' && calendar.hasTime(item))
          .map(item => ({ ...item, top: computeIndicatorTop(item) })),
    })
  }

  return map
})

function getAllDayItemsForDate(dateStr) {
  return dayItemsByDate.value.get(dateStr)?.allDay || []
}

function getPositionedItemsForDate(dateStr) {
  return dayItemsByDate.value.get(dateStr)?.positioned || []
}

function getStartIndicatorsForDate(dateStr) {
  return dayItemsByDate.value.get(dateStr)?.startIndicators || []
}

function getDueIndicatorsForDate(dateStr) {
  return dayItemsByDate.value.get(dateStr)?.dueIndicators || []
}

function computeIndicatorTop(item) {
  const time = calendar.getItemTime(item)
  const [h, m] = time.split(':').map(Number)
  return (h * hourHeight) + (m / 60) * hourHeight
}

function formatHour(hour) {
  return calendar.formatHour(hour, calendarSettings.value.timeFormat)
}

function isBusinessHour(hour) {
  return calendar.isBusinessHour(hour, calendarSettings.value)
}

function isBusinessDay(dayOfWeek) {
  return calendar.isBusinessDay(dayOfWeek, calendarSettings.value)
}

function formatTimeSlot(hour, minute = 0) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function minutesToPx(minutes) {
  return (minutes / 60) * hourHeight
}

function minutesFromY(clientY, column) {
  return ((clientY - column.getBoundingClientRect().top) / hourHeight) * 60
}

// Start of the 15-minute slot under the pointer
function slotFromY(clientY, column) {
  return Math.max(0, Math.min(24 * 60 - 15, Math.floor(minutesFromY(clientY, column) / 15) * 15))
}

function columnOf(element) {
  return element.closest('.week-view__column')
}

function openQuickForm(dateStr, minutes, duration = null) {
  quickFormSlot.value = { date: dateStr, minutes, time: formatTimeSlot(Math.floor(minutes / 60), minutes % 60), duration }
}

function onItemClick(item) {
  emit('item-click', item)
}

function onAllDayCellClick(day) {
  quickFormSlot.value = { date: day.dateStr, allDay: true }
}

function onCellClick(day, hour) {
  if (suppressClick) return
  openQuickForm(day.dateStr, hour * 60)
}

function onCellMouseDown(day, event) {
  if (event.button !== 0) return
  event.preventDefault()
  const column = columnOf(event.currentTarget)
  const start = slotFromY(event.clientY, column)

  const onMove = (e) => {
    const current = slotFromY(e.clientY, column)
    if (current === start && !selection.value) return
    selection.value = { date: day.dateStr, start: Math.min(start, current), end: Math.max(start, current) + 15 }
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
    openQuickForm(sel.date, sel.start, sel.end - sel.start)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function onResizeStart(item, event) {
  const column = columnOf(event.target)
  const [h, m] = item.scheduled_time.split(':').map(Number)
  const start = h * 60 + m

  const onMove = (e) => {
    const end = Math.min(24 * 60, Math.max(start + 15, Math.round(minutesFromY(e.clientY, column) / 15) * 15))
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

function onQuickFormSubmit(data) {
  emit('create', data)
  quickFormSlot.value = null
}

function onQuickFormCancel() {
  quickFormSlot.value = null
}

function onItemDragStart(item, offsetY) {
  draggingItem.value = item
  dragOffset.value = offsetY
}

function onItemDragEnd() {
  draggingItem.value = null
  dragOverDate.value = null
  dragOverMinutes.value = null
}

function onAllDayDragOver(day) {
  dragOverDate.value = day.dateStr
  dragOverMinutes.value = null
}

function onTimeDragOver(day, event) {
  const minutes = slotFromY(event.clientY - dragOffset.value, columnOf(event.currentTarget))
  if (dragOverDate.value !== day.dateStr || dragOverMinutes.value !== minutes) {
    dragOverDate.value = day.dateStr
    dragOverMinutes.value = minutes
  }
}

function onTimeDrop(day, event) {
  event.preventDefault()
  const minutes = slotFromY(event.clientY - dragOffset.value, columnOf(event.currentTarget))
  dragOverDate.value = null
  dragOverMinutes.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      const newTime = formatTimeSlot(Math.floor(minutes / 60), minutes % 60)
      emit('reschedule', { actionId: data.id, newDate: day.dateStr, newTime })
    }
  } catch (e) {
    // Ignore parse errors
  }
}

function onDragLeave() {
  // Don't clear immediately - let dragover set the new value
}

function onAllDayDrop(day, event) {
  event.preventDefault()
  dragOverDate.value = null
  dragOverMinutes.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      emit('reschedule', { actionId: data.id, newDate: day.dateStr, newTime: null })
    }
  } catch (e) {
    // Ignore parse errors
  }
}

function updateCurrentTime() {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  currentTimePosition.value = (hours * hourHeight) + (minutes / 60) * hourHeight
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
.week-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 490px;
  border: 1px solid var(--color-calendar-grid-line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.week-view__sticky-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg-primary);
}

.week-view__header {
  display: flex;
  border-bottom: 1px solid var(--color-calendar-grid-line);
  flex-shrink: 0;
}

.week-view__header-spacer {
  flex-shrink: 0;
  width: 64px;
  border-right: 1px solid var(--color-calendar-grid-line);
  box-sizing: border-box;
}

.week-view__header-cell {
  flex: 1;
  padding: 8px;
  text-align: center;
  border-right: 1px solid var(--color-calendar-grid-line);
}

.week-view__header-cell:last-child {
  border-right: none;
}

.week-view__header-cell--weekend {
  background: var(--color-calendar-weekend-bg);
}

.week-view__header-weekday {
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.week-view__header-date {
  color: var(--color-text-primary);
  margin-top: 4px;
}

.week-view__header-date--today {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-action);
  color: var(--color-text-inverse);
  border-radius: 50%;
}

.week-view__all-day {
  display: flex;
  border-bottom: 1px solid var(--color-calendar-grid-line);
  height: 80px;
  flex-shrink: 0;
}

.week-view__all-day-label {
  flex-shrink: 0;
  width: 64px;
  padding: 8px 8px;
  color: var(--color-calendar-hour-text);
  text-align: right;
  border-right: 1px solid var(--color-calendar-grid-line);
  box-sizing: border-box;
}

.week-view__all-day-cell {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border-right: 1px solid var(--color-calendar-grid-line);
  cursor: pointer;
  transition: background 0.15s;
  overflow-y: auto;
  overflow-x: hidden;
}

.week-view__all-day-cell > * {
  flex-shrink: 0;
}

.week-view__all-day-cell:last-of-type {
  border-right: none;
}

.week-view__all-day-cell:hover {
  background: var(--color-bg-secondary);
}

.week-view__all-day-cell--weekend {
  background: var(--color-calendar-weekend-bg);
}

.week-view__all-day-cell--today {
  background: var(--color-calendar-today-bg);
}

.week-view__all-day-cell--drag-over {
  background: var(--color-calendar-deferred) !important;
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
}

.week-view__scroll {
  flex: 1;
  overflow-y: auto;
}

.week-view__grid {
  display: flex;
}

.week-view__hours {
  flex-shrink: 0;
  width: 64px;
  border-right: 1px solid var(--color-calendar-grid-line);
  box-sizing: border-box;
}

.week-view__hour-label {
  padding: 0 8px;
  line-height: var(--lh-none);
  color: var(--color-calendar-hour-text);
  text-align: right;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  box-sizing: border-box;
  transform: translateY(-6px);
}

.week-view__column {
  flex: 1;
  position: relative;
  border-right: 1px solid var(--color-calendar-grid-line);
  transform: translateZ(0);
}

.week-view__column:last-child {
  border-right: none;
}

.week-view__column--weekend {
  background: var(--color-calendar-weekend-bg);
}

.week-view__column--today {
  background: color-mix(in srgb, var(--color-calendar-today-bg) 30%, transparent);
}

.week-view__cell {
  border-bottom: 1px solid var(--color-calendar-grid-line);
  cursor: pointer;
  transition: background 0.15s;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.week-view__cell:hover {
  background: var(--color-bg-secondary);
}

.week-view__slot-preview {
  position: absolute;
  left: 0;
  right: 0;
  background: var(--color-calendar-deferred);
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
  pointer-events: none;
  z-index: 1;
}

.week-view__quick-form {
  pointer-events: auto;
  z-index: 6;
}

.week-view__quick-form :deep(.quick-form__input) {
  border-color: transparent;
}

.week-view__cell--outside-business {
  background: var(--color-calendar-outside-business);
}

.week-view__items {
  position: absolute;
  top: 0;
  left: 4px;
  right: 4px;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.week-view__item-wrapper {
  position: absolute;
  pointer-events: auto;
}

.week-view__item-wrapper > * {
  height: 100%;
}

.week-view__now {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-action);
  z-index: 10;
  pointer-events: none;
}

.week-view__now::before {
  content: '';
  position: absolute;
  left: -4px;
  top: -4px;
  width: 10px;
  height: 10px;
  background: var(--color-action);
  border-radius: 50%;
}

/* Start/Due date indicators */
.week-view__indicator {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 8;
}

.week-view__indicator--due {
  transform: translateY(-100%);
}

.week-view__indicator-rule {
  height: 3px;
}

.week-view__indicator--start .week-view__indicator-rule {
  background: var(--color-calendar-start-border);
}

.week-view__indicator--due .week-view__indicator-rule {
  background: var(--color-danger);
}

.week-view__indicator-body {
  padding-bottom: 12px;
}

.week-view__indicator--start .week-view__indicator-body {
  background: linear-gradient(to bottom, var(--color-calendar-start), transparent);
}

.week-view__indicator--due .week-view__indicator-body {
  background: linear-gradient(to top, rgba(239, 68, 68, 0.2), transparent);
  padding-bottom: 0;
  padding-top: 12px;
}

.week-view__indicator-label {
  padding: 0 4px;
  pointer-events: auto;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: var(--lh-snug);
}

.week-view__indicator--start .week-view__indicator-label {
  color: var(--color-calendar-start-text);
}

.week-view__indicator--due .week-view__indicator-label {
  color: var(--color-calendar-due-text);
}
</style>
