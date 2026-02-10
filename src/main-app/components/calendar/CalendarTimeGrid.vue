<template>
  <div class="time-grid" ref="gridRef" @dragend="onGridDragEnd">
    <!-- Hour rows -->
    <div
        v-for="hour in hours"
        :key="hour"
        class="time-grid__row"
        :style="{ height: hourHeight + 'px' }"
    >
      <div class="time-grid__label">
        {{ formatHour(hour) }}
      </div>
      <div class="time-grid__cell-container">
        <!-- First half (:00) -->
        <div
            class="time-grid__cell"
            :class="{
              'time-grid__cell--drag-over': dragOverSlot?.hour === hour && dragOverSlot?.half === 0
            }"
            @click="onCellClick(hour, 0)"
            @dragover.prevent="onDragOver(hour, 0)"
            @dragleave="onDragLeave"
            @drop="onDrop(hour, 0, $event)"
        >
          <template v-if="quickFormSlot?.hour === hour && quickFormSlot?.half === 0">
            <CalendarQuickForm
                :date="date"
                :time="formatTimeSlot(hour, 0)"
                @submit="onQuickFormSubmit"
                @cancel="onQuickFormCancel"
            />
          </template>
        </div>
        <!-- Second half (:30) -->
        <div
            class="time-grid__cell time-grid__cell--half"
            :class="{
              'time-grid__cell--drag-over': dragOverSlot?.hour === hour && dragOverSlot?.half === 30
            }"
            @click="onCellClick(hour, 30)"
            @dragover.prevent="onDragOver(hour, 30)"
            @dragleave="onDragLeave"
            @drop="onDrop(hour, 30, $event)"
        >
          <template v-if="quickFormSlot?.hour === hour && quickFormSlot?.half === 30">
            <CalendarQuickForm
                :date="date"
                :time="formatTimeSlot(hour, 30)"
                @submit="onQuickFormSubmit"
                @cancel="onQuickFormCancel"
            />
          </template>
        </div>
      </div>
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
            left: 'calc(64px + 4px)',
            right: '4px',
          }"
      >
        <CalendarItem
            :item="item"
            :show-time="true"
            @click="onItemClick"
            @drag-start="$emit('drag-start', $event)"
            @drag-end="$emit('drag-end', $event)"
        />
      </div>
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
import { isToday, parseISO } from '../../scripts/dateUtils.js'
import { calendarModel } from '../../scripts/calendarModel.js'
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
  }
})

const emit = defineEmits(['item-click', 'create', 'reschedule', 'drag-start', 'drag-end'])

const calendar = calendarModel()
const gridRef = ref(null)
const quickFormSlot = ref(null)
const dragOverSlot = ref(null)
const currentTimePosition = ref(null)
let timeUpdateInterval = null

const hours = Array.from({ length: 24 }, (_, i) => i)

const showCurrentTime = computed(() => {
  try {
    return isToday(parseISO(props.date))
  } catch {
    return false
  }
})

const positionedItems = computed(() => {
  const halfHourHeight = props.hourHeight / 2

  return props.items
      .filter(item => calendar.hasTime(item))
      .map(item => {
        const time = calendar.getItemTime(item)
        const [hours, minutes] = time.split(':').map(Number)
        const top = (hours * props.hourHeight) + (minutes / 60) * props.hourHeight
        const height = halfHourHeight - 4

        return {
          ...item,
          top,
          height,
        }
      })
})

function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour} ${period}`
}

function formatTimeSlot(hour, minutes) {
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function onCellClick(hour, half) {
  quickFormSlot.value = { hour, half }
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

function onDragOver(hour, half) {
  dragOverSlot.value = { hour, half }
}

function onDragLeave() {
  // Don't clear here - dragover on new cell will update, drop/dragend will clear
}

function onGridDragEnd() {
  dragOverSlot.value = null
}

function onDrop(hour, half, event) {
  event.preventDefault()
  dragOverSlot.value = null

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      const newTime = formatTimeSlot(hour, half)
      emit('reschedule', { actionId: data.id, newDate: props.date, newTime })
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
  border-bottom: 1px solid var(--color-calendar-grid-line);
  position: relative;
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
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  line-height: 1;
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
}

.time-grid__cell {
  flex: 1;
  cursor: pointer;
  transition: background 0.15s;
}

.time-grid__cell:hover {
  background: var(--color-bg-secondary);
}

.time-grid__cell--drag-over {
  background: var(--color-calendar-deferred) !important;
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
}

.time-grid__items {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
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
  background: var(--color-danger);
  border-radius: 50%;
  margin-left: -6px;
}

.time-grid__now-line {
  flex: 1;
  height: 2px;
  background: var(--color-danger);
}
</style>
