<template>
  <div class="dur" ref="wrapper">
    <div class="dur-field" :class="{ 'dur-field--open': open, 'dur-field--disabled': disabled }" @click="toggle">
      <input
          ref="inputRef"
          type="number"
          :value="modelValue"
          class="text-body-m dur-input"
          :style="{ width: inputWidth }"
          min="1"
          :disabled="disabled"
          @input="onInput"
          @focus="open = true"
          @keydown.escape="open = false"
      />
      <span class="text-body-s dur-unit">min</span>
      <svg class="dur-arrow" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div v-if="open" class="dur-dropdown">
      <div
          v-for="opt in OPTIONS"
          :key="opt.value"
          class="text-body-m dur-option"
          :class="{ 'dur-option--active': modelValue === opt.value }"
          @mousedown.prevent="selectOption(opt.value)"
      >
        {{ opt.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
]

const props = defineProps({
  modelValue: { type: [Number, null], default: null },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const wrapper = ref(null)
const inputRef = ref(null)
const open = ref(false)

const inputWidth = computed(() => {
  const chars = String(props.modelValue ?? '').length
  return Math.max(20, chars * 10) + 'px'
})

function toggle() {
  if (props.disabled) return
  inputRef.value?.focus()
}

function onInput(e) {
  const val = parseInt(e.target.value)
  if (val > 0) {
    emit('update:modelValue', val)
  }
}

function selectOption(value) {
  emit('update:modelValue', value)
  open.value = false
}

function onClickOutside(e) {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.dur {
  position: relative;
}

.dur-field {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  cursor: pointer;
}

.dur-field--open {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.dur-field--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dur-input {
  min-width: 20px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  text-align: right;
  -moz-appearance: textfield;
}

.dur-input::-webkit-inner-spin-button,
.dur-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.dur-unit {
  color: var(--color-text-secondary);
  pointer-events: none;
}

.dur-arrow {
  color: var(--color-text-tertiary);
  margin-left: 4px;
  flex-shrink: 0;
}

.dur-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  box-shadow: var(--shadow-modal);
  z-index: 10;
  padding: 4px 0;
}

.dur-option {
  padding: 8px 12px;
  cursor: pointer;
  white-space: nowrap;
}

.dur-option:hover {
  background: var(--color-bg-secondary);
}

.dur-option--active {
  color: var(--color-action);
  font-weight: 600;
}

@media (max-width: 768px) {
  .dur {
    width: 100%;
  }

  .dur-field {
    width: 100%;
    box-sizing: border-box;
  }
}
</style>
