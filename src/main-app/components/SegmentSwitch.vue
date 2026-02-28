<template>
  <div class="segment-switch" role="tablist">
    <button
        v-for="option in options"
        :key="option.value"
        class="segment-switch__option"
        :class="{ 'segment-switch__option--active': modelValue === option.value }"
        role="tab"
        :aria-selected="modelValue === option.value"
        type="button"
        @click="$emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  options: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.segment-switch {
  display: inline-flex;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
}

.segment-switch__option {
  background: none;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  white-space: nowrap;
}

.segment-switch__option:focus {
  outline: none;
}

.segment-switch__option:hover:not(.segment-switch__option--active) {
  color: var(--color-text-secondary);
  background: var(--color-bg-hover);
}

.segment-switch__option--active {
  background: var(--color-btn-ghost-bg);
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 1px 3px var(--color-action-shadow);
}
</style>
