<template>
  <div class="detail-section-area attachment-section">
    <div class="attachment-toolbar">
      <label class="text-body-s fw-semibold detail-section-label">Attachments</label>
      <div class="attachment-toolbar-right">
        <input
            v-if="attachments.length > 0"
            v-model="searchQuery"
            type="text"
            class="text-body-s attachment-search"
            placeholder="Search files..."
            @keydown.esc="searchQuery = ''"
        />
        <div v-if="attachments.length > 0" class="attachment-view-toggle">
          <button
              type="button"
              class="view-btn"
              :class="{ 'view-btn--active': viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="List view"
          >
            <ListViewIcon />
          </button>
          <button
              type="button"
              class="view-btn"
              :class="{ 'view-btn--active': viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              title="Grid view"
          >
            <GridViewIcon />
          </button>
        </div>
        <span v-if="!loading && attachments.length > 0" class="text-footnote attachment-count">{{ attachments.length }} / 10</span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="attachment-loading">
      <Spinner :size="16" />
    </div>

    <template v-else>
      <!-- Empty state (drop target) -->
      <div v-if="attachments.length === 0 && !uploading" class="detail-section-wrapper">
        <p
            v-if="!readonly"
            class="text-body-m detail-section-content detail-section-content--empty attachment-drop-zone"
            :class="{ 'attachment-drop-zone--active': dragover }"
            @click="triggerUpload"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
        >{{ dragover ? 'Drop file to attach' : 'Attach a file...' }}</p>
        <p v-else class="text-body-m detail-section-content detail-section-content--empty">—</p>
      </div>

      <!-- File list -->
      <div v-if="filteredAttachments.length > 0" class="attachment-list" :class="{ 'attachment-list--grid': viewMode === 'grid' }">
        <div
            v-for="att in filteredAttachments"
            :key="att.id"
            class="attachment-item"
            :class="{ 'attachment-item--grid': viewMode === 'grid' }"
            :title="rowMedia(att) && !rowMedia(att).loading && !rowMedia(att).url ? 'Couldn\'t load the preview — tap to retry' : undefined"
            @click="onRowClick(att)"
        >
          <span v-if="rowMedia(att)" class="attachment-item-media">
            <Spinner v-if="rowMedia(att).loading" :size="16" />
            <img v-else-if="rowMedia(att).url && isImage(att)" :src="rowMedia(att).url" :alt="att.file_name" class="attachment-item-thumb" />
            <Btn
                v-else-if="rowMedia(att).url"
                variant="icon"
                size="sm"
                :aria-label="playingId === att.id ? 'Stop' : 'Play'"
                @click.stop="togglePlay(att)"
            >
              <StopIcon v-if="playingId === att.id" class="attachment-item-play-icon" />
              <TriangleRightIcon v-else class="attachment-item-play-icon" />
            </Btn>
            <FileIcon v-else class="attachment-item-icon attachment-item-icon--failed" />
          </span>
          <RefFileIcon v-else :mime-type="att.mime_type" class="attachment-item-icon" />
          <div class="attachment-item-info">
            <span class="text-body-m attachment-item-name">{{ att.file_name }}</span>
            <span class="text-body-s attachment-item-size">{{ formatSize(att.size_bytes) }}</span>
          </div>
          <div class="attachment-item-actions" @click.stop>
            <button class="attachment-action-btn" title="Download" @click="download(att)">
              <DownloadIcon />
            </button>
            <ActionBtn v-if="!readonly" @click="remove(att)" />
          </div>
        </div>
      </div>

      <!-- Upload progress bar -->
      <div v-if="uploading" class="attachment-upload-progress">
        <div class="attachment-progress-track">
          <div class="attachment-progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="text-footnote attachment-progress-text">{{ progress }}%</span>
      </div>

      <!-- Add more (drop target) -->
      <p
          v-if="!readonly && attachments.length > 0 && !atLimit && !uploading"
          class="text-body-m detail-section-content detail-section-content--empty attachment-drop-zone"
          :class="{ 'attachment-drop-zone--active': dragover }"
          @click="triggerUpload"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
      >{{ dragover ? 'Drop file to attach' : 'Attach another file...' }}</p>

      <!-- Limit notice -->
      <div v-if="atLimit" class="text-body-s attachment-limit-notice">
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
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import RefFileIcon from './reference/RefFileIcon.vue'
import RefPreviewModal from './reference/RefPreviewModal.vue'
import Btn from './Btn.vue'
import DownloadIcon from '../assets/DownloadIcon.vue'
import FileIcon from '../assets/FileIcon.vue'
import StopIcon from '../assets/StopIcon.vue'
import TriangleRightIcon from '../assets/TriangleRightIcon.vue'
import ListViewIcon from '../assets/ListViewIcon.vue'
import GridViewIcon from '../assets/GridViewIcon.vue'
import ActionBtn from './ActionBtn.vue'
import { listAttachments, uploadAttachment, downloadAttachment, deleteAttachment } from '../scripts/core/apiClient.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import Spinner from './Spinner.vue'

const props = defineProps({
  entityType: { type: String, required: true },
  itemId: { type: String, required: true },
  readonly: { type: Boolean, default: false },
})

const toaster = errorModel()
const confirm = confirmModel()

const attachments = ref([])
const loading = ref(true)
const uploading = ref(false)
const progress = ref(0)
const fileInput = ref(null)
const dragover = ref(false)
const searchQuery = ref('')
const viewMode = ref('list')

const filteredAttachments = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return attachments.value
  return attachments.value.filter(a => a.file_name?.toLowerCase().includes(q))
})

