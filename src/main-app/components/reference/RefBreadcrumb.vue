<template>
  <nav class="breadcrumb">
    <Btn
        variant="link"
        size="sm"
        class="breadcrumb__btn"
        :class="{ 'breadcrumb__btn--drop-target': dropTargetId === 'root' }"
        @click="$emit('navigate', null)"
        @dragover.prevent.stop="onDragOver('root')"
        @dragleave.prevent.stop="onDragLeave('root')"
        @drop.prevent.stop="onDrop(null)"
    >My Files</Btn>
    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
      <ChevronRightIcon class="breadcrumb__chevron" />
      <Btn
          variant="link"
          size="sm"
          class="breadcrumb__btn"
          :class="{ 'breadcrumb__btn--drop-target': dropTargetId === crumb.id, 'breadcrumb__btn--current': index === breadcrumbs.length - 1 }"
          @click="$emit('navigate', crumb.id)"
          @dragover.prevent.stop="index < breadcrumbs.length - 1 ? onDragOver(crumb.id) : undefined"
          @dragleave.prevent.stop="onDragLeave(crumb.id)"
          @drop.prevent.stop="index < breadcrumbs.length - 1 ? onDrop(crumb.id) : undefined"
      >{{ crumb.name }}</Btn>
    </template>
  </nav>
</template>

<script setup>
import {ref} from 'vue'
import Btn from '../Btn.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'
import { dragModel } from '../../scripts/models/dragModel.js'

const drag = dragModel()
const dropTargetId = ref(null)

defineProps({
  breadcrumbs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['navigate', 'move-file'])

function onDragOver(id) {
  if (!drag.state.isDragging || drag.state.sourceType !== 'reference') return
  dropTargetId.value = id
}

function onDragLeave(id) {
  if (dropTargetId.value === id) {
    dropTargetId.value = null
  }
}

function onDrop(folderId) {
  dropTargetId.value = null
  if (!drag.state.isDragging || drag.state.sourceType !== 'reference') return
  const fileId = drag.state.draggedItem?.id
  if (fileId) {
    emit('move-file', { fileId, targetFolderId: folderId })
  }
}
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

.breadcrumb__btn--current {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.breadcrumb__btn--drop-target {
  background: rgba(65, 133, 222, 0.12);
  border-radius: 4px;
  outline: 2px dashed var(--color-action);
  outline-offset: 1px;
}

.breadcrumb__chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}
</style>
