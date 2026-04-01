<template>
  <DashboardLayout>
    <div class="ref-page">
      <!-- Header with title and tabs -->
      <div class="ref-header">
        <h1 class="page-title">Reference</h1>
        <SegmentSwitch
            :options="[{ value: 'files', label: 'Files' }, { value: 'attachments', label: 'Attachments' }, { value: 'trash', label: 'Trash' }]"
            :model-value="activeTab"
            @update:model-value="switchTab"
        />
      </div>

      <!-- Files Tab -->
      <template v-if="activeTab === 'files'">
        <RefToolbar
            :breadcrumbs="model.breadcrumbs.value"
            :search-query="model.searchQuery.value"
            :view-mode="model.viewMode.value"
            :quota="filesQuota"
            @navigate="onNavigate"
            @search="onSearch"
            @new-folder="model.startNewFolder()"
            @upload="triggerUpload"
            @set-view="model.setViewMode($event)"
            @move-file="onMoveFile"
        />

        <RefUploadZone @upload="onUploadFiles" class="ref-content">
          <!-- Loading -->
          <div v-if="model.loading.value && model.folders.value.length === 0 && model.files.value.length === 0" class="ref-loading">
            <span class="spinner"></span>
          </div>

          <!-- Empty state -->
          <div v-else-if="!model.loading.value && model.folders.value.length === 0 && model.files.value.length === 0" class="ref-empty">
            <ReferenceIcon class="empty-state__icon" />
            <h2 class="text-h3 empty-state__title">
              {{ model.searchQuery.value ? 'No results found' : 'No files yet' }}
            </h2>
            <p class="text-body-m empty-state__text">
              {{ model.searchQuery.value ? 'Try a different search term.' : 'Upload files or create folders to organize your reference material.' }}
            </p>
          </div>

          <!-- List view -->
          <RefListView
              v-else-if="model.viewMode.value === 'list'"
              :folders="model.folders.value"
              :files="model.files.value"
              :has-more="model.hasMore.value"
              @navigate-folder="onNavigate"
              @rename-folder="onRenameFolder"
              @delete-folder="onDeleteFolder"
              @preview-file="model.openPreview($event)"
              @download-file="onDownloadFile"
              @rename-file="onRenameFile"
              @trash-file="onTrashFile"
              @load-more="model.loadMoreFiles()"
              @move-file="onMoveFile"
          />

          <!-- Grid view -->
          <RefGridView
              v-else
              :folders="model.folders.value"
              :files="model.files.value"
              :has-more="model.hasMore.value"
              @navigate-folder="onNavigate"
              @rename-folder="onRenameFolder"
              @delete-folder="onDeleteFolder"
              @preview-file="model.openPreview($event)"
              @download-file="onDownloadFile"
              @rename-file="onRenameFile"
              @trash-file="onTrashFile"
              @load-more="model.loadMoreFiles()"
              @move-file="onMoveFile"
          />
        </RefUploadZone>

        <!-- Upload progress -->
        <div v-if="model.uploads.value.length > 0" class="upload-progress">
          <div
              v-for="upload in model.uploads.value"
              :key="upload.id"
              class="upload-item"
              :class="{ 'upload-item--error': upload.status === 'error' }"
          >
            <span class="text-body-s upload-item__name">{{ upload.name }}</span>
            <div v-if="upload.status === 'uploading'" class="upload-item__bar">
              <div class="upload-item__fill" :style="{ width: upload.progress + '%' }"></div>
            </div>
            <span v-else-if="upload.status === 'done'" class="text-footnote fw-medium upload-item__done">Done</span>
            <span v-else-if="upload.status === 'error'" class="text-footnote upload-item__error">{{ upload.error }}</span>
          </div>
        </div>
      </template>

      <!-- Attachments Tab -->
      <template v-if="activeTab === 'attachments'">
        <RefToolbar
            :show-breadcrumbs="false"
            :show-actions="false"
            :search-query="attSearchQuery"
            :view-mode="attViewMode"
            :quota="attachmentsQuota"
            @search="attSearchQuery = $event"
            @set-view="attViewMode = $event"
        />

        <!-- Loading -->
        <div v-if="attModel_.loading.value && attModel_.items.value.length === 0" class="ref-loading">
          <span class="spinner"></span>
        </div>

        <!-- Empty state -->
        <div v-else-if="!attModel_.loading.value && attModel_.items.value.length === 0" class="ref-empty">
          <AttachmentIcon class="empty-state__icon" />
          <h2 class="text-h3 empty-state__title">No attachments</h2>
          <p class="text-body-m empty-state__text">
            Attachments added to your items will appear here.
          </p>
        </div>

        <!-- Attachment list view -->
        <RefListView
            v-else-if="attViewMode === 'list'"
            :files="normalizedAttachments"
            :has-more="attModel_.hasMore.value"
            mode="attachment"
            @preview-file="openAttachmentPreview($event._raw)"
            @download-file="onDownloadAttachment($event._raw)"
            @trash-file="onDeleteAttachment($event._raw)"
            @subtitle-click="onAttachmentSubtitleClick($event._raw)"
            @load-more="attModel_.loadMore()"
        />

        <!-- Attachment grid view -->
        <RefGridView
            v-else
            :files="normalizedAttachments"
            :has-more="attModel_.hasMore.value"
            mode="attachment"
            @preview-file="openAttachmentPreview($event._raw)"
            @download-file="onDownloadAttachment($event._raw)"
            @trash-file="onDeleteAttachment($event._raw)"
            @subtitle-click="onAttachmentSubtitleClick($event._raw)"
            @load-more="attModel_.loadMore()"
        />
      </template>

      <!-- Trash Tab -->
      <template v-if="activeTab === 'trash'">
        <RefToolbar
            :show-breadcrumbs="false"
            :show-actions="false"
            :show-empty-trash="trashModel_.files.value.length > 0"
            :search-query="trashSearchQuery"
            :view-mode="trashViewMode"
            @search="trashSearchQuery = $event"
            @set-view="trashViewMode = $event"
            @empty-trash="onEmptyTrash"
        />

        <!-- Loading -->
        <div v-if="trashModel_.loading.value && trashModel_.files.value.length === 0" class="ref-loading">
          <span class="spinner"></span>
        </div>

        <!-- Empty trash -->
        <div v-else-if="!trashModel_.loading.value && trashModel_.files.value.length === 0" class="ref-empty">
          <TrashIcon class="empty-state__icon" />
          <h2 class="text-h3 empty-state__title">Trash is empty</h2>
          <p class="text-body-m empty-state__text">
            Files you delete will appear here. You can restore them or permanently delete them.
          </p>
        </div>

        <!-- Trash list view -->
        <RefListView
            v-else-if="trashViewMode === 'list'"
            :files="filteredTrash"
            :has-more="trashModel_.hasMore.value"
            mode="trash"
            @preview-file="model.openPreview($event)"
            @restore-file="onRestoreFile($event)"
            @trash-file="onPermanentDelete($event)"
            @load-more="trashModel_.loadMore()"
        />

        <!-- Trash grid view -->
        <RefGridView
            v-else
            :files="filteredTrash"
            :has-more="trashModel_.hasMore.value"
            mode="trash"
            @preview-file="model.openPreview($event)"
            @restore-file="onRestoreFile($event)"
            @trash-file="onPermanentDelete($event)"
            @load-more="trashModel_.loadMore()"
        />
      </template>

      <!-- Modals -->
      <RefPreviewModal
          :preview="model.preview"
          @close="model.closePreview()"
          @download="onDownloadPreviewFile"
          @restore="onRestorePreviewFile"
      />

      <RefRenameModal
          :rename="model.rename"
          @confirm="onRenameConfirm"
          @cancel="model.closeRename()"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
