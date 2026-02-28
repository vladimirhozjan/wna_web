<template>
  <div class="detail-section-area attachment-section">
    <div class="attachment-header">
      <label class="detail-section-label">Attachments</label>
      <span v-if="!loading && attachments.length > 0" class="attachment-count">{{ attachments.length }} / 10</span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="attachment-loading">
      <span class="detail-spinner-sm"></span>
    </div>

    <template v-else>
      <!-- Empty state (drop target) -->
      <div v-if="attachments.length === 0 && !uploading" class="detail-section-wrapper">
        <p
            class="detail-section-content detail-section-content--empty attachment-drop-zone"
            :class="{ 'attachment-drop-zone--active': dragover }"
            @click="triggerUpload"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
        >{{ dragover ? 'Drop file to attach' : 'Attach a file...' }}</p>
      </div>

      <!-- File list -->
      <div v-if="attachments.length > 0" class="attachment-list">
        <div v-for="att in attachments" :key="att.id" class="attachment-item" @click="openPreview(att)">
          <RefFileIcon :mime-type="att.mime_type" class="attachment-item-icon" />
          <div class="attachment-item-info">
            <span class="attachment-item-name">{{ att.file_name }}</span>
            <span class="attachment-item-size">{{ formatSize(att.size_bytes) }}</span>
          </div>
          <div class="attachment-item-actions">
            <button class="attachment-action-btn" title="Download" @click.stop="download(att)">
              <DownloadIcon class="attachment-action-icon" />
            </button>
            <button class="attachment-action-btn attachment-action-btn--danger" title="Delete" @click.stop="remove(att)">
              <TrashIcon class="attachment-action-icon" />
            </button>
          </div>
        </div>
      </div>

      <!-- Upload progress bar -->
      <div v-if="uploading" class="attachment-upload-progress">
        <div class="attachment-progress-track">
          <div class="attachment-progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="attachment-progress-text">{{ progress }}%</span>
      </div>

      <!-- Add more (drop target) -->
      <p
          v-if="attachments.length > 0 && !atLimit && !uploading"
          class="detail-section-content detail-section-content--empty attachment-drop-zone"
          :class="{ 'attachment-drop-zone--active': dragover }"
          @click="triggerUpload"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
      >{{ dragover ? 'Drop file to attach' : 'Attach another file...' }}</p>

      <!-- Limit notice -->
      <div v-if="atLimit" class="attachment-limit-notice">
        Attachment limit reached (10 / 10)
      </div>
    </template>

    <!-- Hidden file input -->
    <input ref="fileInput" type="file" hidden @change="onFileSelected" />

    <!-- Preview modal (teleports to body internally) -->
    <RefPreviewModal
        :preview="preview"
        @close="closePreview"
        @download="downloadPreviewFile"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import RefFileIcon from './reference/RefFileIcon.vue'
