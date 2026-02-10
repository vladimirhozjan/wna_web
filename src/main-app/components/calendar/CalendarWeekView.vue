<template>
  <div class="week-view">
    <div class="week-view__scroll">
      <!-- Day headers (sticky) -->
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
          <div class="week-view__header-weekday">{{ day.weekday }}</div>
          <div :class="['week-view__header-date', { 'week-view__header-date--today': day.isToday }]">
            {{ day.dayNumber }}
          </div>
        </div>
      </div>

      <!-- All-day section (sticky) -->
      <div class="week-view__all-day">
        <div class="week-view__all-day-label">All day</div>
        <div
            v-for="day in weekDays"
            :key="`allday-${day.dateStr}`"
            :class="[
              'week-view__all-day-cell',
              {
                'week-view__all-day-cell--today': day.isToday,
                'week-view__all-day-cell--weekend': day.isWeekend,
                'week-view__all-day-cell--drag-over': dragOverDate === day.dateStr && !dragOverTime,
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
              v-for="item in getAllDayItemsForDate(day.date)"
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

      <!-- Time grid -->
      <div class="week-view__grid">
        <!-- Hour labels -->
        <div class="week-view__hours">
          <div
              v-for="hour in hours"
              :key="hour"
              class="week-view__hour-label"
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
                  'week-view__cell--drag-over': dragOverDate === day.dateStr && dragOverTime?.hour === hour
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
                v-for="item in getPositionedItemsForDate(day.date)"
                :key="item.id"
                class="week-view__item-wrapper"
                :style="{
                  top: item.top + 'px',
                  height: item.height + 'px',
                }"
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
} from '../../scripts/dateUtils.js'
import { calendarModel } from '../../scripts/calendarModel.js'
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
const dragOverTime = ref(null)
const draggingItem = ref(null)
const currentTimePosition = ref(null)
let timeUpdateInterval = null

const weekDays = computed(() => {
  const days = getWeekDays(props.currentDate)
  return days.map(date => ({
    date,
    dateStr: formatDate(date),
    weekday: formatWeekdayShort(date),
    dayNumber: formatDayNumber(date),
    isToday: isToday(date),
    isWeekend: date.getDay() === 0 || date.getDay() === 6,
  }))
})

function getAllDayItemsForDate(date) {
  return calendar.getItemsForDate(date).filter(item => !calendar.hasTime(item))
}

function getTimedItemsForDate(date) {
  return calendar.getItemsForDate(date).filter(item => calendar.hasTime(item))
}

function getPositionedItemsForDate(date) {
  const minHeight = hourHeight / 4  // 15 minutes minimum
  const defaultDuration = 15  // 15 minutes default

  return getTimedItemsForDate(date).map(item => {
    const time = calendar.getItemTime(item)
    const [hours, minutes] = time.split(':').map(Number)
    const top = (hours * hourHeight) + (minutes / 60) * hourHeight

    // Calculate duration in minutes
    const duration = item.duration || defaultDuration
    const durationHeight = (duration / 60) * hourHeight
    const height = Math.max(minHeight, durationHeight) - 2  // -2 for visual spacing

    return {
      ...item,
      top,
      height,
    }
  })
}

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
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
  dragOverTime.value = null
}

function onAllDayDragOver(day) {
  dragOverDate.value = day.dateStr
  dragOverTime.value = null
}

function onCellDragOver(day, hour) {
  dragOverDate.value = day.dateStr
  dragOverTime.value = { hour }
}

function onDragLeave() {
  // Don't clear immediately - let dragover set the new value
}

function onAllDayDrop(day, event) {
  event.preventDefault()
  dragOverDate.value = null
  dragOverTime.value = null

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
  dragOverTime.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      emit('reschedule', { actionId: data.id, newDate: day.dateStr, newTime: formatTimeSlot(hour) })
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

.week-view__header {
  display: flex;
  border-bottom: 1px solid var(--color-calendar-grid-line);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg-primary);
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
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.week-view__header-date {
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-m);
  font-weight: 600;
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
  color: white;
  border-radius: 50%;
}

.week-view__all-day {
  display: flex;
  border-bottom: 1px solid var(--color-calendar-grid-line);
  height: 80px;
  flex-shrink: 0;
  position: sticky;
  top: 58px; /* Below header */
  z-index: 19;
  background: var(--color-bg-primary);
}

.week-view__all-day-label {
  flex-shrink: 0;
  width: 64px;
  padding: 8px 8px;
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
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
  position: relative;
}

.week-view__hours {
  flex-shrink: 0;
  width: 64px;
  border-right: 1px solid var(--color-calendar-grid-line);
  box-sizing: border-box;
}

.week-view__hour-label {
  padding: 0 8px;
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  line-height: 1;
  color: var(--color-calendar-hour-text);
  text-align: right;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  margin-top: -6px;
}

.week-view__column {
  flex: 1;
  position: relative;
  border-right: 1px solid var(--color-calendar-grid-line);
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
  left: 0;
  right: 0;
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
  background: var(--color-danger);
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
  background: var(--color-danger);
  border-radius: 50%;
}
</style>
