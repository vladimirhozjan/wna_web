<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User</RouterLink>
      <h1 class="page-title">Connections</h1>
    </div>

    <div class="filters">
      <Select
          :model-value="filters.status"
          :options="STATUS_OPTIONS"
          title="Status"
          @update:model-value="v => setFilter('status', v)"
      />
    </div>

    <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        empty-text="No connections."
    >
      <template #cell-connection="{ row }">
        <span class="fw-medium">{{ otherParty(row) }}</span>
      </template>
      <template #cell-status="{ value }">
        <Badge :type="STATUS_BADGES[value] || 'draft'" :value="value" />
      </template>
      <template #cell-since="{ row }">
        {{ formatDate(row.accepted_at || row.created_at) }}
      </template>
      <template #cell-actions="{ row }">
        <Btn
            v-if="canManage && row.status === 'accepted'"
            variant="ghost-danger" size="sm"
            :loading="actionId === row.id"
            :disabled="!!actionId"
            @click="handleRemove(row)"
        >
          Remove
        </Btn>
      </template>

      <template #pagination>
        <Pagination :page="page" :page-size="pageSize" :total="total" @update:page="setPage" />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Select from '../components/Select.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'
import { usePagedList } from '../scripts/core/usePagedList.js'

const route = useRoute()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()
const userId = route.params.id

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
  { value: 'removed', label: 'Removed' },
]

const STATUS_BADGES = { accepted: 'active', pending: 'pending', declined: 'failed', removed: 'draft' }

const columns = [
  { key: 'connection', label: 'Connection' },
  { key: 'status', label: 'Status', width: '120px' },
  { key: 'since', label: 'Since', width: '160px' },
  { key: 'actions', label: '', width: '100px' },
]

const canManage = computed(() => hasMinRole(auth.currentAdmin.value?.role, 'admin'))
const actionId = ref(null)

const { items, total, loading, page, pageSize, filters, setPage, setFilter, reload } = usePagedList(
    params => apiClient.listConnections({ user_id: userId, ...params }),
    { status: '' },
    'Failed to load connections',
)

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function otherParty(row) {
  // The "other side" relative to this user — backend `connected_user_email` is always the invitee, so it's wrong when this user is the invitee.
  return row.inviter_id === userId ? row.invitee_email : row.inviter_email
}

async function handleRemove(row) {
  const confirmed = await confirm.show({
    title: 'Remove Connection',
    message: `Force-remove the connection with ${otherParty(row)}? This cascades to shared-project membership: their assigned actions return to the backlog, and a last-non-owner removal auto-unshares the project.`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionId.value = row.id
  try {
    await apiClient.removeConnection(row.id)
    toaster.success('Connection removed')
    await reload()
  } catch (err) {
    toaster.push(err.message || 'Failed to remove connection')
  } finally {
    actionId.value = null
  }
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

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
