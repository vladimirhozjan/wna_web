<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Connections</h1>
    </div>

    <div class="toolbar">
      <SearchInput v-model="userId" placeholder="Filter by user ID..." @update:model-value="resetAndLoad" />

      <select v-model="status" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="declined">Declined</option>
        <option value="removed">Removed</option>
      </select>
    </div>

    <DataTable
        :columns="columns"
        :rows="connections"
        :loading="loading"
        :row-clickable="true"
        empty-text="No connections found."
        @row-click="goToDetail"
    >
      <template #cell-inviter_email="{ value }">
        <span class="fw-medium">{{ value || '—' }}</span>
      </template>
      <template #cell-invitee_email="{ value }">
        {{ value || '—' }}
      </template>
      <template #cell-status="{ value }">
        <Badge :type="statusType(value)" :value="value" />
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-accepted_at="{ value }">
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import SearchInput from '../components/SearchInput.vue'
import Badge from '../components/Badge.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const router = useRouter()
const toaster = errorModel()

const columns = [
  { key: 'inviter_email', label: 'Inviter', sortable: false },
  { key: 'invitee_email', label: 'Invitee', sortable: false },
  { key: 'status', label: 'Status', sortable: false, width: '110px' },
  { key: 'created_at', label: 'Created', sortable: false, width: '160px' },
  { key: 'accepted_at', label: 'Accepted', sortable: false, width: '160px' },
]

const connections = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = 20
const status = ref('')
const userId = ref('')

function statusType(value) {
  switch (value) {
    case 'accepted': return 'active'
    case 'pending': return 'pending'
    case 'declined': return 'failed'
    default: return 'draft'
  }
}

async function load() {
  loading.value = true
  try {
    const params = {
      offset: (page.value - 1) * pageSize,
      limit: pageSize,
    }
    if (status.value) params.status = status.value
    if (userId.value.trim()) params.user_id = userId.value.trim()

    const data = await apiClient.listConnections(params)
    connections.value = data.items || []
    totalCount.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load connections')
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.value = 1
  load()
}

function goToDetail(row) {
  router.push({ name: 'connection-detail', params: { id: row.id } })
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}
</style>
