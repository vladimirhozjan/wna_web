<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">GDPR Requests</h1>
      <div class="header-actions">
        <Btn variant="secondary" size="sm" @click="showExportModal = true">New Export</Btn>
        <Btn v-if="hasMinRole(role, 'super_admin')" variant="ghost-danger" size="sm" @click="showDeletionModal = true">New Deletion</Btn>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filterStatus" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <DataTable
        :columns="columns"
        :rows="requests"
        :loading="loading"
        :row-clickable="true"
        empty-text="No GDPR requests found."
        @row-click="toggleExpand"
    >
      <template #cell-request_type="{ value }">
        <Badge type="role" :value="value === 'data_export' ? 'export' : 'deletion'" />
      </template>
      <template #cell-status="{ value }">
        <Badge type="status" :value="value" />
      </template>
      <template #cell-requested_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-completed_at="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #pagination>
        <Pagination
            :page="page"
            :page-size="pageSize"
            :total="totalCount"
            @update:page="p => { page = p; load() }"
        />
      </template>
    </DataTable>

    <!-- Expanded detail -->
    <Transition name="fade">
      <div v-if="expandedRequest" class="detail-panel card">
        <div class="detail-header">
          <h3 class="text-body-s fw-semibold">Request Details</h3>
          <button type="button" class="detail-close" @click="expandedRequest = null">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">ID</span>
            <span class="text-caption detail-val">{{ expandedRequest.id }}</span>
          </div>
          <div class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">User</span>
            <span class="text-caption detail-val">{{ expandedRequest.user_email }}</span>
          </div>
          <div class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">Type</span>
            <span class="text-caption detail-val">{{ expandedRequest.request_type }}</span>
          </div>
          <div class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">Status</span>
            <span class="text-caption detail-val">{{ expandedRequest.status }}</span>
          </div>
          <div class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">Requested</span>
            <span class="text-caption detail-val">{{ formatDate(expandedRequest.requested_at) }}</span>
          </div>
          <div v-if="expandedRequest.completed_at" class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">Completed</span>
            <span class="text-caption detail-val">{{ formatDate(expandedRequest.completed_at) }}</span>
          </div>
        </div>
        <div class="detail-actions">
          <Btn
              v-if="expandedRequest.status === 'completed' && expandedRequest.request_type === 'data_export'"
              variant="secondary" size="sm"
              :loading="downloadLoading"
              @click="handleDownload(expandedRequest.id)"
          >
            Download Export
          </Btn>
          <Btn
              v-if="expandedRequest.status === 'pending' && expandedRequest.request_type === 'account_deletion' && hasMinRole(role, 'super_admin')"
              variant="ghost-danger" size="sm"
              :loading="cancelLoading"
              @click="handleCancel(expandedRequest.id)"
          >
            Cancel Deletion
          </Btn>
        </div>
      </div>
    </Transition>

    <!-- Trigger Export Modal -->
    <Modal :visible="showExportModal" title="Trigger Data Export" @close="closeExportModal">
      <p class="text-body-s color-text-secondary">Enter the platform user ID to export their data.</p>
      <Inpt v-model="exportUserId" v-model:error="exportError" type="text" title="User ID" placeholder="UUID" :disabled="exportLoading" />
      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeExportModal" :disabled="exportLoading">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="exportLoading" @click="handleExport">Trigger Export</Btn>
      </template>
    </Modal>

    <!-- Trigger Deletion Modal -->
    <Modal :visible="showDeletionModal" title="Trigger Account Deletion" @close="closeDeletionModal">
      <p class="text-body-s color-text-secondary">This initiates a 30-day grace period deletion. Enter the user ID and confirm their email.</p>
      <div class="modal-form">
        <Inpt v-model="deletionUserId" v-model:error="deletionUserIdError" type="text" title="User ID" placeholder="UUID" :disabled="deletionLoading" />
        <Inpt v-model="deletionEmail" v-model:error="deletionEmailError" type="email" title="Email Confirmation" placeholder="Type user email to confirm" :disabled="deletionLoading" />
      </div>
      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeDeletionModal" :disabled="deletionLoading">Cancel</Btn>
        <Btn variant="danger" size="sm" :loading="deletionLoading" @click="handleDeletion">Initiate Deletion</Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const auth = authModel()
