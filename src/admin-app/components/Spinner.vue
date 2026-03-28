<template>
  <div class="spinner-wrapper" :class="`spinner--${size}`">
    <div class="spinner"></div>
  </div>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
  },
})
</script>

<style scoped>
.spinner-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: var(--color-border-light);
  border-top-color: var(--color-action);
  animation: spin 0.8s linear infinite;
}

.spinner--sm .spinner {
  width: 16px;
  height: 16px;
  border-width: 2px;
}

.spinner--md .spinner {
  width: 28px;
  height: 28px;
  border-width: 3px;
}

.spinner--lg .spinner {
  width: 40px;
  height: 40px;
  border-width: 4px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
