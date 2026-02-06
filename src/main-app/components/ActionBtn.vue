<template>
  <button
      v-if="!loading"
      :class="classes"
      @click="$emit('click', $event)"
  >
    <slot>✕</slot>
  </button>
  <span v-else class="action-btn-spinner"></span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'danger' // danger, primary, default
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['click'])

const classes = computed(() => [
  'action-btn',
  props.variant === 'danger' ? 'action-btn--danger' : '',
  props.variant === 'primary' ? 'action-btn--primary' : ''
])
</script>

<style scoped>
.action-btn {
  padding: 4px 8px;
  border: none;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn--danger {
  color: var(--color-danger);
}

.action-btn--danger:hover {
  background: var(--color-danger-light);
}

.action-btn--primary {
  color: var(--color-action);
}

.action-btn--primary:hover {
  background: rgba(37, 99, 235, 0.1);
}

.action-btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
