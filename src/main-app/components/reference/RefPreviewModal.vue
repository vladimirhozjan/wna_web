<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="preview.visible" class="preview-overlay" @keydown.esc="$emit('close')" tabindex="0" ref="overlayRef">
        <div class="preview-header">
          <span class="preview-filename">{{ preview.file?.name }}</span>
          <div class="preview-header-actions">
            <Btn variant="primary" size="sm" @click="$emit('download')">Download</Btn>
            <Btn variant="icon" size="sm" class="preview-close-btn" @click="$emit('close')">&times;</Btn>
          </div>
        </div>
        <div class="preview-body">
          <div v-if="preview.loading" class="preview-loading">
            <span class="spinner"></span>
          </div>
          <template v-else>
            <img
                v-if="isImage"
                :src="preview.url"
                :alt="preview.file?.name"
                class="preview-image"
            />
            <iframe
                v-else-if="isPdf"
                :src="preview.url"
                class="preview-iframe"
            ></iframe>
            <pre v-else-if="isText" class="preview-text">{{ preview.text }}</pre>
            <div v-else class="preview-unsupported">
              <FileIcon class="preview-unsupported-icon" />
              <p>Preview not available for this file type.</p>
              <Btn variant="primary" size="sm" @click="$emit('download')">Download</Btn>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {computed, ref, watch, nextTick} from 'vue'
import Btn from '../Btn.vue'
import FileIcon from '../../assets/FileIcon.vue'

const props = defineProps({
  preview: {
    type: Object,
    required: true,
  },
})

defineEmits(['close', 'download'])

const overlayRef = ref(null)

watch(() => props.preview.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      overlayRef.value?.focus()
    })
  }
})

const mime = computed(() => props.preview.file?.mime_type || '')

const isImage = computed(() => mime.value.startsWith('image/'))
const isPdf = computed(() => mime.value === 'application/pdf')
const isText = computed(() =>
    mime.value.startsWith('text/') || mime.value === 'application/json'
)
</script>

<style scoped>
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  outline: none;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.preview-filename {
  color: #fff;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.preview-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.preview-close-btn {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24px;
}

.preview-close-btn:hover {
  color: #fff;
}

.preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
  min-height: 0;
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 4px;
  background: #fff;
}

.preview-text {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 20px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-radius: 8px;
  font-family: monospace;
  font-size: var(--font-size-body-s);
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
}

.preview-unsupported-icon {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.4);
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
