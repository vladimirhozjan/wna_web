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
          @move-file="$emit('move-file', $event)"
      />
    </template>
    <template v-for="section in sections" :key="'s-' + section.key">
      <h3 v-if="section.label" class="text-body-s fw-semibold grid-section" :data-testid="'ref-section-' + section.key">{{ section.label }}</h3>
      <RefFileCard
          v-for="file in section.files"
          :key="'fi-' + file.id"
          :file="file"
          :mode="mode"
          @preview="$emit('preview-file', file)"
          @download="$emit('download-file', file)"
          @rename="$emit('rename-file', file)"
          @trash="$emit('trash-file', file)"
          @restore="$emit('restore-file', file)"
          @subtitle-click="$emit('subtitle-click', file)"
      />
    </template>
  </div>
  <div v-if="hasMore" class="load-more">
    <Btn variant="secondary" size="sm" @click="$emit('load-more')">Load more</Btn>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import RefFolderCard from './RefFolderCard.vue'
import RefFileCard from './RefFileCard.vue'
import Btn from '../Btn.vue'
import {providerSections} from '../../scripts/models/referenceModel.js'

const props = defineProps({
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
])

const sections = computed(() => providerSections(props.files))
</script>

<style scoped>
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  padding: 16px;
}

.grid-section {
  grid-column: 1 / -1;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}
</style>
