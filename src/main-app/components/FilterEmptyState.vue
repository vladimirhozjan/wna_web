<template>
  <EmptyState
    :illustration="FilterIllustration"
    :title="title"
    :text="'Nothing tagged \'' + tags.join(', ') + '\' needs you right now. Clear the filter to see everything.'"
  />
</template>

<script setup>
import EmptyState from './EmptyState.vue'
import FilterIllustration from './illustrations/FilterIllustration.vue'

defineProps({
  title: { type: String, default: 'Nothing in this context' },
  tags: { type: Array, required: true },
})
</script>
