<template>
  <div
      class="upload-zone"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
  >
    <slot />
    <Transition name="fade">
      <div v-if="isDragging" class="upload-overlay">
        <UploadIcon class="upload-overlay__icon" />
        <p class="text-body-l fw-medium upload-overlay__text">Drop files here to upload</p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {ref} from 'vue'
import UploadIcon from '../../assets/UploadIcon.vue'

const emit = defineEmits(['upload'])

const isDragging = ref(false)
let dragCounter = 0

function onDragOver() {
  dragCounter++
  isDragging.value = true
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    isDragging.value = false
  }
}

function onDrop(e) {
  dragCounter = 0
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('upload', files)
  }
}
</script>

<style scoped>
.upload-zone {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background: rgba(65, 133, 222, 0.08);
  border: 2px dashed var(--color-action);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.upload-overlay__icon {
  width: 64px;
  height: 64px;
  padding: 10px;
  box-sizing: border-box;
  color: var(--color-action);
  margin-bottom: 12px;
}

.upload-overlay__text {
  color: var(--color-action);
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
