<template>
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="icon">
    <g transform="translate(24,24) scale(0.55) translate(-32,-32)">
      <path fill="currentColor" d="M27 52L31 35H20L37 12L33 29H44L27 52Z"/>
    </g>
    <circle v-if="overdue" cx="36" cy="13" r="4" fill="var(--color-danger)"/>
  </svg>
</template>

<script setup>
defineProps({
  overdue: { type: Boolean, default: false },
});
</script>

<style scoped>
.icon {
  width: 48px;
  height: 48px;
}
</style>
