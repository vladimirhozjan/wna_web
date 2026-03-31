<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/admins" class="text-body-s back-link">&larr; Admin Users</RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!admin" class="empty-state">
      <p class="text-body-m color-text-secondary">Admin not found.</p>
    </div>

    <div v-else class="detail">
      <!-- Info card -->
      <div class="info-card card">
        <div class="info-row">
          <span class="text-label color-text-secondary">Email</span>
          <span class="text-body-m fw-medium">{{ admin.email }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Role</span>
          <Badge type="role" :value="admin.role" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Status</span>
          <Badge type="status" :value="admin.status" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Created</span>
          <span class="text-body-s">{{ formatDate(admin.created_at) }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Last Login</span>
          <span class="text-body-s">{{ formatDate(admin.last_login_at) }}</span>
        </div>
      </div>

      <!-- Actions card -->
      <div v-if="!isSelf" class="actions-card card">
        <h3 class="text-label color-text-secondary actions-title">Actions</h3>

        <!-- Change Role -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Change Role</span>
            <span class="text-caption color-text-tertiary">Update this admin's permissions level</span>
          </div>
          <div class="action-control">
            <select v-model="selectedRole" class="text-body-s select-input" :disabled="actionLoading">
              <option value="viewer">Viewer</option>
              <option value="support">Support</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <Btn
                variant="ghost" size="sm"
                :disabled="selectedRole === admin.role || actionLoading"
                :loading="actionLoading"
                @click="handleChangeRole"
            >
              Apply
            </Btn>
          </div>
        </div>

        <!-- Disable / Enable -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">{{ admin.status === 'disabled' ? 'Enable Account' : 'Disable Account' }}</span>
            <span class="text-caption color-text-tertiary">
              {{ admin.status === 'disabled' ? 'Re-activate this admin account' : 'Prevent this admin from logging in' }}
            </span>
          </div>
          <Btn
              :variant="admin.status === 'disabled' ? 'ghost' : 'ghost-danger'"
              size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleToggleStatus"
          >
            {{ admin.status === 'disabled' ? 'Enable' : 'Disable' }}
          </Btn>
        </div>

        <!-- Force Password Reset -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Force Password Reset</span>
            <span class="text-caption color-text-tertiary">Clear password & OTP, send reset email</span>
          </div>
          <Btn
              variant="ghost-danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleForceReset"
          >
            Force Reset
          </Btn>
        </div>
      </div>

      <p v-else class="text-body-s color-text-tertiary self-note">
        You cannot modify your own account from this page. Use Settings to change your password or OTP.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Spinner from '../components/Spinner.vue'
import { authModel } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const route = useRoute()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const admin = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const selectedRole = ref('')

const isSelf = computed(() => admin.value?.id === auth.currentAdmin.value?.id)

async function load() {
  loading.value = true
  try {
    const data = await apiClient.listAdmins({ limit: 100 })
    const found = (data.items || []).find(a => a.id === route.params.id)
    admin.value = found || null
    if (found) selectedRole.value = found.role
  } catch (err) {
    toaster.push(err.message || 'Failed to load admin')
  } finally {
    loading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

async function handleChangeRole() {
  if (selectedRole.value === admin.value.role) return
  const confirmed = await confirm.show({
    title: 'Change Role',
    message: `Change ${admin.value.email}'s role to ${selectedRole.value}?`,
    confirmText: 'Change Role',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.updateAdmin(admin.value.id, { role: selectedRole.value })
    toaster.success('Role updated')
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to update role')
  } finally {
    actionLoading.value = false
  }
}

async function handleToggleStatus() {
  const isDisabled = admin.value.status === 'disabled'
  const action = isDisabled ? 'enable' : 'disable'
  const confirmed = await confirm.show({
    title: `${isDisabled ? 'Enable' : 'Disable'} Account`,
    message: `Are you sure you want to ${action} ${admin.value.email}?`,
    confirmText: isDisabled ? 'Enable' : 'Disable',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    if (isDisabled) {
      await apiClient.updateAdmin(admin.value.id, { enabled: true })
    } else {
      await apiClient.disableAdmin(admin.value.id)
    }
    toaster.success(`Account ${action}d`)
    await load()
  } catch (err) {
    toaster.push(err.message || `Failed to ${action} account`)
  } finally {
    actionLoading.value = false
  }
}

async function handleForceReset() {
  const confirmed = await confirm.show({
    title: 'Force Password Reset',
    message: `This will clear ${admin.value.email}'s password and OTP, and send a reset email. They will need to re-onboard.`,
    confirmText: 'Force Reset',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.forceResetAdmin(admin.value.id)
    toaster.success('Password reset email sent')
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to force reset')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 700px;
}

.page-header {
  margin-bottom: 20px;
}

.back-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-card {
  padding: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.info-row:last-child {
  border-bottom: none;
}

.actions-card {
  padding: 20px;
}

.actions-title {
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 16px;
}

.action-row:last-child {
  border-bottom: none;
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.select-input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

.self-note {
  font-style: italic;
}

@media (max-width: 768px) {
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-control {
    align-self: flex-end;
  }
}
</style>
