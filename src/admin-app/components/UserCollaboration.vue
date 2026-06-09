<template>
  <div class="user-collaboration">
    <!-- Connections -->
    <div class="info-card card">
      <h3 class="text-label color-text-secondary section-title">Connections</h3>
      <DataTable
          :columns="connectionColumns"
          :rows="connections"
          :loading="connectionsLoading"
          :show-pagination="false"
          empty-text="No connections."
      >
        <template #cell-connection="{ row }">
          <span class="fw-medium">{{ otherParty(row) }}</span>
        </template>
        <template #cell-status="{ value }">
          <Badge :type="statusBadge(value)" :value="value" />
        </template>
        <template #cell-since="{ row }">
          {{ formatDate(row.accepted_at || row.created_at) }}
        </template>
        <template #cell-actions="{ row }">
          <Btn
              v-if="canManage && row.status === 'accepted'"
              variant="ghost-danger" size="sm"
              :loading="connectionActionId === row.id"
              :disabled="!!connectionActionId"
              @click="handleRemoveConnection(row)"
          >
            Remove
          </Btn>
        </template>
      </DataTable>
    </div>

    <!-- Shared Projects -->
    <div class="info-card card">
      <div class="card-head">
        <h3 class="text-label color-text-secondary section-title">Shared Projects</h3>
        <SearchInput
            v-if="sharedProjects.length"
            v-model="projectQuery"
            placeholder="Filter by title..."
        />
      </div>
      <DataTable
          :columns="projectColumns"
          :rows="filteredProjects"
          :loading="projectsLoading"
          :row-clickable="true"
          :show-pagination="false"
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
      </DataTable>
    </div>

    <!-- Delegations -->
    <div class="info-card card">
      <h3 class="text-label color-text-secondary section-title">Delegations</h3>
      <DataTable
          :columns="delegationColumns"
          :rows="delegations"
          :loading="delegationsLoading"
          :show-pagination="false"
          empty-text="No delegations."
      >
        <template #cell-direction="{ value }">
          <Badge :type="value === 'out' ? 'pending' : 'primary'" :value="value === 'out' ? 'Delegated out' : 'Delegated in'" />
        </template>
        <template #cell-title="{ value }">
          <span class="fw-medium">{{ value || '(untitled)' }}</span>
        </template>
        <template #cell-counterpart="{ row }">
          <span class="text-body-s">{{ row.counterpart }}</span>
        </template>
        <template #cell-state="{ row }">
          <Badge :type="statusBadge(row.state)" :value="row.state" />
        </template>
        <template #cell-since="{ value }">
          {{ formatDate(value) }}
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from './Badge.vue'
import Btn from './Btn.vue'
import DataTable from './DataTable.vue'
import SearchInput from './SearchInput.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const props = defineProps({
  userId: { type: String, required: true },
  userEmail: { type: String, default: '' },
})

const router = useRouter()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const role = computed(() => auth.currentAdmin.value?.role)
const canManage = computed(() => hasMinRole(role.value, 'admin'))

// Connections
const connections = ref([])
const connectionsLoading = ref(true)
const connectionActionId = ref(null)
const connectionColumns = [
  { key: 'connection', label: 'Connection', sortable: false },
  { key: 'status', label: 'Status', sortable: false, width: '120px' },
  { key: 'since', label: 'Since', sortable: false, width: '160px' },
  { key: 'actions', label: '', sortable: false, width: '100px' },
]

// Shared projects
const sharedProjects = ref([])
const projectsLoading = ref(true)
const projectQuery = ref('')
const projectColumns = [
  { key: 'title', label: 'Title', sortable: false },
  { key: 'role', label: 'Role', sortable: false, width: '120px' },
  { key: 'state', label: 'State', sortable: false, width: '110px' },
]
const filteredProjects = computed(() => {
  const q = projectQuery.value.trim().toLowerCase()
  if (!q) return sharedProjects.value
  return sharedProjects.value.filter(p => (p.title || '').toLowerCase().includes(q))
})

// Delegations
const delegations = ref([])
const delegationsLoading = ref(true)
const delegationColumns = [
  { key: 'direction', label: 'Direction', sortable: false, width: '150px' },
  { key: 'title', label: 'Title', sortable: false },
  { key: 'counterpart', label: 'Counterpart', sortable: false },
  { key: 'state', label: 'Status', sortable: false, width: '120px' },
  { key: 'since', label: 'Since', sortable: false, width: '160px' },
]

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function otherParty(row) {
  // The "other side" relative to THIS user — never the user's own email.
  // (Backend `connected_user_email` is always the invitee, so it's wrong when this user is the invitee.)
  return row.inviter_id === props.userId ? row.invitee_email : row.inviter_email
}

function statusBadge(value) {
  switch (value) {
    case 'accepted':
    case 'completed':
      return 'active'
    case 'pending':
    case 'inbox':
    case 'clarified':
      return 'pending'
    case 'declined':
      return 'failed'
    case 'removed':
    case 'trashed':
    default:
      return 'draft'
  }
}

function roleLabel(value) {
  const map = { owner: 'Owner', write: 'Write', read_only: 'Read-only' }
  return map[value] || value || '—'
}

async function loadConnections() {
  connectionsLoading.value = true
  try {
    const data = await apiClient.listConnections({ user_id: props.userId })
    connections.value = data.items || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load connections')
  } finally {
    connectionsLoading.value = false
  }
}

async function loadSharedProjects() {
  projectsLoading.value = true
  try {
    const data = await apiClient.listSharedProjects({ member_user_id: props.userId, limit: 100 })
    sharedProjects.value = data.items || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load shared projects')
  } finally {
    projectsLoading.value = false
  }
}

async function loadDelegations() {
  delegationsLoading.value = true
  try {
    const data = await apiClient.listUserDelegations(props.userId)
    const out = (data.delegated_out || []).map(d => ({
      direction: 'out',
      title: d.title,
      counterpart: d.counterpart_email || d.counterpart_user_id || '—',
      state: d.status,
      since: d.waiting_since,
    }))
    const incoming = (data.delegated_in || []).map(d => ({
      direction: 'in',
      title: d.title,
      counterpart: d.counterpart_email || d.counterpart_user_id || '—',
      state: d.state,
      since: d.created_at,
    }))
    delegations.value = [...out, ...incoming]
  } catch (err) {
    toaster.push(err.message || 'Failed to load delegations')
  } finally {
    delegationsLoading.value = false
  }
}

function goToProject(row) {
  router.push({ name: 'shared-project-detail', params: { id: row.id }, query: { from: `/users/${props.userId}` } })
}

async function handleRemoveConnection(row) {
  const confirmed = await confirm.show({
    title: 'Remove Connection',
    message: `Force-remove the connection with ${otherParty(row)}? This cascades to shared-project membership: their assigned actions return to the backlog, and a last-non-owner removal auto-unshares the project.`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  connectionActionId.value = row.id
  try {
    await apiClient.removeConnection(row.id)
    toaster.success('Connection removed')
    await loadConnections()
  } catch (err) {
    toaster.push(err.message || 'Failed to remove connection')
  } finally {
    connectionActionId.value = null
  }
}

onMounted(() => {
  loadConnections()
  loadSharedProjects()
  loadDelegations()
})
</script>

<style scoped>
.user-collaboration {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  padding: 20px;
}

.section-title {
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.card-head .section-title {
  margin: 0;
}

@media (max-width: 768px) {
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
