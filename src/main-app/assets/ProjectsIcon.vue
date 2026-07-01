<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    <circle v-if="stalled" cx="21" cy="3" r="3" fill="var(--color-danger)" stroke="none"/>
  </svg>
</template>

<script setup>
defineProps({
  stalled: { type: Boolean, default: false },
})
</script>
