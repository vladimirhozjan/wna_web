<template>
  <div class="calendar-header">
    <div class="calendar-header__nav">
      <button class="calendar-header__nav-btn" @click="$emit('prev')" aria-label="Previous">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="calendar-header__today-btn" @click="$emit('today')">Today</button>
      <button class="calendar-header__nav-btn" @click="$emit('next')" aria-label="Next">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <div class="calendar-header__title-wrapper">
      <h2 class="calendar-header__title">{{ title }}</h2>
      <span v-if="loading" class="calendar-header__spinner"></span>
    </div>

    <div class="calendar-header__views">
      <button
          v-for="view in views"
          :key="view.value"
          :class="['calendar-header__view-btn', { 'calendar-header__view-btn--active': viewMode === view.value }]"
          @click="$emit('view-change', view.value)"
      >
        {{ view.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatMonthYear, formatDate, format } from '../../scripts/dateUtils.js'

const props = defineProps({
  currentDate: {
    type: Date,
    required: true
  },
  viewMode: {
    type: String,
    required: true,
    validator: v => ['day', 'week', 'month', 'year'].includes(v)
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['prev', 'next', 'today', 'view-change'])

const views = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
]

const title = computed(() => {
  switch (props.viewMode) {
    case 'day':
      return format(props.currentDate, 'EEEE, MMMM d, yyyy')
    case 'week':
      return formatMonthYear(props.currentDate)
    case 'month':
      return formatMonthYear(props.currentDate)
    case 'year':
      return format(props.currentDate, 'yyyy')
    default:
      return formatMonthYear(props.currentDate)
  }
})
</script>

<style scoped>
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  gap: 16px;
  flex-wrap: wrap;
}

.calendar-header__nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-header__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.calendar-header__nav-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-text-tertiary);
}

.calendar-header__today-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.calendar-header__today-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-tertiary);
}

.calendar-header__title-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 200px;
}

.calendar-header__title {
  font-family: var(--font-family-default);
  font-size: var(--font-size-h4);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.calendar-header__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: header-spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes header-spin {
  to {
    transform: rotate(360deg);
  }
}

.calendar-header__views {
  display: flex;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  overflow: hidden;
}

.calendar-header__view-btn {
  padding: 8px 16px;
  border: none;
  border-right: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-family: var(--font-family-default);
  font-size: var(--font-size-body-s);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.calendar-header__view-btn:last-child {
  border-right: none;
}

.calendar-header__view-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.calendar-header__view-btn--active {
  background: var(--color-action);
  color: white;
}

.calendar-header__view-btn--active:hover {
  background: var(--color-btn-primary-hover);
  color: white;
}

@media (max-width: 640px) {
  .calendar-header {
    flex-direction: column;
    align-items: stretch;
  }

  .calendar-header__nav {
    order: 2;
    justify-content: center;
  }

  .calendar-header__title {
    order: 1;
    text-align: center;
  }

  .calendar-header__views {
    order: 3;
    justify-content: center;
  }

  .calendar-header__view-btn {
    flex: 1;
    text-align: center;
  }
}
</style>