import RefPreviewModal from './reference/RefPreviewModal.vue'
import DownloadIcon from '../assets/DownloadIcon.vue'
import TrashIcon from '../assets/TrashIcon.vue'
import { listAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../scripts/core/apiClient.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'

const props = defineProps({
  entityType: { type: String, required: true },
  itemId: { type: String, required: true },
})

const toaster = errorModel()
const confirm = confirmModel()

const attachments = ref([])
const loading = ref(true)
const uploading = ref(false)
const progress = ref(0)
const fileInput = ref(null)
const dragover = ref(false)

// Preview state (same shape as referenceModel.preview)
const preview = reactive({
  visible: false,
  file: null,
  url: null,
  text: null,
  loading: false,
})

const atLimit = computed(() => attachments.value.length >= 10)

onMounted(() => {
  loadAttachments()
})

watch(() => props.itemId, () => {
  uploading.value = false
  progress.value = 0
  closePreview()
  loadAttachments()
})

async function loadAttachments() {
  loading.value = true
  try {
    const data = await listAttachments(props.entityType, props.itemId)
    attachments.value = data.attachments || []
  } catch {
    toaster.push('Failed to load attachments')
  } finally {
    loading.value = false
  }
}

function triggerUpload() {
  if (atLimit.value) return
  fileInput.value?.click()
}

async function uploadFile(file) {
  if (file.size > 50 * 1024 * 1024) {
    toaster.push('File is too large (max 50 MB)')
    return
  }

  uploading.value = true
  progress.value = 0

  try {
    const attachment = await uploadAttachment(props.entityType, props.itemId, file, (pct) => {
      progress.value = pct
    })
    if (attachment && attachment.id) {
      attachments.value.push(attachment)
    } else {
      console.warn('[AttachmentSection] Unexpected upload response, reloading:', attachment)
      await loadAttachments()
    }
    toaster.success('File attached')
  } catch (err) {
    if (err.status === 409) {
      toaster.push('Attachment limit reached (max 10)')
    } else if (err.status === 413) {
      toaster.push('File too large or storage quota exceeded')
    } else {
      toaster.push(err.message || 'Failed to upload file')
    }
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

async function onFileSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  fileInput.value.value = ''
  await uploadFile(file)
}

// ── Drag and drop ──

let dragCounter = 0

function onDragOver(e) {
  if (!e.dataTransfer?.types?.includes('Files')) return
  dragCounter++
  dragover.value = true
}

function onDragLeave() {
  dragCounter--
  if (dragCounter <= 0) {
    dragCounter = 0
    dragover.value = false
  }
}

function onDrop(e) {
  dragCounter = 0
  dragover.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (atLimit.value) {
    toaster.push('Attachment limit reached (max 10)')
    return
  }
  uploadFile(file)
}

// ── Preview ──

async function openPreview(att) {
  preview.visible = true
  preview.file = { name: att.file_name, mime_type: att.mime_type }
  preview.url = null
  preview.text = null
  preview.loading = true

  try {
    const res = await downloadAttachment(props.entityType, props.itemId, att.id)
    const blob = res.data
    const mime = att.mime_type || ''

    if (mime.startsWith('text/') || mime === 'application/json') {
      preview.text = await blob.text()
    } else {
      preview.url = URL.createObjectURL(blob)
    }
  } catch {
    toaster.push('Failed to load preview')
    preview.visible = false
  } finally {
    preview.loading = false
  }
}

function closePreview() {
  if (preview.url) {
    URL.revokeObjectURL(preview.url)
  }
  preview.visible = false
  preview.file = null
  preview.url = null
  preview.text = null
  preview.loading = false
}

function downloadPreviewFile() {
  if (!preview.file) return
  const att = attachments.value.find(a => a.file_name === preview.file.name)
  if (att) download(att)
}

// ── Download ──

async function download(att) {
  try {
    const res = await downloadAttachment(props.entityType, props.itemId, att.id)
    const blob = res.data
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = att.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    toaster.push('Failed to download file')
  }
}

// ── Delete ──

async function remove(att) {
  const confirmed = await confirm.show({
    title: 'Delete Attachment',
    message: `Are you sure you want to delete "${att.file_name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  try {
    await deleteAttachment(props.entityType, props.itemId, att.id)
    attachments.value = attachments.value.filter(a => a.id !== att.id)
    toaster.success('Attachment deleted')
  } catch {
    toaster.push('Failed to delete attachment')
  }
}

function formatSize(bytes) {
  if (bytes == null) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
</script>

<style scoped>
.attachment-section {
  border-bottom: 1px solid var(--color-border-light);
}

/* ── Reuse detail-section styles ── */
.detail-section-label {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: var(--lh-relaxed);
  min-height: 32px;
  box-sizing: border-box;
}

.detail-section-content:hover {
  background: var(--color-bg-secondary);
}

.detail-section-content--empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.attachment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.attachment-header .detail-section-label {
  margin-bottom: 0;
}

.attachment-count {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-footnote);
  color: var(--color-text-tertiary);
}

.attachment-loading {
  padding: 12px 0;
}

.detail-spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Drop zone (on placeholder text) ── */
.attachment-drop-zone {
  transition: background 0.15s ease, border-color 0.15s ease;
}

.attachment-drop-zone--active {
  background: var(--color-bg-secondary);
  border: 1px dashed var(--color-action);
  color: var(--color-action);
  font-style: normal;
}

/* ── File list ── */
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 4px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  border-radius: 4px;
  cursor: pointer;
}

.attachment-item:last-child {
  border-bottom: none;
}

.attachment-item:hover {
  background: var(--color-bg-secondary);
}

.attachment-item-icon {
  width: 24px;
  height: 24px;
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.attachment-item-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.attachment-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.attachment-item-name {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-item-size {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.attachment-item-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.attachment-item:hover .attachment-item-actions {
  opacity: 1;
}

@media (hover: none) and (pointer: coarse) {
  .attachment-item-actions {
    opacity: 1;
  }
}

.attachment-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.attachment-action-btn:hover {
  background: var(--color-bg-hover, var(--color-bg-secondary));
  color: var(--color-text-primary);
}

.attachment-action-btn--danger:hover {
  color: var(--color-danger);
}

.attachment-action-icon {
  width: 36px;
  height: 36px;
  padding: 6px;
  box-sizing: border-box;
}

.attachment-action-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

/* ── Upload progress ── */
.attachment-upload-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.attachment-progress-track {
  flex: 1;
  height: 3px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.attachment-progress-bar {
  height: 100%;
  background: var(--color-action);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.attachment-progress-text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-footnote);
  color: var(--color-text-tertiary);
  min-width: 32px;
  text-align: right;
}

/* ── Limit notice ── */
.attachment-limit-notice {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 8px 0;
}
</style>