import {ref, computed, watch, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import RefToolbar from '../../components/reference/RefToolbar.vue'
import RefUploadZone from '../../components/reference/RefUploadZone.vue'
import RefListView from '../../components/reference/RefListView.vue'
import RefGridView from '../../components/reference/RefGridView.vue'
import RefPreviewModal from '../../components/reference/RefPreviewModal.vue'
import RefRenameModal from '../../components/reference/RefRenameModal.vue'
import ReferenceIcon from '../../assets/ReferenceIcon.vue'
import TrashIcon from '../../assets/TrashIcon.vue'
import AttachmentIcon from '../../assets/AttachmentIcon.vue'
import DownloadIcon from '../../assets/DownloadIcon.vue'
import {referenceModel} from '../../scripts/models/referenceModel.js'
import {referenceTrashModel} from '../../scripts/models/referenceTrashModel.js'
import {attachmentListModel} from '../../scripts/models/attachmentListModel.js'
import SegmentSwitch from '../../components/SegmentSwitch.vue'

import {errorModel} from '../../scripts/core/errorModel.js'
import {confirmModel} from '../../scripts/core/confirmModel.js'
import {downloadAttachment, deleteAttachment, transformFileToOriginal} from '../../scripts/core/apiClient.js'

const route = useRoute()
const router = useRouter()
const model = referenceModel()
const trashModel_ = referenceTrashModel()
const attModel_ = attachmentListModel()
const toaster = errorModel()
const confirm = confirmModel()

const activeTab = ref('files')
const attSearchQuery = ref('')
const attViewMode = ref('list')

const filteredAttachments = computed(() => {
  const q = attSearchQuery.value.toLowerCase().trim()
  if (!q) return attModel_.items.value
  return attModel_.items.value.filter(a => a.file_name?.toLowerCase().includes(q))
})

// Trash search/view
const trashSearchQuery = ref('')
const trashViewMode = ref('list')

const filteredTrash = computed(() => {
  const q = trashSearchQuery.value.toLowerCase().trim()
  if (!q) return trashModel_.files.value
  return trashModel_.files.value.filter(f => f.name?.toLowerCase().includes(q))
})

const normalizedAttachments = computed(() => {
  return filteredAttachments.value.map(att => ({
    id: att.id,
    name: att.file_name,
    mime_type: att.mime_type,
    size_bytes: att.size_bytes,
    created_at: att.created_at,
    _subtitle: att.item_title || 'Untitled',
    _raw: att,
  }))
})
const fileInputRef = ref(null)

const filesQuota = computed(() => {
  const q = model.quota.value
  if (!q) return null
  return {
    used_bytes: q.reference_bytes ?? q.used_bytes,
    quota_bytes: q.quota_bytes,
  }
})

const attachmentsQuota = computed(() => {
  const q = model.quota.value
  if (!q) return null
  return {
    used_bytes: q.attachment_bytes ?? 0,
    quota_bytes: q.quota_bytes ?? 0,
  }
})

const attachmentsQuotaPercent = computed(() => {
  if (!attachmentsQuota.value || !attachmentsQuota.value.quota_bytes) return 0
  return Math.min(100, Math.round((attachmentsQuota.value.used_bytes / attachmentsQuota.value.quota_bytes) * 100))
})

// Watch model errors
watch(() => model.error.value, (err) => {
  if (!err) return
  toaster.push(typeof err === 'string' ? err : err.message ?? 'Unknown error')
})

watch(() => trashModel_.error.value, (err) => {
  if (!err) return
  toaster.push(typeof err === 'string' ? err : err.message ?? 'Unknown error')
})

watch(() => attModel_.error.value, (err) => {
  if (!err) return
  toaster.push(typeof err === 'string' ? err : err.message ?? 'Unknown error')
})

// Sync route query params → state
watch(() => route.query, (query) => {
  if (query.tab === 'trash') {
    activeTab.value = 'trash'
  } else if (query.tab === 'attachments') {
    activeTab.value = 'attachments'
  } else {
    activeTab.value = 'files'
    const folderId = query.folder || null
    if (folderId !== model.currentFolderId.value) {
      model.navigateToFolder(folderId).catch(() => {})
    }
  }
}, {immediate: true})

onMounted(() => {
  model.loadQuota()
  if (activeTab.value === 'files') {
    const folderId = route.query.folder || null
    model.navigateToFolder(folderId).catch(() => {})
  } else if (activeTab.value === 'attachments') {
    attModel_.loadAttachments({reset: true}).catch(() => {})
  } else {
    trashModel_.loadTrash({reset: true}).catch(() => {})
  }
})

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'trash') {
    router.replace({query: {tab: 'trash'}})
    trashModel_.loadTrash({reset: true}).catch(() => {})
  } else if (tab === 'attachments') {
    router.replace({query: {tab: 'attachments'}})
    attModel_.loadAttachments({reset: true}).catch(() => {})
  } else {
    const query = model.currentFolderId.value ? {folder: model.currentFolderId.value} : {}
    router.replace({query})
    const folderId = model.currentFolderId.value || null
    model.navigateToFolder(folderId).catch(() => {})
  }
}

