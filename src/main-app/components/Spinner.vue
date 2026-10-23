<template>
  <span class="spinner" :class="{ 'spinner--delayed': delayed }" :style="style"></span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: { type: Number, default: 24 },
  delayed: { type: Boolean, default: false }
})

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  borderWidth: props.size > 24 ? '3px' : '2px'
}))
</script>

<style scoped>
.spinner {
  display: inline-block;
  border-style: solid;
  border-color: var(--spinner-track, var(--color-border-light));
  border-top-color: var(--spinner-indicator, var(--color-action));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

/* Fast loads finish before it shows, so the empty state doesn't flash a spinner first */
.spinner--delayed {
  animation: spin 0.8s linear infinite, spinner-appear 150ms 300ms both;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes spinner-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
