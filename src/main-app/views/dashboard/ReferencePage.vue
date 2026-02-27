<template>
  <DashboardLayout>
    <div class="ref-page">
      <!-- Header with title and tabs -->
      <div class="ref-header">
        <h1 class="text-h1 color-text-primary">Reference</h1>
        <SegmentSwitch
            :options="[{ value: 'files', label: 'Files' }, { value: 'trash', label: 'Trash' }]"
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
            :quota="model.quota.value"
            @navigate="onNavigate"
            @search="onSearch"
            @new-folder="model.startNewFolder()"
            @upload="triggerUpload"
            @set-view="model.setViewMode($event)"
        />

        <RefUploadZone @upload="onUploadFiles" class="ref-content">
          <!-- Loading -->
          <div v-if="model.loading.value && model.folders.value.length === 0 && model.files.value.length === 0" class="ref-loading">
            <span class="spinner"></span>
          </div>

          <!-- Empty state -->
          <div v-else-if="!model.loading.value && model.folders.value.length === 0 && model.files.value.length === 0" class="ref-empty">
            <ReferenceIcon class="empty-state__icon" />
            <h2 class="empty-state__title">
              {{ model.searchQuery.value ? 'No results found' : 'No files yet' }}
            </h2>
            <p class="empty-state__text">
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
            <span class="upload-item__name">{{ upload.name }}</span>
            <div v-if="upload.status === 'uploading'" class="upload-item__bar">
              <div class="upload-item__fill" :style="{ width: upload.progress + '%' }"></div>
            </div>
            <span v-else-if="upload.status === 'done'" class="upload-item__done">Done</span>
            <span v-else-if="upload.status === 'error'" class="upload-item__error">{{ upload.error }}</span>
          </div>
        </div>
      </template>

      <!-- Trash Tab -->
      <template v-if="activeTab === 'trash'">
        <div class="trash-toolbar">
          <Btn
              variant="ghost"
              size="sm"
              @click="onEmptyTrash"
              :disabled="trashModel_.files.value.length === 0"
          >
            Empty Trash
          </Btn>
        </div>

        <!-- Loading -->
        <div v-if="trashModel_.loading.value && trashModel_.files.value.length === 0" class="ref-loading">
          <span class="spinner"></span>
        </div>

        <!-- Empty trash -->
        <div v-else-if="!trashModel_.loading.value && trashModel_.files.value.length === 0" class="ref-empty">
          <TrashIcon class="empty-state__icon" />
          <h2 class="empty-state__title">Trash is empty</h2>
          <p class="empty-state__text">
            Files you delete will appear here. You can restore them or permanently delete them.
          </p>
        </div>

        <!-- Trash file list -->
        <div v-else class="trash-list">
          <table class="trash-table">
            <thead>
              <tr>
                <th class="col-name">Name</th>
                <th class="col-size">Size</th>
                <th class="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="file in trashModel_.files.value" :key="file.id" class="trash-row">
                <td class="col-name"><FileName :name="file.name" /></td>
                <td class="col-size">{{ formatSize(file.size_bytes) }}</td>
                <td class="col-actions">
                  <Btn variant="link" size="sm" @click="onRestoreFile(file)">Restore</Btn>
                  <Btn variant="link" size="sm" class="danger-link" @click="onPermanentDelete(file)">Delete</Btn>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="trashModel_.hasMore.value" class="load-more">
            <Btn variant="ghost" size="sm" @click="trashModel_.loadMore()">Load more</Btn>
          </div>
        </div>
      </template>

      <!-- Modals -->
      <RefPreviewModal
          :preview="model.preview"
          @close="model.closePreview()"
          @download="onDownloadPreviewFile"
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
import {ref, watch, onMounted} from 'vue'
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
import {referenceModel} from '../../scripts/models/referenceModel.js'
import {referenceTrashModel} from '../../scripts/models/referenceTrashModel.js'
import SegmentSwitch from '../../components/SegmentSwitch.vue'
import FileName from '../../components/reference/FileName.vue'
import {errorModel} from '../../scripts/core/errorModel.js'
import {confirmModel} from '../../scripts/core/confirmModel.js'

const route = useRoute()
const router = useRouter()
const model = referenceModel()
const trashModel_ = referenceTrashModel()
const toaster = errorModel()
const confirm = confirmModel()

const activeTab = ref('files')
const fileInputRef = ref(null)

// Watch model errors
watch(() => model.error.value, (err) => {
  if (!err) return
  toaster.push(typeof err === 'string' ? err : err.message ?? 'Unknown error')
})

watch(() => trashModel_.error.value, (err) => {
  if (!err) return
  toaster.push(typeof err === 'string' ? err : err.message ?? 'Unknown error')
})

// Sync route query params → state
watch(() => route.query, (query) => {
  if (query.tab === 'trash') {
    activeTab.value = 'trash'
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
  } else {
    trashModel_.loadTrash({reset: true}).catch(() => {})
  }
})

function switchTab(tab) {
  activeTab.value = tab
  if (tab === 'trash') {
    router.replace({query: {tab: 'trash'}})
    trashModel_.loadTrash({reset: true}).catch(() => {})
  } else {
    const query = model.currentFolderId.value ? {folder: model.currentFolderId.value} : {}
    router.replace({query})
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
    toaster.push(err.message || 'Operation failed')
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
      toaster.push(err.message || 'Failed to delete folder')
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

async function onDownloadFile(file) {
  try {
    await model.downloadFile(file)
  } catch (err) {
    toaster.push(err.message || 'Download failed')
  }
}

function onDownloadPreviewFile() {
  if (model.preview.file) {
    onDownloadFile(model.preview.file)
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
}

.ref-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--color-bg-primary);
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
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
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
  border-color: #dc2626;
}

.upload-item__name {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
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
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  color: #059669;
  font-weight: 500;
}

.upload-item__error {
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  color: #dc2626;
}

/* Trash tab */
.trash-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.trash-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.trash-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
}

.trash-table thead th {
  text-align: left;
  padding: 8px 12px;
  font-size: var(--font-size-body-s);
  font-weight: 500;
  color: var(--color-text-tertiary);
  border-bottom: 1px solid var(--color-border-light);
}

.trash-row td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.trash-table .col-name {
  overflow: hidden;
}

.trash-table .col-name :deep(.filename) {
  display: flex;
  width: 100%;
}

.trash-table .col-size {
  width: 80px;
}

.trash-table .col-actions {
  width: 160px;
}

.trash-row .col-size {
  color: var(--color-text-secondary);
}

.trash-row .col-actions {
  white-space: nowrap;
  text-align: right;
  padding-right: 4px;
}

.trash-table thead .col-actions {
  text-align: right;
}

.danger-link {
  color: #dc2626 !important;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
}

@media (max-width: 600px) {
  .trash-table .col-size {
    display: none;
  }

  .trash-table .col-actions {
    width: 120px;
  }
}
</style>
