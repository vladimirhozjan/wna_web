<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
    <circle v-if="overdue" cx="21" cy="3" r="3" fill="var(--color-danger)" stroke="none"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
})
</script>
