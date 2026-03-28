<template>
  <div class="search-input">
    <svg class="search-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.5"/>
      <line x1="10.5" y1="10.5" x2="15" y2="15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <input
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        type="text"
        class="text-body-s"
        @input="onInput"
        @keydown.escape="onClear"
    />
    <button
        v-if="modelValue"
        type="button"
        class="clear-btn"
        @click="onClear"
        aria-label="Clear search"
    >
      &times;
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
  debounce: {
    type: Number,
    default: 300,
  },
})

const emit = defineEmits(['update:modelValue'])
const inputRef = ref(null)

let timer = null

function onInput(e) {
  const val = e.target.value
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    emit('update:modelValue', val)
  }, props.debounce)
}

function onClear() {
  if (timer) clearTimeout(timer)
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

defineExpose({
  focus() {
    inputRef.value?.focus()
  }
})
</script>

<style scoped>
.search-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 320px;
}

.search-icon {
  position: absolute;
  left: 10px;
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

input {
  width: 100%;
  padding: 8px 32px 8px 34px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

input::placeholder {
  color: var(--color-text-prefill);
}

.clear-btn {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  font-size: var(--font-size-lg);
  padding: 2px 6px;
  line-height: var(--lh-none);
  border-radius: 4px;
}

.clear-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}
</style>
