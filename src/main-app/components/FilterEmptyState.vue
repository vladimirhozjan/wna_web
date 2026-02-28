<template>
  <FilterLargeIcon class="filter-empty__icon" />
  <h2 class="text-h3 filter-empty__title">{{ title }}</h2>
  <p class="text-body-m filter-empty__text">Nothing tagged with "{{ tags.join(', ') }}" needs attention right now.</p>
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
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.filter-empty__text {
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}
</style>
