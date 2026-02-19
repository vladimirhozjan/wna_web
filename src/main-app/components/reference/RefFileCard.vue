<template>
  <div class="file-card" @click="$emit('preview', file)">
    <RefFileIcon class="file-card__icon" :mime-type="file.mime_type" />
    <FileName class="file-card__name" :name="file.name" />
    <span class="file-card__size">{{ formatSize(file.size_bytes) }}</span>
    <div class="file-card__actions" @click.stop>
      <Dropdown align="right" title="File actions">
        <template #trigger>
          <button class="file-card__menu-btn" type="button"><MoreIcon class="menu-btn-icon" /></button>
        </template>
        <template #default="{ close }">
          <button class="dropdown-item" @click="close(); $emit('download', file)">
            <DownloadIcon class="dropdown-item-icon" /> Download
          </button>
          <button class="dropdown-item" @click="close(); $emit('rename', file)">
            <RenameIcon class="dropdown-item-icon" /> Rename
          </button>
          <button class="dropdown-item dropdown-item--danger" @click="close(); $emit('trash', file)">
            <TrashIcon class="dropdown-item-icon" /> Move to Trash
          </button>
        </template>
      </Dropdown>
    </div>
  </div>
</template>

<script setup>
import RefFileIcon from './RefFileIcon.vue'
import FileName from './FileName.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import Dropdown from '../Dropdown.vue'
import DownloadIcon from '../../assets/DownloadIcon.vue'
import RenameIcon from '../../assets/RenameIcon.vue'
import TrashIcon from '../../assets/TrashIcon.vue'

defineProps({
  file: {
    type: Object,
    required: true,
  },
})

defineEmits(['preview', 'download', 'rename', 'trash'])

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
</script>

<style scoped>
.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.file-card:hover {
  background: var(--color-bg-hover);
}

.file-card__icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.file-card__name {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  text-align: center;
  max-width: 100%;
}

.file-card__size {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
}

.file-card__actions {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}

.file-card:hover .file-card__actions {
  opacity: 1;
}

@media (pointer: coarse) {
  .file-card__actions {
    opacity: 1;
  }
}

.file-card__menu-btn {
  background: none;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  border-radius: 4px;
}

.menu-btn-icon {
  width: 18px;
  height: 18px;
}

.file-card__menu-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

</style>
