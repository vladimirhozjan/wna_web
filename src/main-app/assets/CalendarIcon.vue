<template>
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="icon">
    <path fill="currentColor"
        d="M17 34c-.55 0-1.02-.2-1.41-.59C15.2 33.02 15 32.55 15 32V18c0-.55.2-1.02.59-1.41C15.98 16.2 16.45 16 17 16h1v-2h2v2h8v-2h2v2h1c.55 0 1.02.2 1.41.59.39.39.59.86.59 1.41v14c0 .55-.2 1.02-.59 1.41-.39.39-.86.59-1.41.59H17Zm0-2h14V22H17v10Z"/>
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
