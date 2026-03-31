<template>
  <div class="page">
    <h1 class="page-title">Audit Log</h1>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filterAction" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All actions</option>
        <option v-for="a in ACTION_OPTIONS" :key="a" :value="a">{{ formatAction(a) }}</option>
      </select>
      <select v-model="filterTargetType" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All targets</option>
        <option value="admin_user">Admin User</option>
        <option value="platform_user">Platform User</option>
      </select>
    </div>

    <DataTable
        :columns="columns"
        :rows="entries"
        :loading="loading"
        empty-text="No audit log entries found."
        :row-clickable="true"
        @row-click="toggleExpand"
    >
      <template #cell-timestamp="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-action="{ value }">
        <span class="fw-medium">{{ formatAction(value) }}</span>
      </template>
      <template #cell-target_type="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-details="{ row }">
        <span class="text-caption color-text-tertiary">
          {{ row.details?.email || row.target_id?.slice(0, 8) || '—' }}
        </span>
      </template>
      <template #cell-ip_address="{ value }">
        <span class="text-caption">{{ value || '—' }}</span>
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
      <div v-if="expandedEntry" class="detail-panel card">
        <div class="detail-header">
          <h3 class="text-body-s fw-semibold">Entry Details</h3>
          <button type="button" class="detail-close" @click="expandedEntry = null">&times;</button>
        </div>
        <div class="detail-body">
          <div class="detail-row" v-for="(val, key) in expandedEntry" :key="key">
            <span class="text-caption fw-medium color-text-secondary">{{ key }}</span>
            <span class="text-caption detail-val">{{ typeof val === 'object' ? JSON.stringify(val, null, 2) : val }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

const ACTION_OPTIONS = [
  'bootstrap_super_admin',
  'password_reset_requested',
  'password_set',
  'otp_setup_completed',
  'admin_created',
  'admin_updated',
  'admin_disabled',
  'admin_force_reset',
  'password_changed',
  'otp_reset',
  'user_disabled',
  'user_enabled',
  'user_deleted',
  'user_logout_forced',
  'user_password_reset_requested',
]

const ACTION_LABELS = {
  bootstrap_super_admin: 'Bootstrap Admin',
  password_reset_requested: 'Password Reset Requested',
  password_set: 'Password Set',
  otp_setup_completed: 'OTP Setup Completed',
  admin_created: 'Admin Created',
  admin_updated: 'Admin Updated',
  admin_disabled: 'Admin Disabled',
  admin_force_reset: 'Admin Force Reset',
  password_changed: 'Password Changed',
  otp_reset: 'OTP Reset',
  user_disabled: 'User Disabled',
  user_enabled: 'User Enabled',
  user_deleted: 'User Deleted',
  user_logout_forced: 'User Force Logout',
  user_password_reset_requested: 'User Password Reset',
}

const columns = [
  { key: 'timestamp', label: 'Time', sortable: false, width: '160px' },
  { key: 'action', label: 'Action', sortable: false },
  { key: 'target_type', label: 'Target', sortable: false, width: '120px' },
  { key: 'details', label: 'Details', sortable: false },
  { key: 'ip_address', label: 'IP', sortable: false, width: '130px' },
]

const entries = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = 20
const filterAction = ref('')
const filterTargetType = ref('')
const expandedEntry = ref(null)

async function load() {
  loading.value = true
  try {
    const params = { offset: (page.value - 1) * pageSize, limit: pageSize }
    if (filterAction.value) params.action = filterAction.value
    if (filterTargetType.value) params.target_type = filterTargetType.value

    const data = await apiClient.getAuditLog(params)
    entries.value = data.items || []
    totalCount.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load audit log')
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.value = 1
  expandedEntry.value = null
  load()
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, HH:mm:ss') } catch { return val }
}

function formatAction(action) {
  return ACTION_LABELS[action] || action.replace(/_/g, ' ')
}

function toggleExpand(row) {
  expandedEntry.value = expandedEntry.value?.id === row.id ? null : row
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-title {
  margin-bottom: 16px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
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

/* Expanded detail panel */
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
  min-width: 100px;
  flex-shrink: 0;
}

.detail-val {
  color: var(--color-text-primary);
  word-break: break-all;
  white-space: pre-wrap;
  font-family: var(--font-family-mono);
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
