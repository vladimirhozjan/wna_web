<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Users</h1>
      <Btn v-if="hasMinRole(role, 'admin')" variant="primary" size="sm" @click="showInviteModal = true">Invite User</Btn>
    </div>

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

    <!-- Invite User Modal -->
    <Modal :visible="showInviteModal" title="Invite User" @close="closeInviteModal">
      <form @submit.prevent="handleInvite" class="invite-form">
        <Inpt
            v-model="inviteEmail"
            v-model:error="inviteEmailError"
            type="email"
            title="Email"
            placeholder="user@example.com"
            :disabled="inviting"
        />

        <label class="select-label">
          <span class="text-label color-text-primary">Tier</span>
          <select v-model="inviteTier" class="text-body-m select-input" :disabled="inviting">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
          </select>
        </label>

        <p class="text-caption color-text-secondary invite-hint">
          An invitation email with a set-password link will be sent to this address.
        </p>

        <p v-if="inviteError" class="text-body-s color-text-danger invite-error">{{ inviteError }}</p>
      </form>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeInviteModal" :disabled="inviting">Cancel</Btn>
        <Btn variant="primary" size="sm" @click="handleInvite" :loading="inviting" :disabled="inviting">Invite</Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import SearchInput from '../components/SearchInput.vue'
import Badge from '../components/Badge.vue'
import StatusDot from '../components/StatusDot.vue'
import Btn from '../components/Btn.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const router = useRouter()
const auth = authModel()
const toaster = errorModel()

const role = computed(() => auth.currentAdmin.value?.role)

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

// Invite modal
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteEmailError = ref('')
const inviteTier = ref('free')
const inviteError = ref('')
const inviting = ref(false)

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

function closeInviteModal() {
  showInviteModal.value = false
  inviteEmail.value = ''
  inviteEmailError.value = ''
  inviteTier.value = 'free'
  inviteError.value = ''
}

async function handleInvite() {
  inviteError.value = ''
  inviteEmailError.value = ''

  if (!inviteEmail.value.trim()) {
    inviteEmailError.value = 'Email is required'
    return
  }

  inviting.value = true
  try {
    await apiClient.invitePlatformUser(inviteEmail.value.trim(), inviteTier.value)
    toaster.success('Invitation sent to ' + inviteEmail.value.trim())
    closeInviteModal()
    await load()
  } catch (err) {
    if (err.status === 409) {
      inviteError.value = 'A user with this email already exists'
    } else {
      inviteError.value = err.message || 'Failed to send invitation'
    }
  } finally {
    inviting.value = false
  }
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

.invite-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.select-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.select-input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.invite-hint {
  margin: 0;
}

.invite-error {
  margin: 0;
}
</style>
