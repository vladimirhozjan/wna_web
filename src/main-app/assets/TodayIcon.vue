<template>
  <svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <path fill="none" stroke="currentColor" stroke-width="6.77" d="M48 17.54L48 7.38M48 88.62L48 78.46M78.46 48L88.62 48M7.38 48L17.54 48M69.49 26.51L76.77 19.23M19.23 76.77L26.51 69.49M69.49 69.49L76.77 76.77M19.23 19.23L26.51 26.51M48 34.46C55.45 34.46 61.54 40.55 61.54 48C61.54 55.45 55.45 61.54 48 61.54C40.55 61.54 34.46 55.45 34.46 48C34.46 40.55 40.55 34.46 48 34.46Z"/>
    <circle v-if="overdue" cx="84" cy="12" r="8" fill="var(--color-danger)"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
})
</script>
