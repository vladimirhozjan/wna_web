<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="preview.visible" class="overlay" @click.self="$emit('close')">
        <div class="dialog">
          <div class="dialog__header">
            <h3 class="dialog__title">{{ preview.file?.name }}</h3>
            <div class="dialog__header-actions">
              <Btn variant="ghost" size="sm" @click="$emit('download')">Download</Btn>
              <Btn variant="icon" size="sm" @click="$emit('close')">&times;</Btn>
            </div>
          </div>

          <div class="dialog__body">
            <div v-if="preview.loading" class="dialog__loading">
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
                <FileIcon class="empty-state__icon" />
                <h2 class="empty-state__title">Preview not available</h2>
                <p class="empty-state__text">This file type cannot be previewed.</p>
                <Btn variant="primary" size="sm" @click="$emit('download')">Download</Btn>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {computed} from 'vue'
import Btn from '../Btn.vue'
import FileIcon from '../../assets/FileIcon.vue'

const props = defineProps({
  preview: {
    type: Object,
    required: true,
  },
})

defineEmits(['close', 'download'])

const mime = computed(() => props.preview.file?.mime_type || '')

const isImage = computed(() => mime.value.startsWith('image/'))
const isPdf = computed(() => mime.value === 'application/pdf')
const isText = computed(() =>
    mime.value.startsWith('text/') || mime.value === 'application/json'
)
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 99998;
}

.dialog {
  background: var(--color-bg-primary);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  max-height: calc(100vh - 48px);
  overflow: hidden;
}

.dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  gap: 12px;
}

.dialog__title {
  margin: 0;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-l);
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.dialog__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dialog__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 24px;
  min-height: 200px;
}

.dialog__loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-action);
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
  min-height: 500px;
  border: none;
  border-radius: 4px;
}

.preview-text {
  width: 100%;
  height: 100%;
  min-height: 300px;
  margin: 0;
  padding: 16px;
  background: var(--color-bg-secondary);
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
  text-align: center;
  gap: 8px;
  padding: 24px;
}

.empty-state__icon {
  width: 80px;
  height: 80px;
  color: var(--color-text-tertiary);
  margin-bottom: 8px;
}

.empty-state__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.empty-state__text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  max-width: 300px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .overlay {
    padding: 8px;
  }

  .dialog {
    max-height: calc(100vh - 16px);
  }

  .dialog__header {
    padding: 12px 16px;
  }

  .dialog__body {
    padding: 16px;
  }
}
</style>
