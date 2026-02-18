<template>
  <div class="list-view">
    <table class="list-table">
      <thead>
        <tr>
          <th class="col-icon"></th>
          <th class="col-name">Name</th>
          <th class="col-size">Size</th>
          <th class="col-modified">Created</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        <!-- Folders -->
        <tr
            v-for="folder in folders"
            :key="'f-' + folder.id"
            class="list-row list-row--folder"
            @click="$emit('navigate-folder', folder.id)"
        >
          <td class="col-icon">
            <FolderIcon class="row-icon row-icon--folder" />
          </td>
          <td class="col-name">{{ folder.name }}</td>
          <td class="col-size">&mdash;</td>
          <td class="col-modified">{{ formatDate(folder.created_at) }}</td>
          <td class="col-actions" @click.stop>
            <Dropdown align="right" title="Folder actions">
              <template #trigger>
                <button class="row-menu-btn" type="button">&#8230;</button>
              </template>
              <template #default="{ close }">
                <button class="dropdown-item" @click="close(); $emit('rename-folder', folder)">
                  <RenameIcon class="dropdown-item-icon" /> Rename
                </button>
                <button class="dropdown-item dropdown-item--danger" @click="close(); $emit('delete-folder', folder)">
                  <TrashIcon class="dropdown-item-icon" /> Delete
                </button>
              </template>
            </Dropdown>
          </td>
        </tr>

        <!-- Files -->
        <tr
            v-for="file in files"
            :key="'fi-' + file.id"
            class="list-row list-row--file"
            @click="$emit('preview-file', file)"
        >
          <td class="col-icon">
            <RefFileIcon class="row-icon" :mime-type="file.mime_type" />
          </td>
          <td class="col-name">{{ file.name }}</td>
          <td class="col-size">{{ formatSize(file.size) }}</td>
          <td class="col-modified">{{ formatDate(file.created_at) }}</td>
          <td class="col-actions" @click.stop>
            <Dropdown align="right" title="File actions">
              <template #trigger>
                <button class="row-menu-btn" type="button">&#8230;</button>
              </template>
              <template #default="{ close }">
                <button class="dropdown-item" @click="close(); $emit('download-file', file)">
                  <DownloadIcon class="dropdown-item-icon" /> Download
                </button>
                <button class="dropdown-item" @click="close(); $emit('rename-file', file)">
                  <RenameIcon class="dropdown-item-icon" /> Rename
                </button>
                <button class="dropdown-item dropdown-item--danger" @click="close(); $emit('trash-file', file)">
                  <TrashIcon class="dropdown-item-icon" /> Move to Trash
                </button>
              </template>
            </Dropdown>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-if="hasMore" class="load-more">
    <Btn variant="ghost" size="sm" @click="$emit('load-more')">Load more</Btn>
  </div>
</template>

<script setup>
import FolderIcon from '../../assets/FolderIcon.vue'
import RefFileIcon from './RefFileIcon.vue'
import Dropdown from '../Dropdown.vue'
import Btn from '../Btn.vue'
import DownloadIcon from '../../assets/DownloadIcon.vue'
import RenameIcon from '../../assets/RenameIcon.vue'
import TrashIcon from '../../assets/TrashIcon.vue'

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

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return d.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
  }
  return d.toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'})
}
</script>

<style scoped>
.list-view {
  overflow-x: auto;
}

.list-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
}

.list-table thead th {
  text-align: left;
  padding: 8px 12px;
  font-size: var(--font-size-body-s);
  font-weight: 500;
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border-light);
  white-space: nowrap;
}

.list-row {
  cursor: pointer;
  transition: background 0.1s;
}

.list-row:hover {
  background: var(--color-bg-hover);
}

.list-row td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
  white-space: nowrap;
}

.col-icon {
  width: 40px;
}

.col-name {
  min-width: 200px;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.col-size {
  width: 80px;
  color: var(--color-text-secondary);
}

.col-modified {
  width: 120px;
  color: var(--color-text-secondary);
}

.col-actions {
  width: 40px;
  text-align: center;
}

.row-icon {
  width: 28px;
  height: 28px;
  display: block;
}

.row-icon--folder {
  color: var(--color-action);
}

.row-menu-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s;
}

.list-row:hover .row-menu-btn {
  opacity: 1;
}

@media (pointer: coarse) {
  .row-menu-btn {
    opacity: 1;
  }
}

.row-menu-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}

/* Hide size and modified columns on mobile */
@media (max-width: 600px) {
  .col-size,
  .col-modified {
    display: none;
  }
}
</style>
