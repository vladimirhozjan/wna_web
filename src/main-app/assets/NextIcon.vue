<template>
  <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M37 92L45.8 54.6L21.6 54.6L59 4L50.2 41.4L74.4 41.4L37 92Z"/>
    <circle v-if="overdue" cx="84" cy="12" r="8" fill="var(--color-danger)"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
})
</script>
