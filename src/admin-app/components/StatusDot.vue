<template>
  <span class="status-dot" :class="`status-dot--${color}`" :title="title"></span>
</template>

<script setup>
defineProps({
  color: {
    type: String,
    default: 'gray',
  },
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot--green {
  background: var(--color-success);
  box-shadow: 0 0 0 2px var(--color-success-light);
}

.status-dot--yellow {
  background: var(--color-warning);
  box-shadow: 0 0 0 2px var(--color-warning-light);
}

.status-dot--red {
  background: var(--color-danger);
  box-shadow: 0 0 0 2px var(--color-danger-light);
}

.status-dot--gray {
  background: var(--color-text-tertiary);
  box-shadow: 0 0 0 2px var(--color-bg-secondary);
}
</style>
