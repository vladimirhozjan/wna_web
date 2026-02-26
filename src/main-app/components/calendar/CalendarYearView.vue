<template>
  <div class="year-view" ref="yearViewRef">
    <div class="year-view__grid">
      <div
          v-for="month in months"
          :key="month.monthIndex"
          :class="['year-view__month', { 'year-view__month--current': isCurrentMonth(month.monthIndex) }]"
      >
        <div class="year-view__month-header" @click="onMonthClick(month)">
          {{ month.name }}
        </div>

        <!-- Weekday headers -->
        <div class="year-view__weekdays">
          <div v-for="day in weekdayLabels" :key="day" class="year-view__weekday">
            {{ day }}
          </div>
        </div>

        <!-- Days grid -->
        <div class="year-view__days">
          <div
              v-for="(day, idx) in month.days"
              :key="idx"
              :class="[
                'year-view__day',
                {
                  'year-view__day--empty': !day,
                  'year-view__day--today': day && isToday(day),
                  [`year-view__day--heat-${getHeatLevel(day)}`]: day,
                }
              ]"
              :title="day ? getDayTooltip(day) : ''"
              @click="day && onDayClick(day)"
          >
            <span v-if="day" class="year-view__day-number">{{ formatDayNumber(day) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="year-view__legend">
      <span class="year-view__legend-label">Less</span>
      <div class="year-view__legend-item year-view__day--heat-0"></div>
      <div class="year-view__legend-item year-view__day--heat-1"></div>
      <div class="year-view__legend-item year-view__day--heat-2"></div>
      <div class="year-view__legend-item year-view__day--heat-3"></div>
      <div class="year-view__legend-item year-view__day--heat-4"></div>
      <span class="year-view__legend-label">More</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import {
  getYearMonths,
  getMonthDays,
  formatMonthShort,
  formatDayNumber,
  formatDate,
  isToday,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from '../../scripts/dateUtils.js'
import { calendarModel } from '../../scripts/calendarModel.js'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true
  }
})

const emit = defineEmits(['item-click', 'day-click', 'month-click'])

const calendar = calendarModel()
const yearViewRef = ref(null)

function isCurrentMonth(monthIndex) {
  const now = new Date()
  return props.currentDate.getFullYear() === now.getFullYear() && monthIndex === now.getMonth()
}

function scrollToCurrentMonth() {
  nextTick(() => {
    if (yearViewRef.value) {
      const currentMonthEl = yearViewRef.value.querySelector('.year-view__month--current')
      if (currentMonthEl) {
        currentMonthEl.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
    }
  })
}

onMounted(() => {
  scrollToCurrentMonth()
})

// Scroll when year changes
watch(() => props.currentDate, () => {
  scrollToCurrentMonth()
})

const weekdayLabels = computed(() => {
  const settings = calendar.getCalendarSettings()
  const allLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const start = settings.weekStartsOn
  return [...allLabels.slice(start), ...allLabels.slice(0, start)]
})

const months = computed(() => {
  const settings = calendar.getCalendarSettings()
  const weekStartsOn = settings.weekStartsOn
  const yearMonths = getYearMonths(props.currentDate)

  return yearMonths.map((monthDate, monthIndex) => {
    const monthStart = startOfMonth(monthDate)
    const daysInGrid = []

    // Get the day of week the month starts on, offset by weekStartsOn
    const startDay = (monthStart.getDay() - weekStartsOn + 7) % 7

    // Add empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      daysInGrid.push(null)
    }

    // Add all days of the month
    const monthDays = getMonthDays(monthDate, weekStartsOn)
    const actualMonthDays = monthDays.filter(d => isSameMonth(d, monthDate))
    daysInGrid.push(...actualMonthDays)

    return {
      monthIndex,
      name: formatMonthShort(monthDate),
      date: monthDate,
      days: daysInGrid,
    }
  })
})

function getHeatLevel(date) {
  if (!date) return 0
  const count = calendar.getItemCountForDate(date)

  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
}

function getDayTooltip(date) {
  const dateStr = formatDate(date, 'MMM d, yyyy')
  const count = calendar.getItemCountForDate(date)

  if (count === 0) return `${dateStr}: No actions`
  if (count === 1) return `${dateStr}: 1 action`
  return `${dateStr}: ${count} actions`
}

function onDayClick(date) {
  emit('day-click', date)
}

function onMonthClick(month) {
  emit('month-click', month.date)
}
</script>

<style scoped>
.year-view {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.year-view__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 1024px) {
  .year-view__grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .year-view__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .year-view__grid {
    grid-template-columns: 1fr;
  }
}

.year-view__month {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-calendar-grid-line);
  border-radius: 8px;
  padding: 12px;
}

.year-view__month-header {
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  cursor: pointer;
  transition: color 0.15s;
}

.year-view__month-header:hover {
  color: var(--color-action);
}

.year-view__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 4px;
}

.year-view__weekday {
  font-family: var(--font-family-default);
  font-size: 10px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.year-view__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.year-view__day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
}

.year-view__day:hover:not(.year-view__day--empty) {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
}

.year-view__day--empty {
  cursor: default;
}

.year-view__day--today {
  outline: 2px solid var(--color-action);
  outline-offset: 1px;
}

.year-view__day--heat-0 {
  background: var(--color-heat-0);
}

.year-view__day--heat-1 {
  background: var(--color-heat-1);
}

.year-view__day--heat-2 {
  background: var(--color-heat-2);
}

.year-view__day--heat-3 {
  background: var(--color-heat-3);
}

.year-view__day--heat-4 {
  background: var(--color-heat-4);
}

.year-view__day-number {
  font-family: var(--font-family-default);
  font-size: 10px;
  color: var(--color-text-secondary);
}

.year-view__day--heat-3 .year-view__day-number,
.year-view__day--heat-4 .year-view__day-number {
  color: var(--color-text-primary);
}

.year-view__legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--color-calendar-grid-line);
}

.year-view__legend-label {
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  color: var(--color-text-secondary);
  margin: 0 8px;
}

.year-view__legend-item {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
</style>
