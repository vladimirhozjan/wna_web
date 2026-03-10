<template>
  <input
      ref="inputRef"
      type="date"
      :value="modelValue"
      @input="onInput"
      @change="onInput"
  />
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])
const inputRef = ref(null)

function clampYear(v) {
  if (!v) return v
  const parts = v.split('-')
  if (parts[0] && parts[0].length > 4) {
    return parts[0].slice(0, 4) + '-' + parts.slice(1).join('-')
  }
  return v
}

let clamping = false

function onInput(e) {
  if (clamping) return
  const raw = e.target.value
  const clamped = clampYear(raw)
  if (clamped !== raw && inputRef.value) {
    clamping = true
    const el = inputRef.value
    const wasFocused = document.activeElement === el
    if (wasFocused) el.blur()
    el.value = clamped
    if (wasFocused) el.focus()
    clamping = false
  }
  emit('update:modelValue', clamped || '')
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur()
})
</script>
