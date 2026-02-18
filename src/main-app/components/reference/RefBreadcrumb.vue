<template>
  <nav class="breadcrumb">
    <button class="breadcrumb__item" @click="$emit('navigate', null)">My Files</button>
    <template v-for="crumb in breadcrumbs" :key="crumb.id">
      <span class="breadcrumb__sep">/</span>
      <button class="breadcrumb__item" @click="$emit('navigate', crumb.id)">{{ crumb.name }}</button>
    </template>
  </nav>
</template>

<script setup>
defineProps({
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['navigate'])
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
  min-width: 0;
}

.breadcrumb__item {
  background: none;
  border: none;
  padding: 4px 6px;
  border-radius: 4px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  cursor: pointer;
  white-space: nowrap;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.breadcrumb__item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.breadcrumb__item:last-child {
  color: var(--color-text-primary);
  font-weight: 600;
}

.breadcrumb__sep {
  color: var(--color-text-tertiary);
  font-size: var(--font-size-body-s);
  user-select: none;
}
</style>
