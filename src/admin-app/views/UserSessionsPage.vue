<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User</RouterLink>
      <h1 class="page-title">Sessions</h1>
    </div>

    <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        empty-text="No sessions."
    >
      <template #cell-device="{ value }">
        <span class="fw-medium">{{ value || 'Unknown device' }}</span>
      </template>
      <template #cell-ip="{ value }">{{ value || '—' }}</template>
      <template #cell-user_agent="{ value }">
        <span class="text-caption color-text-secondary user-agent">{{ value || '—' }}</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
      <template #cell-last_active="{ value }">{{ formatDate(value) }}</template>

      <template #pagination>
        <Pagination :page="page" :page-size="pageSize" :total="total" @update:page="setPage" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import apiClient from '../scripts/core/apiClient.js'
import { usePagedList } from '../scripts/core/usePagedList.js'

const route = useRoute()
const userId = route.params.id

const columns = [
  { key: 'device', label: 'Device', width: '180px' },
  { key: 'ip', label: 'IP', width: '140px' },
  { key: 'user_agent', label: 'User agent' },
  { key: 'created_at', label: 'Login', width: '170px' },
  { key: 'last_active', label: 'Last active', width: '170px' },
]

const { items, total, loading, page, pageSize, setPage } = usePagedList(
    params => apiClient.listPlatformUserSessions(userId, params),
    {},
    'Failed to load sessions',
)

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.back-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.user-agent {
  overflow-wrap: anywhere;
}
</style>
