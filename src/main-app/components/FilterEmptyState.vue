<template>
  <FilterLargeIcon class="filter-empty__icon" />
  <h2 class="filter-empty__title">{{ title }}</h2>
  <p class="filter-empty__text">Nothing tagged with "{{ tags.join(', ') }}" needs attention right now.</p>
</template>

<script setup>
import FilterLargeIcon from '../assets/FilterLargeIcon.vue'

defineProps({
  title: { type: String, default: 'No items for this context' },
  tags: { type: Array, required: true },
})
</script>

<style scoped>
.filter-empty__icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.filter-empty__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.filter-empty__text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}
</style>
