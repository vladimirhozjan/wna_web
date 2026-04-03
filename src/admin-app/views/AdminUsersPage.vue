<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Admin Users</h1>
      <Btn variant="primary" size="sm" @click="showCreateModal = true">Create Admin</Btn>
    </div>

    <DataTable
        :columns="columns"
        :rows="admins"
        :loading="loading"
        :row-clickable="true"
        empty-text="No admin users found."
        @row-click="goToDetail"
    >
      <template #cell-email="{ value }">
        <span class="fw-medium">{{ value }}</span>
      </template>
      <template #cell-role="{ value }">
        <Badge type="role" :value="value" />
      </template>
      <template #cell-status="{ value }">
        <Badge type="status" :value="value" />
      </template>
      <template #cell-last_login_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-created_at="{ value }">
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

    <!-- Create Admin Modal -->
    <Modal :visible="showCreateModal" title="Create Admin" @close="closeCreateModal">
      <form @submit.prevent="handleCreate" class="create-form">
        <Inpt
            v-model="newEmail"
            v-model:error="newEmailError"
            type="email"
            title="Email"
            placeholder="admin@example.com"
            :disabled="creating"
        />

        <label class="select-label">
          <span class="text-label color-text-primary">Role</span>
          <select v-model="newRole" class="text-body-m select-input" :disabled="creating">
            <option value="viewer">Viewer</option>
            <option value="support">Support</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <p class="text-caption color-text-secondary create-hint">
          A password reset email will be sent to this address.
        </p>

        <p v-if="createError" class="text-body-s color-text-danger create-error">{{ createError }}</p>
      </form>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeCreateModal" :disabled="creating">Cancel</Btn>
        <Btn variant="primary" size="sm" @click="handleCreate" :loading="creating" :disabled="creating">Create</Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const router = useRouter()
const toaster = errorModel()

const columns = [
  { key: 'email', label: 'Email', sortable: false },
  { key: 'role', label: 'Role', sortable: false, width: '120px' },
  { key: 'status', label: 'Status', sortable: false, width: '130px' },
  { key: 'last_login_at', label: 'Last Login', sortable: false, width: '150px' },
  { key: 'created_at', label: 'Created', sortable: false, width: '150px' },
]

const admins = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = 20

// Create modal
const showCreateModal = ref(false)
const newEmail = ref('')
const newEmailError = ref('')
const newRole = ref('viewer')
const createError = ref('')
const creating = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await apiClient.listAdmins({ offset: (page.value - 1) * pageSize, limit: pageSize })
    admins.value = data.items || []
    totalCount.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load admin users')
  } finally {
    loading.value = false
  }
}

function goToDetail(row) {
  router.push({ name: 'admin-detail', params: { id: row.id } })
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function closeCreateModal() {
  showCreateModal.value = false
  newEmail.value = ''
  newEmailError.value = ''
  newRole.value = 'viewer'
  createError.value = ''
}

async function handleCreate() {
  createError.value = ''
  newEmailError.value = ''

  if (!newEmail.value.trim()) {
    newEmailError.value = 'Email is required'
    return
  }

  creating.value = true
  try {
    await apiClient.createAdmin(newEmail.value.trim(), newRole.value)
    toaster.success('Admin created — password reset email sent')
    closeCreateModal()
    await load()
  } catch (err) {
    createError.value = err.message || 'Failed to create admin'
  } finally {
    creating.value = false
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
  margin-bottom: 20px;
}

.create-form {
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

.create-hint {
  margin: 0;
}

.create-error {
  margin: 0;
}
</style>
