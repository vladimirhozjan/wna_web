<template>
  <span class="item-type-icon" :class="colorClass">
    <InboxIcon v-if="type === 'STUFF'" />
    <NextIcon v-else-if="type === 'ACTION'" />
    <ProjectsIcon v-else-if="type === 'PROJECT'" />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import InboxIcon from '../assets/InboxIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'

const props = defineProps({
  type: { type: String, required: true },
})

const colorClass = computed(() => {
  switch (props.type) {
    case 'STUFF': return 'item-type-icon--stuff'
    case 'ACTION': return 'item-type-icon--action'
    case 'PROJECT': return 'item-type-icon--project'
    default: return ''
  }
})
</script>

<style scoped>
.item-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-type-icon :deep(svg) {
  width: 40px;
  height: 40px;
  padding: 5px;
  box-sizing: border-box;
}

.item-type-icon--stuff {
  color: var(--color-text-secondary);
}

.item-type-icon--action {
  color: var(--color-action);
}

.item-type-icon--project {
  color: var(--color-project);
}
</style>
