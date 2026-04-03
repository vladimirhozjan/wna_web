<template>
  <span class="badge" :class="`badge--${type}`">
    <span class="badge__dot" v-if="type !== 'draft'"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'primary', // primary, active, pending, failed, draft
  },
  label: {
    type: String,
    default: '',
  }
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  line-height: 1.5;
  white-space: nowrap;
}

.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
}

.badge--primary {
  background: var(--color-bg-accent-light);
  color: var(--color-action);
}

.badge--active {
  background: var(--color-success-light);
  color: var(--color-success);
}

.badge--pending {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.badge--failed {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.badge--draft {
  background: var(--color-bg-secondary);
  color: var(--color-text-tertiary);
}
</style>
