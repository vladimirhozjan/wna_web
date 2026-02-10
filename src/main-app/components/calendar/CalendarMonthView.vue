<template>
  <div class="month-view">
    <!-- Weekday headers -->
    <div class="month-view__header">
      <div
          v-for="day in weekDays"
          :key="day"
          class="month-view__header-cell"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="month-view__grid">
      <div
          v-for="(day, index) in calendarDays"
          :key="index"
          :class="[
            'month-view__cell',
            {
              'month-view__cell--other-month': !isSameMonth(day, currentDate),
              'month-view__cell--today': isToday(day),
              'month-view__cell--weekend': isWeekend(day),
              'month-view__cell--drag-over': dragOverDate === formatDate(day),
            }
          ]"
          @click="onCellClick(day, $event)"
          @dragover.prevent="onDragOver(day)"
          @dragleave="onDragLeave"
          @drop="onDrop(day, $event)"
      >
        <div class="month-view__day-number">{{ formatDayNumber(day) }}</div>

        <div class="month-view__items">
          <template v-if="quickFormDate === formatDate(day)">
            <CalendarQuickForm
                :date="quickFormDate"
                @submit="onQuickFormSubmit"
                @cancel="onQuickFormCancel"
            />
          </template>

          <CalendarItem
              v-for="item in getItemsForDay(day).slice(0, maxItemsPerDay)"
              :key="item.id"
              :item="item"
              :compact="true"
              :show-time="false"
              @click="onItemClick"
              @drag-start="onItemDragStart"
              @drag-end="onItemDragEnd"
          />

          <div
              v-if="getItemsForDay(day).length > maxItemsPerDay"
              class="month-view__more"
              @click.stop="onMoreClick(day)"
          >
            +{{ getItemsForDay(day).length - maxItemsPerDay }} more
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  getMonthDays,
  formatDayNumber,
  formatWeekdayShort,
  formatDate,
  isSameMonth,
  isToday,
  getWeekDays,
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

const emit = defineEmits(['item-click', 'create', 'reschedule', 'day-click'])

const calendar = calendarModel()
const maxItemsPerDay = 3
const quickFormDate = ref(null)
const dragOverDate = ref(null)
const draggingItem = ref(null)

const weekDays = computed(() => {
  const days = getWeekDays(new Date())
  return days.map(d => formatWeekdayShort(d))
})

const calendarDays = computed(() => getMonthDays(props.currentDate))

function isWeekend(date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function getItemsForDay(date) {
  return calendar.getItemsForDate(date)
}

function onCellClick(day, event) {
  if (event.target.closest('.calendar-item') || event.target.closest('.quick-form')) {
    return
  }
  quickFormDate.value = formatDate(day)
}

function onItemClick(item) {
  emit('item-click', item)
}

function onMoreClick(day) {
  emit('day-click', day)
}

function onQuickFormSubmit({ title, date, time }) {
  emit('create', { title, date, time })
  quickFormDate.value = null
}

function onQuickFormCancel() {
  quickFormDate.value = null
}

function onItemDragStart(item) {
  draggingItem.value = item
}

function onItemDragEnd() {
  draggingItem.value = null
  dragOverDate.value = null
}

function onDragOver(day) {
  dragOverDate.value = formatDate(day)
}

function onDragLeave() {
  dragOverDate.value = null
}

function onDrop(day, event) {
  event.preventDefault()
  const dateStr = formatDate(day)

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      emit('reschedule', { actionId: data.id, newDate: dateStr, newTime: null })
    }
  } catch (e) {
    // Ignore parse errors
  }

  dragOverDate.value = null
}
</script>

<style scoped>
.month-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
}

.month-view__header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--color-calendar-grid-line);
}

.month-view__header-cell {
  padding: 12px 8px;
  text-align: center;
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.month-view__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  flex: 1;
  border-left: 1px solid var(--color-calendar-grid-line);
}

.month-view__cell {
  min-height: 100px;
  padding: 4px;
  border-right: 1px solid var(--color-calendar-grid-line);
  border-bottom: 1px solid var(--color-calendar-grid-line);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: background 0.15s;
  overflow: hidden;
}

.month-view__cell:hover {
  background: var(--color-bg-secondary);
}

.month-view__cell--other-month {
  background: var(--color-bg-secondary);
}

.month-view__cell--other-month .month-view__day-number {
  color: var(--color-text-tertiary);
}

.month-view__cell--today {
  background: var(--color-calendar-today-bg);
}

.month-view__cell--today:hover {
  background: #fef08a;
}

.month-view__cell--weekend {
  background: var(--color-calendar-weekend-bg);
}

.month-view__cell--weekend.month-view__cell--other-month {
  background: #f3f4f6;
}

.month-view__cell--drag-over {
  background: var(--color-calendar-deferred) !important;
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
}

.month-view__day-number {
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  font-weight: 500;
  color: var(--color-text-primary);
  padding: 4px 8px;
}

.month-view__cell--today .month-view__day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-action);
  color: white;
  border-radius: 50%;
  padding: 0;
}

.month-view__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.month-view__more {
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  color: var(--color-text-secondary);
  padding: 2px 6px;
  cursor: pointer;
}

.month-view__more:hover {
  color: var(--color-action);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .month-view__cell {
    min-height: 80px;
    padding: 2px;
  }

  .month-view__header-cell {
    padding: 8px 4px;
    font-size: var(--font-size-footnote);
  }

  .month-view__day-number {
    font-size: var(--font-size-footnote);
    padding: 2px 4px;
  }
}
</style>
