<template>
  <div class="month-view">
    <!-- Desktop: Grid view -->
    <template v-if="!isMobile">
      <!-- Weekday headers -->
      <div class="month-view__header">
        <div
            v-for="day in weekDays"
            :key="day"
            class="text-body-s fw-semibold month-view__header-cell"
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
          <div class="text-body-s fw-medium month-view__day-number">{{ formatDayNumber(day) }}</div>

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
                class="text-footnote month-view__more"
                @click.stop="onMoreClick(day)"
            >
              +{{ getItemsForDay(day).length - maxItemsPerDay }} more
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Mobile: List by days -->
    <div v-else class="month-view__list" ref="listRef">
      <div
          v-for="day in currentMonthDays"
          :key="formatDate(day)"
          :class="[
            'month-view__list-day',
            { 'month-view__list-day--today': isToday(day) }
          ]"
      >
        <div
            class="month-view__list-header"
            @click="onMobileHeaderClick(day)"
        >
          <span class="text-body-s fw-semibold month-view__list-weekday">{{ formatWeekdayShort(day) }}</span>
          <span :class="['text-body-m fw-semibold month-view__list-date', { 'month-view__list-date--today': isToday(day) }]">
            {{ formatDayNumber(day) }}
          </span>
          <span class="text-body-s month-view__list-count" v-if="getItemsForDay(day).length > 0">
            {{ getItemsForDay(day).length }} {{ getItemsForDay(day).length === 1 ? 'item' : 'items' }}
          </span>
        </div>

        <div class="month-view__list-items" v-if="getItemsForDay(day).length > 0">
          <template v-if="quickFormDate === formatDate(day)">
            <CalendarQuickForm
                :date="quickFormDate"
                @submit="onQuickFormSubmit"
                @cancel="onQuickFormCancel"
            />
          </template>

          <CalendarItem
              v-for="item in getItemsForDay(day)"
              :key="item.id"
              :item="item"
              :compact="true"
              :show-time="true"
              @click="onItemClick"
          />
        </div>

        <div class="text-body-s month-view__list-empty" v-else @click="onMobileDayClick(day)">
          Tap to add
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import {
  getMonthDays,
  formatDayNumber,
  formatWeekdayShort,
  formatDate,
  isSameMonth,
  isToday,
  getWeekDays,
} from '../../scripts/core/dateUtils.js'
import { calendarModel } from '../../scripts/models/calendarModel.js'
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
const isMobile = ref(false)
const listRef = ref(null)

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function scrollToToday() {
  nextTick(() => {
    if (isMobile.value && listRef.value) {
      // Find today's element in the list
      const todayEl = listRef.value.querySelector('.month-view__list-day--today')
      if (todayEl) {
        todayEl.scrollIntoView({ block: 'start', behavior: 'instant' })
      }
    }
  })
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  scrollToToday()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// Scroll to today when currentDate changes
watch(() => props.currentDate, () => {
  scrollToToday()
})

const weekDays = computed(() => {
  const settings = calendar.getCalendarSettings()
  const days = getWeekDays(new Date(), settings.weekStartsOn)
  return days.map(d => formatWeekdayShort(d))
})

const calendarDays = computed(() => {
  const settings = calendar.getCalendarSettings()
  return getMonthDays(props.currentDate, settings.weekStartsOn)
})

// For mobile list view - only show days in current month
const currentMonthDays = computed(() => {
  return calendarDays.value.filter(day => isSameMonth(day, props.currentDate))
})

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

function onMobileHeaderClick(day) {
  emit('day-click', day)
}

function onMobileDayClick(day) {
  quickFormDate.value = formatDate(day)
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
  min-height: 490px;
}

.month-view__header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--color-calendar-grid-line);
}

.month-view__header-cell {
  padding: 12px 8px;
  text-align: center;
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
  background: var(--color-highlight-yellow);
}

.month-view__cell--weekend {
  background: var(--color-calendar-weekend-bg);
}

.month-view__cell--weekend.month-view__cell--other-month {
  background: var(--color-bg-secondary);
}

.month-view__cell--drag-over {
  background: var(--color-calendar-deferred) !important;
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
}

.month-view__day-number {
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
  color: var(--color-text-inverse);
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

/* Mobile list view styles */
.month-view__list {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  height: 100%;
}

.month-view__list-day {
  border-bottom: 1px solid var(--color-calendar-grid-line);
}

.month-view__list-day--today {
  background: var(--color-calendar-today-bg);
}

.month-view__list-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.month-view__list-header:hover {
  background: var(--color-bg-secondary);
}

.month-view__list-weekday {
  color: var(--color-text-secondary);
  text-transform: uppercase;
  width: 36px;
}

.month-view__list-date {
  color: var(--color-text-primary);
}

.month-view__list-date--today {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--color-action);
  color: var(--color-text-inverse);
  border-radius: 50%;
}

.month-view__list-count {
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.month-view__list-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 16px 12px;
}

.month-view__list-empty {
  padding: 8px 16px 12px;
  color: var(--color-text-tertiary);
  cursor: pointer;
}

.month-view__list-empty:hover {
  color: var(--color-action);
}
</style>
