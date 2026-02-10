<template>
  <div class="day-view">
    <div class="day-view__scroll">
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatDate } from '../../scripts/dateUtils.js'
import { calendarModel } from '../../scripts/calendarModel.js'
import CalendarAllDaySection from './CalendarAllDaySection.vue'
import CalendarTimeGrid from './CalendarTimeGrid.vue'

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
  emit('reschedule', data)
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