// Preview state (same shape as referenceModel.preview)
const preview = reactive({
  visible: false,
  file: null,
  url: null,
  text: null,
  loading: false,
})

const atLimit = computed(() => attachments.value.length >= 10)

// Stuff list rows show images as thumbnails and voice memos with Play/Stop instead of the type icon
const blobs = reactive({})
const playingId = ref(null)
let player = null
let previewOwnsUrl = true

const isImage = (att) => !!att.mime_type?.startsWith('image/')
const isAudio = (att) => !!att.mime_type?.startsWith('audio/')
const media = computed(() =>
    props.entityType === 'stuff' ? attachments.value.filter(a => isImage(a) || isAudio(a)) : []
)

function rowMedia(att) {
  return viewMode.value === 'list' ? blobs[att.id] : null
}

onMounted(() => {
  loadAttachments()
})

watch(() => props.itemId, () => {
  uploading.value = false
  progress.value = 0
  closePreview()
  releaseAll()
  loadAttachments()
})

watch(() => media.value.map(a => a.id).join(), syncMedia)

onUnmounted(releaseAll)

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
    if (err.code) {
      toaster.push(err.message)
    } else if (err.status === 409) {
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

// ── Thumbnails and voice playback ──

// The download needs the JWT header, so the bytes come as a blob behind an object URL
async function loadMedia(att) {
  blobs[att.id] = { loading: true, url: null }
  try {
    const res = await downloadAttachment(props.entityType, props.itemId, att.id)
    if (!blobs[att.id]) return
    blobs[att.id] = { loading: false, url: URL.createObjectURL(res.data) }
  } catch {
    if (blobs[att.id]) blobs[att.id] = { loading: false, url: null }
  }
}

function releaseMedia(id) {
  if (playingId.value === id) stopPlayback()
  if (blobs[id]?.url) URL.revokeObjectURL(blobs[id].url)
  delete blobs[id]
}

function releaseAll() {
  stopPlayback()
  for (const id of Object.keys(blobs)) releaseMedia(id)
}

function syncMedia() {
  const ids = new Set(media.value.map(a => a.id))
  for (const id of Object.keys(blobs)) {
    if (!ids.has(id)) releaseMedia(id)
  }
  for (const att of media.value) {
    if (!blobs[att.id]) loadMedia(att)
  }
}

function stopPlayback() {
  player?.pause()
  player = null
  playingId.value = null
}

function togglePlay(att) {
  if (playingId.value === att.id) {
    stopPlayback()
    return
  }
  stopPlayback()
  player = new Audio(blobs[att.id].url)
  player.onended = stopPlayback
  playingId.value = att.id
  player.play().catch(stopPlayback)
}

function onRowClick(att) {
  const state = rowMedia(att)
  if (!state) {
    openPreview(att)
  } else if (state.loading) {
    return
  } else if (!state.url) {
    loadMedia(att)
  } else if (isAudio(att)) {
    togglePlay(att)
  } else {
    preview.file = { name: att.file_name, mime_type: att.mime_type }
    preview.url = state.url
    preview.text = null
    preview.loading = false
    preview.visible = true
    previewOwnsUrl = false
  }
}

// ── Preview ──

async function openPreview(att) {
  previewOwnsUrl = true
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
  } catch (err) {
    toaster.push(err.code ? err.message : 'Failed to load preview')
    preview.visible = false
  } finally {
    preview.loading = false
  }
}

function closePreview() {
  if (preview.url && previewOwnsUrl) {
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
  } catch (err) {
    toaster.push(err.code ? err.message : 'Failed to download file')
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
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
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

.attachment-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.attachment-toolbar .detail-section-label {
  margin-bottom: 0;
}

.attachment-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attachment-search {
  padding: 5px 10px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  width: 140px;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.attachment-search:focus {
  outline: none;
  border-color: var(--color-action);
  box-shadow: 0 0 0 1px rgba(65, 133, 222, 0.2);
}

.attachment-search::placeholder {
  color: var(--color-text-tertiary);
}

.attachment-view-toggle {
  display: flex;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  overflow: hidden;
}

.view-btn {
  background: none;
  border: none;
  padding: 5px 7px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}

.view-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

.view-btn:hover {
  background: var(--color-bg-hover);
}

.view-btn--active {
  background: var(--color-bg-secondary);
  color: var(--color-action);
}

.attachment-count {
  color: var(--color-text-tertiary);
}

.attachment-loading {
  padding: 12px 0;
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

.attachment-list--grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
}

.attachment-item--grid {
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
}

.attachment-item--grid .attachment-item-info {
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.attachment-item--grid .attachment-item-name {
  font-size: var(--font-size-xs);
  max-width: 90px;
}

.attachment-item--grid .attachment-item-actions {
  opacity: 1;
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

.attachment-item-media {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attachment-item-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.attachment-item-play-icon {
  width: 18px;
  height: 18px;
}

.attachment-item-icon--failed {
  color: var(--color-text-tertiary);
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
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attachment-item-size {
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
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.attachment-action-btn:hover {
  background: var(--color-bg-hover, var(--color-bg-secondary));
  color: var(--color-action);
}

.attachment-action-btn :deep(svg) {
  width: 16px;
  height: 16px;
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
  color: var(--color-text-tertiary);
  min-width: 32px;
  text-align: right;
}

/* ── Limit notice ── */
.attachment-limit-notice {
  color: var(--color-text-tertiary);
  text-align: center;
  padding: 8px 0;
}
</style>
