<template>
  <EmptyState
    :icon="FilterLargeIcon"
    :title="title"
    :text="'Nothing tagged with \'' + tags.join(', ') + '\' needs attention right now.'"
  />
</template>

<script setup>
import EmptyState from './EmptyState.vue'
import FilterLargeIcon from '../assets/FilterLargeIcon.vue'

defineProps({
  title: { type: String, default: 'No items for this context' },
  tags: { type: Array, required: true },
})
</script>
