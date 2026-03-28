<template>
  <div class="widget-card">
    <div class="widget-card-header">
      <h3 class="text-label color-text-secondary">{{ title }}</h3>
      <span v-if="subtitle" class="text-caption color-text-tertiary">{{ subtitle }}</span>
    </div>
    <div class="widget-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.widget-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
  transition: background 0.25s, border-color 0.25s;
}

.widget-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.widget-card-body {
  padding: 16px 20px;
}
</style>
