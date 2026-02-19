<template>
  <div class="folder-card" @click="$emit('navigate', folder.id)">
    <FolderIcon class="folder-card__icon" />
    <FileName class="folder-card__name" :name="folder.name" />
    <div class="folder-card__actions" @click.stop>
      <Dropdown align="right" title="Folder actions">
        <template #trigger>
          <button class="folder-card__menu-btn" type="button"><MoreIcon class="menu-btn-icon" /></button>
        </template>
        <template #default="{ close }">
          <button class="dropdown-item" @click="close(); $emit('rename', folder)">
            <RenameIcon class="dropdown-item-icon" /> Rename
          </button>
          <button class="dropdown-item dropdown-item--danger" @click="close(); $emit('delete', folder)">
            <TrashIcon class="dropdown-item-icon" /> Delete
          </button>
        </template>
      </Dropdown>
    </div>
  </div>
</template>

<script setup>
import FolderIcon from '../../assets/FolderIcon.vue'
import FileName from './FileName.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import Dropdown from '../Dropdown.vue'
import RenameIcon from '../../assets/RenameIcon.vue'
import TrashIcon from '../../assets/TrashIcon.vue'

defineProps({
  folder: {
    type: Object,
    required: true,
  },
})

defineEmits(['navigate', 'rename', 'delete'])
</script>

<style scoped>
.folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.folder-card:hover {
  background: var(--color-bg-hover);
}

.folder-card__icon {
  width: 48px;
  height: 48px;
  color: var(--color-action);
  flex-shrink: 0;
}

.folder-card__name {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  text-align: center;
  max-width: 100%;
}

.folder-card__actions {
  position: absolute;
  top: 6px;
  right: 6px;
  opacity: 0;
  transition: opacity 0.15s;
}

.folder-card:hover .folder-card__actions {
  opacity: 1;
}

@media (pointer: coarse) {
  .folder-card__actions {
    opacity: 1;
  }
}

.folder-card__menu-btn {
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

.folder-card__menu-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

</style>
