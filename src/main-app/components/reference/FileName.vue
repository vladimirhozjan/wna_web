<template>
  <span class="filename" :title="name">
    <span class="filename__start">{{ stem }}</span><span v-if="ext" class="filename__end">{{ ext }}</span>
  </span>
</template>

<script setup>
import {computed} from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: '',
  },
})

const stem = computed(() => {
  const name = props.name || ''
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx > 3 && dotIdx < name.length - 1) return name.slice(0, dotIdx - 3)
  return name
})

const ext = computed(() => {
  const name = props.name || ''
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx > 3 && dotIdx < name.length - 1) return name.slice(dotIdx - 3)
  return ''
})
</script>

<style scoped>
.filename {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
}

.filename__start {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 0 1 auto;
}

.filename__end {
  white-space: nowrap;
  flex: 0 0 auto;
}
</style>
