<template>
  <nav class="breadcrumb">
    <Btn variant="link" size="sm" class="breadcrumb__btn" @click="$emit('navigate', null)">My Files</Btn>
    <template v-for="crumb in breadcrumbs" :key="crumb.id">
      <ChevronRightIcon class="breadcrumb__chevron" />
      <Btn variant="link" size="sm" class="breadcrumb__btn" @click="$emit('navigate', crumb.id)">{{ crumb.name }}</Btn>
    </template>
  </nav>
</template>

<script setup>
import Btn from '../Btn.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'

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
  gap: 0;
  flex-wrap: wrap;
  min-width: 0;
}

.breadcrumb__btn {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb__btn:last-child {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.breadcrumb__chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
</style>
