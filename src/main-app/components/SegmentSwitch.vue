<template>
  <div class="segment-switch" :class="{ 'segment-switch--disabled': disabled }" role="tablist">
    <button
        v-for="option in options"
        :key="option.value"
        class="text-body-s fw-medium segment-switch__option"
        :class="{ 'segment-switch__option--active': modelValue === option.value }"
        role="tab"
        :aria-selected="modelValue === option.value"
        :data-testid="option.testid"
        type="button"
        :disabled="disabled"
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
  disabled: {
    type: Boolean,
    default: false,
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
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  white-space: nowrap;
}

.segment-switch--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.segment-switch--disabled .segment-switch__option {
  cursor: not-allowed;
}

.segment-switch__option:focus {
  outline: none;
}

.segment-switch__option:hover:not(.segment-switch__option--active):not(:disabled) {
  color: var(--color-text-secondary);
  background: var(--color-bg-hover);
}

.segment-switch__option--active {
  background: var(--color-btn-secondary-bg);
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
  box-shadow: 0 1px 3px var(--color-action-shadow);
}

@media (max-width: 768px) {
  .segment-switch__option {
    min-height: var(--touch-target-min);
  }
}
</style>
