<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Alarms</h1>
      <Btn
          v-if="canAct"
          variant="ghost-danger" size="sm"
          :loading="resolveAllLoading"
          @click="handleResolveAll"
      >
        Resolve all
      </Btn>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filterSeverity" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All severities</option>
        <option value="critical">Critical</option>
        <option value="warning">Warning</option>
        <option value="info">Info</option>
      </select>
      <select v-model="filterStatus" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="acknowledged">Acknowledged</option>
        <option value="resolved">Resolved</option>
      </select>
      <select v-model="filterSource" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All sources</option>
        <option v-for="s in SOURCE_OPTIONS" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <DataTable
        :columns="columns"
        :rows="alarm.items.value"
        :loading="alarm.listLoading.value"
        :row-clickable="true"
        empty-text="No alarms found."
        @row-click="toggleExpand"
    >
      <template #cell-severity="{ value }">
        <Badge :type="SEVERITY_BADGE[value] || 'draft'" :value="value" />
      </template>
      <template #cell-alarm="{ row }">
        <span class="fw-medium">{{ row.event }}</span>
        <span class="text-caption color-text-secondary alarm-message">{{ row.message }}</span>
      </template>
      <template #cell-status="{ value }">
        <Badge :type="STATUS_BADGE[value] || 'draft'" :value="value" />
      </template>
      <template #cell-last_seen="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="row-actions">
          <Btn
              v-if="row.status === 'active'"
              variant="ghost" size="sm"
              :disabled="actionLoadingId === row.id"
              @click.stop="handleAck(row)"
          >
            Ack
          </Btn>
          <Btn
              v-if="row.status !== 'resolved'"
              variant="ghost-danger" size="sm"
              :disabled="actionLoadingId === row.id"
              @click.stop="handleResolve(row)"
          >
            Resolve
          </Btn>
        </div>
      </template>

      <template #pagination>
        <Pagination
            :page="page"
            :page-size="pageSize"
            :total="alarm.totalCount.value"
            @update:page="p => { page = p; load() }"
        />
      </template>
    </DataTable>

    <!-- Expanded detail -->
    <Transition name="fade">
      <div v-if="expandedAlarm" class="detail-panel card">
        <div class="detail-header">
          <h3 class="text-body-s fw-semibold">Alarm Details</h3>
          <button type="button" class="detail-close" @click="expandedAlarm = null">&times;</button>
        </div>
        <div class="detail-body">
          <div v-for="(val, key) in expandedFields" :key="key" class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">{{ key }}</span>
            <span class="text-caption detail-val">{{ val }}</span>
          </div>
          <div class="detail-row">
            <span class="text-caption fw-medium color-text-secondary">context</span>
            <span class="text-caption detail-val">{{ contextJson }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import { alarmModel } from '../scripts/models/alarmModel.js'

const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()
const alarm = alarmModel()

const role = computed(() => auth.currentAdmin.value?.role)
const canAct = computed(() => hasMinRole(role.value, 'support'))

const SOURCE_OPTIONS = [
  'user_service',
  'core_service',
  'admin_service',
  'router_service',
  'notification_service',
]

const SEVERITY_BADGE = {
  critical: 'failed',
  warning: 'pending',
  info: 'draft',
}

const STATUS_BADGE = {
  active: 'failed',
  acknowledged: 'pending',
  resolved: 'active',
}

const columns = computed(() => {
  const cols = [
    { key: 'severity', label: 'Severity', width: '110px' },
    { key: 'alarm', label: 'Alarm' },
    { key: 'source_service', label: 'Source', width: '150px' },
    { key: 'repeat_count', label: 'Repeats', width: '80px' },
    { key: 'last_seen', label: 'Last Seen', width: '150px' },
    { key: 'status', label: 'Status', width: '130px' },
  ]
  if (canAct.value) cols.push({ key: 'actions', label: '', width: '170px' })
  return cols
})

const page = ref(1)
const pageSize = 20
const filterSeverity = ref('')
const filterStatus = ref('')
const filterSource = ref('')
const expandedAlarm = ref(null)
const actionLoadingId = ref(null)
const resolveAllLoading = ref(false)

const expandedFields = computed(() => {
  if (!expandedAlarm.value) return {}
  const { context, ...rest } = expandedAlarm.value
  return rest
})

const contextJson = computed(() =>
    JSON.stringify(expandedAlarm.value?.context ?? {}, null, 2)
)

async function load() {
  const params = { offset: (page.value - 1) * pageSize, limit: pageSize }
  if (filterSeverity.value) params.severity = filterSeverity.value
  if (filterStatus.value) params.status = filterStatus.value
  if (filterSource.value) params.source = filterSource.value

  try {
    await alarm.loadList(params)
    syncExpanded()
  } catch (err) {
    toaster.push(err.message || 'Failed to load alarms')
  }
}

function resetAndLoad() {
  page.value = 1
  expandedAlarm.value = null
  load()
}

function toggleExpand(row) {
  expandedAlarm.value = expandedAlarm.value?.id === row.id ? null : row
}

function syncExpanded() {
  if (!expandedAlarm.value) return
  expandedAlarm.value = alarm.items.value.find(a => a.id === expandedAlarm.value.id) || null
}

async function handleAck(row) {
  actionLoadingId.value = row.id
  try {
    await alarm.acknowledge(row.id)
    syncExpanded()
    toaster.success('Alarm acknowledged')
  } catch (err) {
    toaster.push(err.message || 'Failed to acknowledge alarm')
  } finally {
    actionLoadingId.value = null
  }
}

async function handleResolve(row) {
  actionLoadingId.value = row.id
  try {
    await alarm.resolve(row.id)
    syncExpanded()
    toaster.success('Alarm resolved')
  } catch (err) {
    toaster.push(err.message || 'Failed to resolve alarm')
  } finally {
    actionLoadingId.value = null
  }
}

async function handleResolveAll() {
  const confirmed = await confirm.show({
    title: 'Resolve all alarms',
    message: 'This resolves every non-resolved alarm. Are you sure?',
    confirmText: 'Resolve all',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  resolveAllLoading.value = true
  try {
    const res = await alarm.resolveAll()
    syncExpanded()
    toaster.success(`${res.resolved_count} alarm${res.resolved_count === 1 ? '' : 's'} resolved`)
  } catch (err) {
    toaster.push(err.message || 'Failed to resolve alarms')
  } finally {
    resolveAllLoading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, HH:mm:ss') } catch { return val }
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

.alarm-message {
  display: block;
}

.row-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
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
  min-width: 120px;
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
