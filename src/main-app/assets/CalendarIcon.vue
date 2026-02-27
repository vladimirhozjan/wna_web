<template>
  <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M17.2 92C14.78 92 12.71 91.12 11 89.4C9.28 87.69 8.4 85.62 8.4 83.2L8.4 21.6C8.4 19.18 9.28 17.11 11 15.4C12.71 13.68 14.78 12.8 17.2 12.8L21.6 12.8L21.6 4L30.4 4L30.4 12.8L65.6 12.8L65.6 4L74.4 4L74.4 12.8L78.8 12.8C81.22 12.8 83.29 13.68 85 15.4C86.72 17.11 87.6 19.18 87.6 21.6L87.6 83.2C87.6 85.62 86.72 87.69 85 89.4C83.29 91.12 81.22 92 78.8 92L17.2 92ZM17.2 83.2L78.8 83.2L78.8 39.2L17.2 39.2L17.2 83.2Z"/>
    <circle v-if="overdue" cx="84" cy="12" r="8" fill="var(--color-danger)"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
})
</script>
