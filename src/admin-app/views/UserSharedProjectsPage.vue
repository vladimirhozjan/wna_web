<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User</RouterLink>
      <h1 class="page-title">Shared Projects</h1>
    </div>

    <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        :row-clickable="true"
        empty-text="No shared projects."
        @row-click="goToProject"
    >
      <template #cell-title="{ value }">
        <span class="fw-medium">{{ value || '(untitled)' }}</span>
      </template>
      <template #cell-role="{ value }">
        <span class="text-body-s">{{ roleLabel(value) }}</span>
      </template>
      <template #cell-state="{ value }">
        <Badge type="primary" :value="value || 'ACTIVE'" />
      </template>

      <template #pagination>
        <Pagination :page="page" :page-size="pageSize" :total="total" @update:page="setPage" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import Badge from '../components/Badge.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import apiClient from '../scripts/core/apiClient.js'
import { usePagedList } from '../scripts/core/usePagedList.js'

const route = useRoute()
const router = useRouter()
const userId = route.params.id

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'role', label: 'Role', width: '120px' },
  { key: 'state', label: 'State', width: '110px' },
]

const { items, total, loading, page, pageSize, setPage } = usePagedList(
    params => apiClient.listSharedProjects({ member_user_id: userId, ...params }),
    {},
    'Failed to load shared projects',
)

function roleLabel(value) {
  const map = { owner: 'Owner', write: 'Write', read_only: 'Read-only' }
  return map[value] || value || '—'
}

function goToProject(row) {
  router.push({ name: 'shared-project-detail', params: { id: row.id }, query: { from: route.fullPath } })
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
</style>
