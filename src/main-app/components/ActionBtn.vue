<template>
  <button
      v-if="!loading"
      :class="classes"
      @click="$emit('click', $event)"
  >
    <slot>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.972 13.824L0 12.852L5.904 6.912L0 0.972L0.972 0L6.876 5.94L12.744 0L13.716 0.972L7.812 6.912L13.716 12.852L12.744 13.824L6.876 7.92L0.972 13.824Z" fill="currentColor"/>
      </svg>
    </slot>
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
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: var(--font-size-xs);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn--danger {
  color: var(--color-danger-soft);
}

.action-btn--danger:hover {
  background: var(--color-danger-light);
}

.action-btn--primary {
  color: var(--color-action);
}

.action-btn--primary:hover {
  background: var(--color-action-bg-light);
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
