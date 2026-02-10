<template>
  <div
      :class="[
        'all-day-section',
        { 'all-day-section--drag-over': isDragOver }
      ]"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="onClick"
  >
    <div class="all-day-section__label">All day</div>
    <div class="all-day-section__content">
      <template v-if="showQuickForm">
        <CalendarQuickForm
            :date="date"
            :time="null"
            @submit="onQuickFormSubmit"
            @cancel="onQuickFormCancel"
        />
      </template>

      <CalendarItem
          v-for="item in items"
          :key="item.id"
          :item="item"
          :show-time="false"
          @click="onItemClick"
          @drag-start="$emit('drag-start', $event)"
          @drag-end="$emit('drag-end', $event)"
      />

      <div v-if="items.length === 0 && !showQuickForm" class="all-day-section__empty">
        Click to add all-day action
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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
  }
})

const emit = defineEmits(['item-click', 'create', 'reschedule', 'drag-start', 'drag-end'])

const isDragOver = ref(false)
const showQuickForm = ref(false)

function onClick(event) {
  if (event.target.closest('.calendar-item') || event.target.closest('.quick-form')) {
    return
  }
  showQuickForm.value = true
}

function onItemClick(item) {
  emit('item-click', item)
}

function onQuickFormSubmit(data) {
  emit('create', data)
  showQuickForm.value = false
}

function onQuickFormCancel() {
  showQuickForm.value = false
}

function onDragOver() {
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event) {
  event.preventDefault()
  isDragOver.value = false

  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.type === 'calendar-item') {
      emit('reschedule', { actionId: data.id, newDate: props.date, newTime: null })
    }
  } catch (e) {
    // Ignore parse errors
  }
}
</script>

<style scoped>
.all-day-section {
  display: flex;
  border-bottom: 1px solid var(--color-calendar-grid-line);
  min-height: 48px;
  background: var(--color-bg-primary);
  transition: background 0.15s;
}

.all-day-section--drag-over {
  background: var(--color-calendar-deferred);
  outline: 2px dashed var(--color-action);
  outline-offset: -2px;
}

.all-day-section__label {
  flex-shrink: 0;
  width: 64px;
  padding: 4px 8px;
  font-family: var(--font-family-default);
  font-size: var(--font-size-footnote);
  color: var(--color-calendar-hour-text);
  text-align: right;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.all-day-section__content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  cursor: pointer;
  border-left: 1px solid var(--color-calendar-grid-line);
}

.all-day-section__empty {
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
}
</style>
