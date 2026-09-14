<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Broadcasts</h1>
      <Btn v-if="canWrite" variant="primary" size="sm" @click="router.push('/broadcasts/new')">
        New broadcast
      </Btn>
    </div>

    <DataTable
        :columns="columns"
        :rows="broadcast.items.value"
        :loading="broadcast.listLoading.value && !broadcast.items.value.length"
        :row-clickable="true"
        empty-text="No broadcasts yet."
        @row-click="row => router.push(`/broadcasts/${row.id}`)"
    >
      <template #cell-status="{ value }">
        <Badge :type="STATUS_BADGE[value] || 'draft'" :value="value" />
      </template>
      <template #cell-kind="{ value }">
        {{ KIND_LABELS[value] || value }}
      </template>
      <template #cell-subject="{ value }">
        <span class="fw-medium">{{ value || '—' }}</span>
      </template>
      <template #cell-sent_at="{ row }">
        {{ formatDate(row.send_finished_at || row.send_started_at) }}
      </template>
      <template #cell-counts="{ row }">
        <span v-if="row.status === 'draft'">—</span>
        <span v-else class="counts">
          <span class="color-text-success">{{ row.sent_count }}</span>
          <span class="color-text-tertiary">/</span>
          <span class="color-text-secondary">{{ row.skipped_count }}</span>
          <span class="color-text-tertiary">/</span>
          <span :class="row.failed_count ? 'color-text-danger' : 'color-text-secondary'">{{ row.failed_count }}</span>
        </span>
      </template>
      <template #cell-actions="{ row }">
        <div class="row-actions">
          <Btn
              variant="ghost" size="sm"
              :disabled="actionLoadingId === row.id"
              @click.stop="handleCopy(row)"
          >
            Copy
          </Btn>
          <Btn
              v-if="row.status === 'draft'"
              variant="ghost-danger" size="sm"
              :disabled="actionLoadingId === row.id"
              @click.stop="handleDelete(row)"
          >
            Delete
          </Btn>
        </div>
      </template>

      <template #pagination>
        <Pagination
            :page="page"
            :page-size="pageSize"
            :total="broadcast.totalCount.value"
            @update:page="p => { page = p; load() }"
        />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import { broadcastModel, KIND_LABELS, STATUS_BADGE } from '../scripts/models/broadcastModel.js'

const router = useRouter()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()
const broadcast = broadcastModel()

const canWrite = computed(() => hasMinRole(auth.currentAdmin.value?.role, 'admin'))

const columns = computed(() => {
  const cols = [
    { key: 'status', label: 'Status', width: '110px' },
    { key: 'kind', label: 'Kind', width: '130px' },
    { key: 'subject', label: 'Subject' },
    { key: 'created_by', label: 'Created By', width: '200px' },
    { key: 'sent_at', label: 'Sent At', width: '150px' },
    { key: 'counts', label: 'Sent / Skipped / Failed', width: '170px' },
  ]
  if (canWrite.value) cols.push({ key: 'actions', label: '', width: '150px' })
  return cols
})

const page = ref(1)
const pageSize = 20
const actionLoadingId = ref(null)
let pollTimer = null

async function load() {
  try {
    await broadcast.loadList({ offset: (page.value - 1) * pageSize, limit: pageSize })
  } catch (err) {
    toaster.push(err.message || 'Failed to load broadcasts')
  }
}

async function handleCopy(row) {
  actionLoadingId.value = row.id
  try {
    const copy = await broadcast.copy(row.id)
    toaster.success('Copied to a new draft')
    router.push(`/broadcasts/${copy.id}`)
  } catch (err) {
    toaster.push(err.message || 'Failed to copy broadcast')
  } finally {
    actionLoadingId.value = null
  }
}

async function handleDelete(row) {
  const confirmed = await confirm.show({
    title: 'Delete draft',
    message: `Delete the draft "${row.subject || '(no subject)'}"? This cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoadingId.value = row.id
  try {
    await broadcast.remove(row.id)
    toaster.success('Draft deleted')
  } catch (err) {
    toaster.push(err.message || 'Failed to delete draft')
  } finally {
    actionLoadingId.value = null
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

onMounted(() => {
  load()
  pollTimer = setInterval(() => { if (broadcast.anySending.value) load() }, 30000)
})

onUnmounted(() => clearInterval(pollTimer))
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

.counts {
  display: inline-flex;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.row-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}
</style>
