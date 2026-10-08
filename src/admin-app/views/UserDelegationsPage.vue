<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User</RouterLink>
      <h1 class="page-title">Delegations</h1>
    </div>

    <div class="tabs">
      <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          class="tab-btn text-body-s"
          :class="{ active: filters.direction === t.key }"
          @click="setFilter('direction', t.key)"
      >
        {{ t.label }}
      </button>
    </div>

    <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        empty-text="No delegations."
    >
      <template #cell-title="{ value }">
        <span class="fw-medium">{{ value || '(untitled)' }}</span>
      </template>
      <template #cell-counterpart="{ row }">
        <span class="text-body-s">{{ row.counterpart_email || row.counterpart_user_id || '—' }}</span>
      </template>
      <template #cell-state="{ row }">
        <Badge :type="STATE_BADGES[row.status || row.state] || 'draft'" :value="row.status || row.state" />
      </template>
      <template #cell-since="{ row }">
        {{ formatDate(row.waiting_since || row.created_at) }}
      </template>

      <template #pagination>
        <Pagination :page="page" :page-size="pageSize" :total="total" @update:page="setPage" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import apiClient from '../scripts/core/apiClient.js'
import { usePagedList } from '../scripts/core/usePagedList.js'

const route = useRoute()
const userId = route.params.id

const TABS = [
  { key: 'out', label: 'By them' },
  { key: 'in', label: 'To them' },
]

const STATE_BADGES = { pending: 'pending', inbox: 'pending', clarified: 'pending', completed: 'active', trashed: 'draft' }

const columns = [
  { key: 'title', label: 'Title' },
  { key: 'counterpart', label: 'Counterpart' },
  { key: 'state', label: 'Status', width: '120px' },
  { key: 'since', label: 'Since', width: '160px' },
]

const { items, total, loading, page, pageSize, filters, setPage, setFilter } = usePagedList(
    params => apiClient.listUserDelegations(userId, params),
    { direction: 'out' },
    'Failed to load delegations',
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

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 12px;
  border-bottom: 2px solid var(--color-border-light);
}

.tab-btn {
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  color: var(--color-action);
  border-bottom-color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}
</style>
