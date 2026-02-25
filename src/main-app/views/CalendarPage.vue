<template>
  <DashboardLayout>
    <div class="calendar-page">
      <CalendarHeader
          :current-date="currentDate"
          :view-mode="viewMode"
          :loading="viewMode === 'recurring' ? recurringLoading : loading"
          @prev="onPrev"
          @next="onNext"
          @today="onToday"
          @view-change="onViewChange"
      />

      <div class="calendar-page__content">
          <CalendarDayView
              v-if="viewMode === 'day'"
              :current-date="currentDate"
              @item-click="onItemClick"
              @create="onCreate"
              @reschedule="onReschedule"
          />

          <CalendarWeekView
              v-else-if="viewMode === 'week'"
              :current-date="currentDate"
              @item-click="onItemClick"
              @create="onCreate"
              @reschedule="onReschedule"
          />

          <CalendarMonthView
              v-else-if="viewMode === 'month'"
              :current-date="currentDate"
              @item-click="onItemClick"
              @create="onCreate"
              @reschedule="onReschedule"
              @day-click="onDayClick"
          />

          <CalendarYearView
              v-else-if="viewMode === 'year'"
              :current-date="currentDate"
              @day-click="onDayClick"
              @month-click="onMonthClick"
          />

          <CalendarRecurringView
              v-else-if="viewMode === 'recurring'"
          />
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import CalendarHeader from '../components/calendar/CalendarHeader.vue'
import CalendarDayView from '../components/calendar/CalendarDayView.vue'
import CalendarWeekView from '../components/calendar/CalendarWeekView.vue'
import CalendarMonthView from '../components/calendar/CalendarMonthView.vue'
import CalendarYearView from '../components/calendar/CalendarYearView.vue'
import CalendarRecurringView from '../components/calendar/CalendarRecurringView.vue'
import { calendarModel } from '../scripts/calendarModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { recurringModel } from '../scripts/recurringModel.js'

const router = useRouter()
const calendar = calendarModel()
const toaster = errorModel()

const { loading: recurringLoading } = recurringModel()

const currentDate = computed(() => calendar.currentDate.value)
const viewMode = computed(() => calendar.viewMode.value)
const loading = computed(() => calendar.loading.value)

async function loadData() {
  if (viewMode.value === 'recurring') return

  try {
    const { start, end } = calendar.dateRange.value

    if (viewMode.value === 'year') {
      // For year view, load density data for efficient rendering
      await calendar.loadDensity(start, end)
    } else {
      // For other views, load full items
      await calendar.loadCalendarItems(start, end)
    }
  } catch (err) {
    toaster.push('Failed to load calendar items')
  }
}

onMounted(() => {
  loadData()
})

watch([currentDate, viewMode], () => {
  loadData()
})

function onPrev() {
  calendar.goToPrev()
}

function onNext() {
  calendar.goToNext()
}

function onToday() {
  calendar.goToToday()
}

function onViewChange(mode) {
  calendar.setViewMode(mode)
}

function onItemClick(item) {
  router.push({
    name: 'action-detail',
    params: { id: item.id },
    query: { from: 'calendar' }
  })
}

function onDayClick(date) {
  calendar.setCurrentDate(date)
  calendar.setViewMode('day')
}

function onMonthClick(date) {
  calendar.setCurrentDate(date)
  calendar.setViewMode('month')
}

async function onCreate({ title, date, time }) {
  try {
    await calendar.createScheduledAction(date, time, title)
    toaster.success('Action created')
  } catch (err) {
    toaster.push('Failed to create action')
  }
}

async function onReschedule({ actionId, newDate, newTime }) {
  try {
    await calendar.rescheduleAction(actionId, newDate, newTime)
    toaster.success('Action rescheduled')
  } catch (err) {
    toaster.push('Failed to reschedule action')
  }
}
</script>

<style scoped>
.calendar-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 16px 16px;
}

.calendar-page__content {
  flex: 1;
  min-height: 0;
  margin-bottom: 10px;
}
</style>