function onNavigate(folderId) {
  const query = folderId ? {folder: folderId} : {}
  router.push({query})
}

let searchTimeout = null
function onSearch(query) {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    model.search(query).catch(() => {})
  }, 300)
}

function triggerUpload() {
  // Create a temporary file input
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      onUploadFiles(input.files)
    }
  }
  input.click()
}

function onUploadFiles(fileList) {
  model.uploadFiles(fileList)
}

function onRenameFolder(folder) {
  model.startRename('folder', folder.id, folder.name)
}

function onRenameFile(file) {
  model.startRename('file', file.id, file.name)
}

async function onRenameConfirm(name) {
  const {type, id} = model.rename
  try {
    if (type === 'new-folder') {
      await model.createFolder(name)
      toaster.success('Folder created')
    } else if (type === 'folder') {
      await model.renameFolder(id, name)
      toaster.success('Folder renamed')
    } else if (type === 'file') {
      await model.renameFile(id, name)
      toaster.success('File renamed')
    }
    model.closeRename()
  } catch (err) {
    if (err.status === 409) {
      const label = type === 'file' ? 'file' : 'folder'
      toaster.push(`A ${label} with this name already exists`)
    } else {
      toaster.push(err.message || 'Operation failed')
    }
  }
}

async function onDeleteFolder(folder) {
  const confirmed = await confirm.show({
    title: 'Delete Folder',
    message: `This will permanently delete "${folder.name}" and all files inside it. This cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (confirmed) {
    try {
      await model.deleteFolder(folder.id)
      toaster.success('Folder deleted')
    } catch (err) {
      if (err.status === 409) {
        toaster.push('Folder is not empty. Move or delete the files inside first.')
      } else {
        toaster.push(err.message || 'Failed to delete folder')
      }
    }
  }
}

async function onTrashFile(file) {
  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: `Are you sure you want to move "${file.name}" to trash?`,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  try {
    await model.trashFile(file.id)
    toaster.success(`"${file.name}" moved to trash`)
    model.loadQuota()
  } catch (err) {
    toaster.push(err.message || 'Failed to trash file')
  }
}

async function onMoveFile({fileId, targetFolderId}) {
  try {
    await model.moveFile(fileId, targetFolderId)
    toaster.success('File moved')
  } catch (err) {
    if (err.status === 409) {
      toaster.push('A file with this name already exists in the target folder')
    } else {
      toaster.push(err.message || 'Failed to move file')
    }
  }
}

async function onDownloadFile(file) {
  try {
    await model.downloadFile(file)
  } catch (err) {
    toaster.push(err.message || 'Download failed')
  }
}

function onDownloadPreviewFile() {
  const file = model.preview.file
  if (!file) return
  if (file._attachment) {
    onDownloadAttachment(file._attachment)
  } else {
    onDownloadFile(file)
  }
}

async function openAttachmentPreview(att) {
  model.preview.visible = true
  model.preview.file = { name: att.file_name, mime_type: att.mime_type, _attachment: att }
  model.preview.url = null
  model.preview.text = null
  model.preview.loading = true

  try {
    const entityType = att.item_type?.toLowerCase()
    const res = await downloadAttachment(entityType, att.item_id, att.id)
    const blob = res.data
    const mime = att.mime_type || ''

    if (mime.startsWith('text/') || mime === 'application/json') {
      model.preview.text = await blob.text()
    } else {
      model.preview.url = URL.createObjectURL(blob)
    }
  } catch {
    toaster.push('Failed to load preview')
    model.preview.visible = false
  } finally {
    model.preview.loading = false
  }
}

async function onRestorePreviewFile() {
  const file = model.preview.file
  if (!file || !file.source_type) return

  const targetMap = { 1: 'stuff', 2: 'action', 3: 'project' }
  const labelMap = { 1: 'Inbox', 2: 'Next Actions', 3: 'Projects' }
  const target = targetMap[file.source_type]
  if (!target) return

  try {
    await transformFileToOriginal(file.id, target)
    model.closePreview()
    model.files.value = model.files.value.filter(f => f.id !== file.id)
    model.loadQuota()
    toaster.success(`"${file.name}" restored to ${labelMap[file.source_type]}`)
  } catch (err) {
    toaster.push(err.message || 'Failed to restore file')
  }
}

async function onRestoreFile(file) {
  try {
    await trashModel_.restoreFile(file.id)
    toaster.success(`"${file.name}" restored`)
    model.loadQuota()
  } catch (err) {
    toaster.push(err.message || 'Failed to restore file')
  }
}

async function onPermanentDelete(file) {
  const confirmed = await confirm.show({
    title: 'Permanently Delete',
    message: `This will permanently delete "${file.name}". This cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (confirmed) {
    try {
      await trashModel_.permanentDelete(file.id)
      toaster.success('File permanently deleted')
      model.loadQuota()
    } catch (err) {
      toaster.push(err.message || 'Failed to delete file')
    }
  }
}

async function onEmptyTrash() {
  const confirmed = await confirm.show({
    title: 'Empty Trash',
    message: 'Are you sure you want to permanently delete all files in trash? This cannot be undone.',
    confirmText: 'Empty Trash',
    cancelText: 'Cancel',
  })
  if (confirmed) {
    try {
      await trashModel_.emptyTrash()
      toaster.success('Trash emptied')
      model.loadQuota()
    } catch (err) {
      toaster.push(err.message || 'Failed to empty trash')
    }
  }
}

function onAttachmentSubtitleClick(att) {
  router.push(parentRoute(att))
}

function parentRoute(att) {
  const type = (att.item_type || '').toLowerCase()
  const name = type === 'action' ? 'action' : type === 'project' ? 'project' : 'stuff'
  return {name: `${name}-detail`, params: {id: att.item_id}, query: {from: 'reference'}}
}

async function onDownloadAttachment(att) {
  try {
    const entityType = att.item_type?.toLowerCase()
    const res = await downloadAttachment(entityType, att.item_id, att.id)
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
    toaster.push(err.message || 'Download failed')
  }
}

async function onDeleteAttachment(att) {
  const confirmed = await confirm.show({
    title: 'Delete Attachment',
    message: `Are you sure you want to delete "${att.file_name}"? This cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (!confirmed) return
  try {
    const entityType = att.item_type?.toLowerCase()
    await deleteAttachment(entityType, att.item_id, att.id)
    attModel_.removeItem(att.id)
    toaster.success('Attachment deleted')
    model.loadQuota()
  } catch (err) {
    toaster.push(err.message || 'Failed to delete attachment')
  }
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}
</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.ref-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.ref-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
}

.ref-header h1 {
  margin: 0;
}


.ref-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
}

.ref-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
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

.ref-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state__icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state__title {
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}

/* Upload progress indicator */
.upload-progress {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 240px;
  max-width: 320px;
}

.upload-item {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.upload-item--error {
  border-color: var(--color-text-danger);
}

.upload-item__name {
  display: block;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}

.upload-item__bar {
  width: 100%;
  height: 4px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.upload-item__fill {
  height: 100%;
  background: var(--color-action);
  border-radius: 2px;
  transition: width 0.2s ease;
}

.upload-item__done {
  color: var(--color-text-success);
}

.upload-item__error {
  color: var(--color-text-danger);
}


.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}


.att-quota {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  min-width: 100px;
}

.quota-text {
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.quota-bar {
  width: 100%;
  height: 3px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.quota-bar__fill {
  height: 100%;
  background: var(--color-action);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.att-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.att-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background 0.1s;
}

.att-row:hover {
  background: var(--color-bg-hover);
}

.att-row__main {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.att-file-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
}

.att-row__content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.att-row__name {
  color: var(--color-text-primary);
  min-width: 120px;
}

.att-row__name :deep(.filename) {
  display: flex;
  width: 100%;
}

.att-row__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.att-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-action);
  text-decoration: none;
  min-width: 0;
  max-width: 200px;
}

.att-meta-chip:hover {
  text-decoration: underline;
}

.att-meta-chip :deep(.item-type-icon svg) {
  width: 14px;
  height: 14px;
}

.att-meta-chip__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.att-meta-size {
  color: var(--color-text-tertiary);
  white-space: nowrap;
  flex-shrink: 0;
}

.att-row__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.att-row:hover .att-row__actions {
  opacity: 1;
}

.att-action-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.att-action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-action);
}

.att-action-btn :deep(svg) {
  width: 16px;
  height: 16px;
}

@media (hover: none) and (pointer: coarse) {
  .att-row__actions {
    opacity: 1;
  }
}

@media (max-width: 600px) {
  .ref-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }



  .att-meta-chip {
    max-width: 140px;
  }
}
</style>
