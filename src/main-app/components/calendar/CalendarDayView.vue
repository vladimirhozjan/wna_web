<template>
  <div class="day-view">
    <div class="day-view__scroll" ref="scrollRef">
      <!-- All-day section (sticky) -->
      <div class="day-view__all-day-wrapper">
        <CalendarAllDaySection
            :items="allDayItems"
            :date="dateStr"
            @item-click="onItemClick"
            @create="onCreate"
            @reschedule="onReschedule"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
        />
      </div>

      <!-- Time grid -->
      <CalendarTimeGrid
          :items="timedItems"
          :date="dateStr"
          :hour-height="hourHeight"
          @item-click="onItemClick"
          @create="onCreate"
          @reschedule="onReschedule"
          @drag-start="onDragStart"
          @drag-end="onDragEnd"
      />
    </div>

    <!-- Drag type popover -->
    <CalendarDragPopover
        v-if="pendingDrop"
        :date="pendingDrop.date"
        :x="pendingDrop.x"
        :y="pendingDrop.y"
        @select="onDragPopoverSelect"
        @cancel="pendingDrop = null"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { formatDate } from '../../scripts/core/dateUtils.js'
import { calendarModel } from '../../scripts/models/calendarModel.js'
import CalendarAllDaySection from './CalendarAllDaySection.vue'
import CalendarTimeGrid from './CalendarTimeGrid.vue'
import CalendarDragPopover from './CalendarDragPopover.vue'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true
  }
})

const emit = defineEmits(['item-click', 'create', 'reschedule'])

const calendar = calendarModel()
const hourHeight = 60
const draggingItem = ref(null)
const scrollRef = ref(null)
const pendingDrop = ref(null)

function scrollToBusinessHours() {
  if (!scrollRef.value) return
  const settings = calendar.getCalendarSettings()
  const scrollPosition = settings.businessHoursStart * hourHeight
  scrollRef.value.scrollTop = scrollPosition
}

onMounted(() => {
  scrollToBusinessHours()
})

// Scroll to business hours when date changes
watch(() => props.currentDate, () => {
  scrollToBusinessHours()
})

const dateStr = computed(() => formatDate(props.currentDate))

const dayItems = computed(() => calendar.getItemsForDate(props.currentDate))

const allDayItems = computed(() =>
    dayItems.value.filter(item => !calendar.hasTime(item))
)

const timedItems = computed(() =>
    dayItems.value.filter(item => calendar.hasTime(item))
)

function onItemClick(item) {
  emit('item-click', item)
}

function onCreate(data) {
  emit('create', data)
}

function onReschedule(data) {
  if (data.hasDueDate && !data.hasScheduledDate && !data.hasStartDate) {
    pendingDrop.value = {
      actionId: data.actionId,
      date: data.newDate,
      time: data.newTime,
      x: data.dropX,
      y: data.dropY,
    }
  } else {
    emit('reschedule', data)
  }
}

function onDragPopoverSelect(forcedType) {
  if (!pendingDrop.value) return
  emit('reschedule', {
    actionId: pendingDrop.value.actionId,
    newDate: pendingDrop.value.date,
    newTime: pendingDrop.value.time,
    forcedType,
  })
  pendingDrop.value = null
}

function onDragStart(item) {
  draggingItem.value = item
}

function onDragEnd() {
  draggingItem.value = null
}
</script>

<style scoped>
.day-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 490px;
  border: 1px solid var(--color-calendar-grid-line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
}

.day-view__scroll {
  flex: 1;
  overflow-y: auto;
}

.day-view__all-day-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg-primary);
}
</style>
