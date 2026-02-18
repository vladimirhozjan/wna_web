<template>
  <Modal :visible="preview.visible" :title="preview.file?.name || ''" max-width="900px" @close="$emit('close')">
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
        <FileIcon class="empty-state__icon" />
        <h2 class="empty-state__title">Preview not available</h2>
        <p class="empty-state__text">This file type cannot be previewed.</p>
      </div>
    </template>
    <template #actions>
      <Btn variant="ghost" size="sm" @click="$emit('close')">
        Close
      </Btn>
      <Btn variant="primary" size="sm" @click="$emit('download')">
        Download
      </Btn>
    </template>
  </Modal>
</template>

<script setup>
import {computed} from 'vue'
import Modal from '../Modal.vue'
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
.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
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
  max-height: 60vh;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}

.preview-iframe {
  width: 100%;
  min-height: 500px;
  border: none;
  border-radius: 4px;
}

.preview-text {
  width: 100%;
  min-height: 200px;
  max-height: 60vh;
  margin: 0;
  padding: 16px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border-radius: 6px;
  font-family: monospace;
  font-size: var(--font-size-body-s);
  line-height: 1.6;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}

.preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 24px 0;
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
  margin: 0;
  max-width: 300px;
}
</style>
