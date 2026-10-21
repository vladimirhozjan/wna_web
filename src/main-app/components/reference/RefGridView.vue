<template>
  <div class="grid-view">
    <template v-if="folders.length > 0">
      <RefFolderCard
          v-for="folder in folders"
          :key="'f-' + folder.id"
          :folder="folder"
          :move-side="moveSide"
          :writes-disabled="writesDisabled"
          @navigate="$emit('navigate-folder', folder.id)"
          @rename="$emit('rename-folder', folder)"
          @delete="$emit('delete-folder', folder)"
          @move-file="$emit('move-file', $event)"
          @move-side="$emit('move-side-folder', folder)"
      />
    </template>
    <RefFileCard
        v-for="file in files"
        :key="'fi-' + file.id"
        :file="file"
        :mode="mode"
        :move-side="moveSide"
        :writes-disabled="writesDisabled"
        @preview="$emit('preview-file', file)"
        @download="$emit('download-file', file)"
        @rename="$emit('rename-file', file)"
        @trash="$emit('trash-file', file)"
        @restore="$emit('restore-file', file)"
        @subtitle-click="$emit('subtitle-click', file)"
        @move-side="$emit('move-side-file', file)"
    />
  </div>
  <div v-if="hasMore" class="load-more">
    <Btn variant="secondary" size="sm" @click="$emit('load-more')">Load more</Btn>
  </div>
</template>

<script setup>
import RefFolderCard from './RefFolderCard.vue'
import RefFileCard from './RefFileCard.vue'
import Btn from '../Btn.vue'

defineProps({
  folders: {
    type: Array,
    default: () => [],
  },
  files: {
    type: Array,
    default: () => [],
  },
  hasMore: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'file',
  },
  moveSide: {
    type: Object,
    default: null,
  },
  writesDisabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits([
  'navigate-folder',
  'rename-folder',
  'delete-folder',
  'preview-file',
  'download-file',
  'rename-file',
  'trash-file',
  'restore-file',
  'subtitle-click',
  'load-more',
  'move-file',
  'move-side-file',
  'move-side-folder',
])
</script>

<style scoped>
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}
</style>
