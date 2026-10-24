<template>
  <div
      class="folder-card"
      :class="{ 'folder-card--drop-target': isDropTarget }"
      @click="$emit('navigate', folder.id)"
      @dragover.prevent.stop="onDragOver"
      @dragleave.prevent.stop="onDragLeave"
      @drop.prevent.stop="onDrop"
  >
    <FolderIcon class="folder-card__icon" />
    <FileName class="folder-card__name" :name="folder.name" />
    <div class="folder-card__actions" :class="{ 'folder-card__actions--busy': busy }" @click.stop>
      <Spinner v-if="busy" :size="16" class="folder-card__spinner" />
      <Dropdown v-else align="right" title="Folder actions">
        <template #trigger>
          <button class="folder-card__menu-btn" type="button"><MoreIcon class="menu-btn-icon" /></button>
        </template>
        <template #default="{ close }">
          <button class="dropdown-item" :disabled="writesDisabled" @click="close(); $emit('rename', folder)">
            <RenameIcon class="dropdown-item-icon" /> Rename
          </button>
          <button v-if="moveSide" class="dropdown-item" :disabled="moveSide.disabled" :data-testid="'ref-move-' + moveSide.target" @click="close(); $emit('move-side', folder)">
            <MoveIcon class="dropdown-item-icon" /> {{ moveSide.label }}
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
import {ref} from 'vue'
import FolderIcon from '../../assets/FolderIcon.vue'
import FileName from './FileName.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import Dropdown from '../Dropdown.vue'
import RenameIcon from '../../assets/RenameIcon.vue'
import TrashIcon from '../../assets/TrashIcon.vue'
import MoveIcon from '../../assets/MoveIcon.vue'
import Spinner from '../Spinner.vue'
import { dragModel } from '../../scripts/models/dragModel.js'

const drag = dragModel()
const isDropTarget = ref(false)

const props = defineProps({
  folder: {
    type: Object,
    required: true,
  },
  moveSide: {
    type: Object,
    default: null,
  },
  writesDisabled: {
    type: Boolean,
    default: false,
  },
  busy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['navigate', 'rename', 'delete', 'move-file', 'move-side'])

function onDragOver() {
  if (!drag.state.isDragging || drag.state.sourceType !== 'reference') return
  isDropTarget.value = true
}

function onDragLeave() {
  isDropTarget.value = false
}

function onDrop() {
  isDropTarget.value = false
  if (!drag.state.isDragging || drag.state.sourceType !== 'reference') return
  const fileId = drag.state.draggedItem?.id
  if (fileId) {
    emit('move-file', { fileId, targetFolderId: props.folder.id })
  }
}
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

.folder-card--drop-target {
  background: rgba(65, 133, 222, 0.08);
  border-color: var(--color-action);
  border-style: dashed;
}

.folder-card__icon {
  width: 48px;
  height: 48px;
  padding: 8px;
  box-sizing: border-box;
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

.folder-card:hover .folder-card__actions,
.folder-card__actions--busy {
  opacity: 1;
}

.folder-card__spinner {
  margin: 6px;
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
  padding: 4px;
  box-sizing: border-box;
}

.folder-card__menu-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .folder-card__menu-btn {
    position: relative;
  }

  .folder-card__menu-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    transform: translate(-50%, -50%);
  }
}
</style>
