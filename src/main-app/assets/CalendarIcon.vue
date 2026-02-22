<template>
  <svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" class="icon">
    <path fill="currentColor"
        d="M12 40c-1.1 0-2-.4-2.8-1.2C8.4 38 8 37.1 8 36V18c0-1.1.4-2 1.2-2.8C10 14.4 10.9 14 12 14h2V8h4v6h12V8h4v6h2c1.1 0 2 .4 2.8 1.2.8.8 1.2 1.7 1.2 2.8v18c0 1.1-.4 2-1.2 2.8-.8.8-1.7 1.2-2.8 1.2H12Zm0-4h24V24H12v12Z"/>
    <circle v-if="overdue" cx="40" cy="10" r="4" fill="var(--color-danger)"/>
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
