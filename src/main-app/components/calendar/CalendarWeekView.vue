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
                'week-view__all-day-cell--drag-over': dragOverDate === day.dateStr && dragOverHour === null,
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
                {
                  'week-view__cell--drag-over': dragOverDate === day.dateStr && dragOverHour === hour,
                  'week-view__cell--outside-business': !isBusinessHour(hour) || !isBusinessDay(day.date.getDay())
                }
              ]"
              :style="{ height: hourHeight + 'px' }"
              @click="onCellClick(day, hour)"
              @dragover.prevent="onCellDragOver(day, hour)"
              @dragleave="onDragLeave"
              @drop="onCellDrop(day, hour, $event)"
          >
            <template v-if="quickFormSlot?.date === day.dateStr && quickFormSlot?.hour === hour">
              <CalendarQuickForm
                  :date="day.dateStr"
                  :time="formatTimeSlot(hour)"
                  @submit="onQuickFormSubmit"
                  @cancel="onQuickFormCancel"
              />
            </template>
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
                @dragover.prevent="onWrapperDragOver(day, $event)"
                @drop="onWrapperDrop(day, $event)"
            >
              <CalendarItem
                  :item="item"
                  :show-time="true"
                  @click="onItemClick"
                  @drag-start="onItemDragStart"
                  @drag-end="onItemDragEnd"
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

const emit = defineEmits(['item-click', 'create', 'reschedule'])

const calendar = calendarModel()
const hourHeight = 60
const hours = Array.from({ length: 24 }, (_, i) => i)

const quickFormSlot = ref(null)
const dragOverDate = ref(null)
const dragOverHour = ref(null)
const draggingItem = ref(null)
const currentTimePosition = ref(null)
let timeUpdateInterval = null

const calendarSettings = computed(() => calendar.getCalendarSettings())

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

          const duration = item.duration || defaultDuration
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

function formatTimeSlot(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

function onItemClick(item) {
  emit('item-click', item)
}

function onAllDayCellClick(day) {
  quickFormSlot.value = { date: day.dateStr, allDay: true }
}

function onCellClick(day, hour) {
  quickFormSlot.value = { date: day.dateStr, hour }
}

function onQuickFormSubmit(data) {
  emit('create', data)
  quickFormSlot.value = null
}

function onQuickFormCancel() {
  quickFormSlot.value = null
}

function onItemDragStart(item) {
  draggingItem.value = item
}

function onItemDragEnd() {
  draggingItem.value = null
  dragOverDate.value = null
  dragOverHour.value = null
}

function onAllDayDragOver(day) {
  dragOverDate.value = day.dateStr
  dragOverHour.value = null
}

function getHourFromEvent(event) {
  const container = event.currentTarget.parentElement
  const y = event.clientY - container.getBoundingClientRect().top
  return Math.max(0, Math.min(23, Math.floor(y / hourHeight)))
}

function onWrapperDragOver(day, event) {
  dragOverDate.value = day.dateStr
  dragOverHour.value = getHourFromEvent(event)
}

function onWrapperDrop(day, event) {
  event.preventDefault()
  dragOverDate.value = null
  dragOverHour.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      const hour = getHourFromEvent(event)
      const newTime = formatTimeSlot(hour)
      emit('reschedule', { actionId: data.id, newDate: day.dateStr, newTime })
    }
  } catch (e) {
    // Ignore parse errors
  }
}

function onCellDragOver(day, hour) {
  dragOverDate.value = day.dateStr
  dragOverHour.value = hour
}

function onDragLeave() {
  // Don't clear immediately - let dragover set the new value
}

function onAllDayDrop(day, event) {
  event.preventDefault()
  dragOverDate.value = null
  dragOverHour.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      emit('reschedule', { actionId: data.id, newDate: day.dateStr, newTime: null })
    }
  } catch (e) {
    // Ignore parse errors
  }
}

function onCellDrop(day, hour, event) {
  event.preventDefault()
  dragOverDate.value = null
  dragOverHour.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      const newTime = formatTimeSlot(hour)
      emit('reschedule', { actionId: data.id, newDate: day.dateStr, newTime })
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
  background: rgba(254, 243, 199, 0.3);
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

.week-view__cell--drag-over {
  background: var(--color-calendar-deferred) !important;
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
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
