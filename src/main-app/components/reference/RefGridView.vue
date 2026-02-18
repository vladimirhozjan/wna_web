<template>
  <div class="grid-view">
    <template v-if="folders.length > 0">
      <RefFolderCard
          v-for="folder in folders"
          :key="'f-' + folder.id"
          :folder="folder"
          @navigate="$emit('navigate-folder', folder.id)"
          @rename="$emit('rename-folder', folder)"
          @delete="$emit('delete-folder', folder)"
      />
    </template>
    <template v-if="files.length > 0">
      <RefFileCard
          v-for="file in files"
          :key="'fi-' + file.id"
          :file="file"
          @preview="$emit('preview-file', file)"
          @download="$emit('download-file', file)"
          @rename="$emit('rename-file', file)"
          @trash="$emit('trash-file', file)"
      />
    </template>
  </div>
  <div v-if="hasMore" class="load-more">
    <Btn variant="ghost" size="sm" @click="$emit('load-more')">Load more</Btn>
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
})

defineEmits([
  'navigate-folder',
  'rename-folder',
  'delete-folder',
  'preview-file',
  'download-file',
  'rename-file',
  'trash-file',
  'load-more',
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
