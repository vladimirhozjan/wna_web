<template>
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="icon">
    <path fill="currentColor"
          d="M24 15C19 15 15 19 15 24C15 29 19 33 24 33C29 33 33 29 33 24C33 19 29 15 24 15ZM24 31C20 31 17 28 17 24C17 20 20 17 24 17C28 17 31 20 31 24C31 28 28 31 24 31ZM24.5 19.5H23V25L27.5 28L28.5 26.5L24.5 24V19.5Z"/>
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
