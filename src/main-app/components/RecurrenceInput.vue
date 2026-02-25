<template>
  <div class="recurrence-input">
    <!-- Frequency -->
    <div class="recurrence-row">
      <label class="recurrence-label">Repeat</label>
      <select v-model="parts.freq" class="recurrence-select" :disabled="disabled" @change="onFreqChanged">
        <option v-for="f in FREQUENCIES" :key="f" :value="f">{{ freqLabel(f) }}</option>
      </select>
    </div>

    <!-- Interval -->
    <div class="recurrence-row">
      <label class="recurrence-label">Every</label>
      <div class="recurrence-interval">
        <input
            type="number"
            v-model.number="parts.interval"
            min="1"
            max="99"
            class="recurrence-number-input"
            :disabled="disabled"
            @change="onChanged"
        />
        <span class="recurrence-interval-unit">{{ intervalUnit }}</span>
      </div>
    </div>

    <!-- Day picker (weekly only) -->
    <div v-if="parts.freq === 'WEEKLY'" class="recurrence-row">
      <label class="recurrence-label">On</label>
      <div class="recurrence-day-picker">
        <button
            v-for="day in WEEKDAYS"
            :key="day.value"
            type="button"
            :class="['recurrence-day-btn', { 'recurrence-day-btn--active': parts.byday.includes(day.value) }]"
            :disabled="disabled"
            @click="toggleDay(day.value)"
        >{{ day.label }}</button>
      </div>
    </div>

    <!-- Day of month (monthly only) -->
    <div v-if="parts.freq === 'MONTHLY'" class="recurrence-row">
      <label class="recurrence-label">Day of month</label>
      <input
          type="number"
          v-model.number="parts.bymonthday"
          min="1"
          max="31"
          class="recurrence-number-input"
          :disabled="disabled"
          @change="onChanged"
      />
    </div>

    <!-- Month and day (yearly only) -->
    <div v-if="parts.freq === 'YEARLY'" class="recurrence-row">
      <label class="recurrence-label">Month</label>
      <select v-model.number="parts.bymonth" class="recurrence-select" :disabled="disabled" @change="onChanged">
        <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>
    </div>
    <div v-if="parts.freq === 'YEARLY'" class="recurrence-row">
      <label class="recurrence-label">Day of month</label>
      <input
          type="number"
          v-model.number="parts.bymonthday"
          min="1"
          :max="maxDayForMonth"
          class="recurrence-number-input"
          :disabled="disabled"
          @change="onChanged"
      />
    </div>

    <!-- End condition -->
    <div class="recurrence-row">
      <label class="recurrence-label">Ends</label>
      <div class="recurrence-end">
        <select v-model="endType" class="recurrence-select" :disabled="disabled" @change="onEndTypeChanged">
          <option value="never">Never</option>
          <option value="count">After N times</option>
          <option value="until">Until date</option>
        </select>
        <input
            v-if="endType === 'count'"
            type="number"
            v-model.number="parts.count"
            min="1"
            max="999"
            class="recurrence-number-input"
            :disabled="disabled"
            @change="onChanged"
        />
        <input
            v-if="endType === 'until'"
            type="date"
            v-model="untilDate"
            class="recurrence-date-input"
            :disabled="disabled"
            @change="onUntilChanged"
        />
      </div>
    </div>

    <!-- Summary -->
    <div v-if="summary" class="recurrence-summary">
      {{ summary }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { FREQUENCIES, WEEKDAYS, parseRRule, buildRRule, describeRRule } from '../scripts/rruleUtils.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const parts = ref(parseRRule(props.modelValue))

// End type tracking
const endType = ref('never')
const untilDate = ref('')

onMounted(() => {
  syncEndType()
})

function syncEndType() {
  if (parts.value.count) {
    endType.value = 'count'
  } else if (parts.value.until) {
    endType.value = 'until'
    // Convert YYYYMMDD to YYYY-MM-DD for date input
    const u = parts.value.until
    untilDate.value = u.includes('-') ? u : u.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')
  } else {
    endType.value = 'never'
  }
}

watch(() => props.modelValue, (val) => {
  parts.value = parseRRule(val)
  syncEndType()
})

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const maxDayForMonth = computed(() => {
  const m = parts.value.bymonth
  if (!m) return 31
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
})

const intervalUnit = computed(() => {
  const units = { DAILY: 'day(s)', WEEKLY: 'week(s)', MONTHLY: 'month(s)', YEARLY: 'year(s)' }
  return units[parts.value.freq] || ''
})

const summary = computed(() => {
  const rrule = buildRRule(parts.value)
  return describeRRule(rrule)
})

function freqLabel(f) {
  return { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' }[f] || f
}

function toggleDay(day) {
  const idx = parts.value.byday.indexOf(day)
  if (idx >= 0) {
    parts.value.byday.splice(idx, 1)
  } else {
    parts.value.byday.push(day)
  }
  onChanged()
}

function onFreqChanged() {
  if (parts.value.freq === 'YEARLY') {
    const now = new Date()
    if (!parts.value.bymonth) parts.value.bymonth = now.getMonth() + 1
    if (!parts.value.bymonthday) parts.value.bymonthday = now.getDate()
  }
  if (parts.value.freq === 'MONTHLY') {
    if (!parts.value.bymonthday) parts.value.bymonthday = new Date().getDate()
  }
  onChanged()
}

function onEndTypeChanged() {
  if (endType.value === 'never') {
    parts.value.count = null
    parts.value.until = null
    untilDate.value = ''
  } else if (endType.value === 'count') {
    parts.value.count = parts.value.count || 10
    parts.value.until = null
    untilDate.value = ''
  } else if (endType.value === 'until') {
    parts.value.count = null
  }
  onChanged()
}

function onUntilChanged() {
  // Convert YYYY-MM-DD to YYYYMMDD for RRULE
  parts.value.until = untilDate.value ? untilDate.value.replace(/-/g, '') : null
  onChanged()
}

function onChanged() {
  emit('update:modelValue', buildRRule(parts.value))
}
</script>

<style scoped>
.recurrence-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recurrence-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recurrence-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 90px;
  flex-shrink: 0;
}

.recurrence-select {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 6px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
}

.recurrence-select:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.recurrence-interval {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recurrence-interval-unit {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
}

.recurrence-number-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 6px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  width: 70px;
  text-align: center;
  outline: none;
}

.recurrence-number-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.recurrence-date-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 6px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
}

.recurrence-date-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.recurrence-day-picker {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.recurrence-day-btn {
  padding: 4px 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.recurrence-day-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.recurrence-day-btn--active {
  background: var(--color-action);
  color: white;
  border-color: var(--color-action);
}

.recurrence-day-btn--active:hover {
  background: var(--color-btn-primary-hover);
}

.recurrence-end {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.recurrence-summary {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  font-style: italic;
  padding: 4px 0;
}

.recurrence-select:disabled,
.recurrence-number-input:disabled,
.recurrence-date-input:disabled,
.recurrence-day-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .recurrence-row {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
  }

  .recurrence-label {
    min-width: auto;
  }

  .recurrence-day-picker {
    justify-content: flex-start;
  }
}
</style>
