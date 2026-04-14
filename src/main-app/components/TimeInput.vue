<template>
  <div class="ti" ref="wrapper">
    <div class="ti-field" :class="{ 'ti-field--open': open, 'ti-field--disabled': disabled }" @click="focusHour">
      <input
          ref="hourRef"
          type="number"
          :value="displayHour"
          class="text-body-m ti-input"
          :style="{ width: hourWidth }"
          :min="is12h ? 1 : 0"
          :max="is12h ? 12 : 23"
          :disabled="disabled"
          @input="onHourInput"
          @focus="open = 'hour'"
          @keydown.escape="open = null"
      />
      <span class="text-body-m ti-sep">:</span>
      <input
          ref="minuteRef"
          type="number"
          :value="displayMinute"
          class="text-body-m ti-input"
          style="width: 24px"
          min="0"
          max="59"
          :disabled="disabled"
          @input="onMinuteInput"
          @focus="open = 'minute'"
          @keydown.escape="open = null"
      />
      <span v-if="is12h" class="text-body-m ti-period" @click.stop="togglePeriod">{{ period }}</span>
      <ChevronDownIcon class="ti-arrow" width="10" height="6" />
    </div>
    <!-- Hour dropdown -->
    <div v-if="open === 'hour'" class="ti-dropdown">
      <div
          v-for="h in hourOptions"
          :key="h.value"
          class="text-body-m ti-option"
          :class="{ 'ti-option--active': h.value === hour }"
          @mousedown.prevent="selectHour(h.value)"
      >{{ h.label }}</div>
    </div>
    <!-- Minute dropdown -->
    <div v-if="open === 'minute'" class="ti-dropdown">
      <div
          v-for="m in minuteOptions"
          :key="m"
          class="text-body-m ti-option"
          :class="{ 'ti-option--active': m === minute }"
          @mousedown.prevent="selectMinute(m)"
      >{{ String(m).padStart(2, '0') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { settingsModel } from '../scripts/models/settingsModel.js'
import ChevronDownIcon from '../assets/ChevronDownIcon.vue'

const props = defineProps({
  modelValue: { type: [String, null], default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const settings = settingsModel()
const wrapper = ref(null)
const hourRef = ref(null)
const minuteRef = ref(null)
const open = ref(null)

const is12h = computed(() => settings.getCalendarSettings().timeFormat === '12h')

const hour24 = computed(() => {
  if (!props.modelValue) return 9
  return parseInt(props.modelValue.split(':')[0]) || 0
})

const minute = computed(() => {
  if (!props.modelValue) return 0
  return parseInt(props.modelValue.split(':')[1]) || 0
})

const period = computed(() => hour24.value >= 12 ? 'PM' : 'AM')

const hour = computed(() => {
  if (!is12h.value) return hour24.value
  const h = hour24.value % 12
  return h === 0 ? 12 : h
})

const displayHour = computed(() => {
  if (is12h.value) return String(hour.value)
  return String(hour.value).padStart(2, '0')
})

const displayMinute = computed(() => String(minute.value).padStart(2, '0'))

const hourWidth = computed(() => {
  const chars = displayHour.value.length
  return Math.max(20, chars * 10) + 'px'
})

const hourOptions = computed(() => {
  if (is12h.value) {
    return Array.from({ length: 12 }, (_, i) => {
      const val = i === 0 ? 12 : i
      return { value: val, label: String(val) }
    })
  }
  return Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: String(i).padStart(2, '0'),
  }))
})

const minuteOptions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function to24h(h, p) {
  if (!is12h.value) return h
  if (p === 'AM') return h === 12 ? 0 : h
  return h === 12 ? 12 : h + 12
}

function emitTime(h24, m) {
  const hh = String(h24).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  emit('update:modelValue', `${hh}:${mm}`)
}

function focusHour() {
  if (props.disabled) return
  hourRef.value?.focus()
}

function onHourInput(e) {
  const val = parseInt(e.target.value)
  if (isNaN(val)) return
  if (is12h.value) {
    if (val < 1 || val > 12) return
    emitTime(to24h(val, period.value), minute.value)
  } else {
    if (val < 0 || val > 23) return
    emitTime(val, minute.value)
  }
}

function onMinuteInput(e) {
  const val = parseInt(e.target.value)
  if (isNaN(val) || val < 0 || val > 59) return
  emitTime(hour24.value, val)
}

function selectHour(h) {
  emitTime(to24h(h, period.value), minute.value)
  open.value = 'minute'
  minuteRef.value?.focus()
}

function selectMinute(m) {
  emitTime(hour24.value, m)
  open.value = null
}

function togglePeriod() {
  if (props.disabled) return
  const newPeriod = period.value === 'AM' ? 'PM' : 'AM'
  emitTime(to24h(hour.value, newPeriod), minute.value)
}

function onClickOutside(e) {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    open.value = null
  }
}

function focus() {
  hourRef.value?.focus()
}

defineExpose({ focus })

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.ti {
  position: relative;
}

.ti-field {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  cursor: pointer;
}

.ti-field--open {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.ti-field--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ti-input {
  min-width: 20px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  text-align: center;
  -moz-appearance: textfield;
}

.ti-input::-webkit-inner-spin-button,
.ti-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ti-sep {
  color: var(--color-text-primary);
  pointer-events: none;
}

.ti-period {
  color: var(--color-text-secondary);
  margin-left: 4px;
  cursor: pointer;
  padding: 0 2px;
  border-radius: 3px;
}

.ti-period:hover {
  background: var(--color-bg-secondary);
}

.ti-arrow {
  color: var(--color-text-tertiary);
  margin-left: 6px;
  flex-shrink: 0;
}

.ti-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  box-shadow: var(--shadow-modal);
  z-index: 10;
  padding: 4px 0;
}

.ti-option {
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
}

.ti-option:hover {
  background: var(--color-bg-secondary);
}

.ti-option--active {
  color: var(--color-action);
  font-weight: 600;
}

@media (max-width: 768px) {
  .ti {
    width: 100%;
  }

  .ti-field {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