const toaster = errorModel()

const role = computed(() => auth.currentAdmin.value?.role)

const columns = [
  { key: 'user_email', label: 'User', sortable: false },
  { key: 'request_type', label: 'Type', sortable: false, width: '110px' },
  { key: 'status', label: 'Status', sortable: false, width: '120px' },
  { key: 'requested_at', label: 'Requested', sortable: false, width: '160px' },
  { key: 'completed_at', label: 'Completed', sortable: false, width: '160px' },
]

const requests = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = 20
const filterStatus = ref('')
const expandedRequest = ref(null)
const cancelLoading = ref(false)
const downloadLoading = ref(false)

async function load() {
  loading.value = true
  try {
    const params = { offset: (page.value - 1) * pageSize, limit: pageSize }
    if (filterStatus.value) params.status = filterStatus.value
    const data = await apiClient.listGdprRequests(params)
    requests.value = data.items || []
    totalCount.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load GDPR requests')
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.value = 1
  expandedRequest.value = null
  load()
}

function toggleExpand(row) {
  expandedRequest.value = expandedRequest.value?.id === row.id ? null : row
}

async function handleCancel(id) {
  cancelLoading.value = true
  try {
    await apiClient.cancelGdprRequest(id)
    toaster.success('Deletion request cancelled')
    expandedRequest.value = null
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to cancel request')
  } finally {
    cancelLoading.value = false
  }
}

async function handleDownload(id) {
  downloadLoading.value = true
  try {
    const res = await apiClient.downloadGdprExport(id)
    const url = window.URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url
    a.download = res.headers?.['content-disposition']?.split('filename=')[1] || `gdpr-export-${id}.zip`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    a.remove()
  } catch (err) {
    toaster.push(err.message || 'Failed to download export')
  } finally {
    downloadLoading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

// --- Export modal ---
const showExportModal = ref(false)
const exportUserId = ref('')
const exportError = ref('')
const exportLoading = ref(false)

function closeExportModal() {
  showExportModal.value = false
  exportUserId.value = ''
  exportError.value = ''
}

async function handleExport() {
  exportError.value = ''
  if (!exportUserId.value.trim()) { exportError.value = 'User ID is required'; return }

  exportLoading.value = true
  try {
    await apiClient.triggerDataExport(exportUserId.value.trim())
    toaster.success('Data export triggered')
    closeExportModal()
    await load()
  } catch (err) {
    exportError.value = err.message || 'Failed to trigger export'
  } finally {
    exportLoading.value = false
  }
}

// --- Deletion modal ---
const showDeletionModal = ref(false)
const deletionUserId = ref('')
const deletionEmail = ref('')
const deletionUserIdError = ref('')
const deletionEmailError = ref('')
const deletionLoading = ref(false)

function closeDeletionModal() {
  showDeletionModal.value = false
  deletionUserId.value = ''
  deletionEmail.value = ''
  deletionUserIdError.value = ''
  deletionEmailError.value = ''
}

async function handleDeletion() {
  deletionUserIdError.value = ''
  deletionEmailError.value = ''
  if (!deletionUserId.value.trim()) { deletionUserIdError.value = 'User ID is required'; return }
  if (!deletionEmail.value.trim()) { deletionEmailError.value = 'Email confirmation is required'; return }

  deletionLoading.value = true
  try {
    await apiClient.triggerAccountDeletion(deletionUserId.value.trim(), deletionEmail.value.trim())
    toaster.success('Account deletion initiated (30-day grace period)')
    closeDeletionModal()
    await load()
  } catch (err) {
    deletionEmailError.value = err.message || 'Failed to initiate deletion'
  } finally {
    deletionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
  min-width: 160px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Detail panel */
.detail-panel {
  margin-top: 16px;
  padding: 16px 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.detail-close {
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 2px 6px;
  line-height: 1;
  border-radius: 4px;
}

.detail-close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  gap: 12px;
}

.detail-row span:first-child {
  min-width: 90px;
  flex-shrink: 0;
}

.detail-val {
  color: var(--color-text-primary);
  word-break: break-all;
}

.detail-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
