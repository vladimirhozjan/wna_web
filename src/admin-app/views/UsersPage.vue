<template>
  <div class="page">
    <h1 class="page-title">Users</h1>

    <div class="toolbar">
      <SearchInput v-model="search" placeholder="Search by email..." @update:model-value="resetAndLoad" />

      <select v-model="sortKey" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="created_at">Sort: Created</option>
        <option value="email">Sort: Email</option>
        <option value="last_active">Sort: Last Active</option>
      </select>

      <select v-model="sortDir" class="text-body-s filter-select" @change="resetAndLoad">
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </select>
    </div>

    <DataTable
        :columns="columns"
        :rows="users"
        :loading="loading"
        :row-clickable="true"
        empty-text="No users found."
        @row-click="goToDetail"
    >
      <template #cell-email="{ value }">
        <span class="fw-medium">{{ value }}</span>
      </template>
      <template #cell-subscription_tier="{ value }">
        <Badge type="role" :value="value || 'free'" />
      </template>
      <template #cell-email_verified="{ value }">
        <StatusDot :color="value ? 'green' : 'gray'" :title="value ? 'Verified' : 'Unverified'" />
      </template>
      <template #cell-disabled="{ value }">
        <Badge type="status" :value="value ? 'disabled' : 'active'" />
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-last_active="{ value }">
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
import StatusDot from '../components/StatusDot.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const router = useRouter()
const toaster = errorModel()

const columns = [
  { key: 'email', label: 'Email', sortable: false },
  { key: 'subscription_tier', label: 'Tier', sortable: false, width: '80px' },
  { key: 'email_verified', label: 'Verified', sortable: false, width: '80px' },
  { key: 'disabled', label: 'Status', sortable: false, width: '100px' },
  { key: 'created_at', label: 'Created', sortable: false, width: '150px' },
  { key: 'last_active', label: 'Last Active', sortable: false, width: '150px' },
]

const users = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = 20
const search = ref('')
const sortKey = ref('created_at')
const sortDir = ref('desc')

async function load() {
  loading.value = true
  try {
    const params = {
      offset: (page.value - 1) * pageSize,
      limit: pageSize,
      sort: sortKey.value,
      dir: sortDir.value,
    }
    if (search.value.trim()) params.search = search.value.trim()

    const data = await apiClient.listPlatformUsers(params)
    users.value = data.items || []
    totalCount.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load users')
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.value = 1
  load()
}

function goToDetail(row) {
  router.push({ name: 'user-detail', params: { id: row.id } })
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

.page-title {
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