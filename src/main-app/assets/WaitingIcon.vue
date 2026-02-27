<template>
  <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M48 4C23.56 4 4 23.56 4 48C4 72.44 23.56 92 48 92C72.44 92 92 72.44 92 48C92 23.56 72.44 4 48 4ZM48 82.22C28.44 82.22 13.78 67.56 13.78 48C13.78 28.44 28.44 13.78 48 13.78C67.56 13.78 82.22 28.44 82.22 48C82.22 67.56 67.56 82.22 48 82.22ZM50.44 26L43.11 26L43.11 52.89L65.11 67.56L70 60.22L50.44 48L50.44 26Z"/>
    <circle v-if="overdue" cx="84" cy="12" r="8" fill="var(--color-danger)"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
})
</script>
