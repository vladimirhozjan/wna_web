<template>
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/>
    <circle v-if="overdue" cx="21" cy="3" r="3" fill="var(--color-danger)"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
})
</script>
