<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/users" class="text-body-s back-link">&larr; Users</RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!user" class="empty-state">
      <p class="text-body-m color-text-secondary">User not found.</p>
    </div>

    <div v-else class="detail">
      <!-- Profile -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Profile</h3>
        <div class="info-row">
          <span class="text-label color-text-secondary">Email</span>
          <span class="text-body-m fw-medium">{{ user.email }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Email Verified</span>
          <StatusDot :color="user.email_verified ? 'green' : 'gray'" :title="user.email_verified ? 'Verified' : 'Unverified'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Status</span>
          <Badge type="status" :value="user.disabled ? 'disabled' : 'active'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Tier</span>
          <Badge type="role" :value="user.subscription_tier || 'free'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Login Provider</span>
          <span class="text-body-s">{{ user.login_provider || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Created</span>
          <span class="text-body-s">{{ formatDate(user.created_at) }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Last Active</span>
          <span class="text-body-s">{{ formatDate(user.last_active) }}</span>
        </div>
      </div>

      <!-- WNA Data Summary -->
      <div v-if="user.wna_data" class="info-card card">
        <h3 class="text-label color-text-secondary section-title">WNA Summary</h3>
        <div class="wna-grid">
          <Stat label="Inbox (Stuff)" :value="user.wna_data.stuff_count" />
          <Stat label="Next Actions" :value="user.wna_data.action_next" />
          <Stat label="Today" :value="user.wna_data.action_today" />
          <Stat label="Calendar" :value="user.wna_data.action_calendar" />
          <Stat label="Waiting" :value="user.wna_data.action_waiting" />
          <Stat label="Backlog" :value="user.wna_data.action_backlog" />
          <Stat label="Someday" :value="user.wna_data.action_someday" />
          <Stat label="Completed Actions" :value="user.wna_data.action_completed" />
          <Stat label="Active Projects" :value="user.wna_data.project_active" />
          <Stat label="Completed Projects" :value="user.wna_data.project_completed" />
          <Stat label="Someday Projects" :value="user.wna_data.project_someday" />
          <Stat label="Tags" :value="user.wna_data.tag_count" />
        </div>
      </div>

      <!-- Login History -->
      <div v-if="user.login_history && user.login_history.length" class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Login History</h3>
        <div class="login-history">
          <div v-for="session in user.login_history" :key="session.id" class="history-row">
            <div class="history-main">
              <span class="text-body-s fw-medium">{{ session.device || 'Unknown device' }}</span>
              <span class="text-caption color-text-tertiary">IP: {{ session.ip || '—' }}</span>
            </div>
            <div class="history-times">
              <span class="text-caption color-text-tertiary">Login: {{ formatDate(session.created_at) }}</span>
              <span class="text-caption color-text-tertiary">Active: {{ formatDate(session.last_active) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="hasMinRole(role, 'admin')" class="actions-card card">
        <h3 class="text-label color-text-secondary section-title">Actions</h3>

        <!-- Disable / Enable -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">{{ user.disabled ? 'Enable Account' : 'Disable Account' }}</span>
            <span class="text-caption color-text-tertiary">
              {{ user.disabled ? 'Re-activate this user account' : 'Block this user from logging in' }}
            </span>
          </div>
          <Btn
              :variant="user.disabled ? 'ghost' : 'ghost-danger'"
              size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleToggleDisabled"
          >
            {{ user.disabled ? 'Enable' : 'Disable' }}
          </Btn>
        </div>

        <!-- Reset Password -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Reset Password</span>
            <span class="text-caption color-text-tertiary">Send a password reset email to this user</span>
          </div>
          <Btn
              variant="ghost" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleResetPassword"
          >
            Reset
          </Btn>
        </div>

        <!-- Force Logout -->
        <div class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Force Logout</span>
            <span class="text-caption color-text-tertiary">Invalidate all active sessions</span>
          </div>
          <Btn
              variant="ghost-danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleForceLogout"
          >
            Force Logout
          </Btn>
        </div>

        <!-- Change Tier (super_admin only) -->
        <div v-if="hasMinRole(role, 'super_admin')" class="action-row">
          <div class="action-info">
            <span class="text-body-s fw-medium">Change Tier</span>
            <span class="text-caption color-text-tertiary">Update subscription tier</span>
          </div>
          <div class="action-control">
            <select v-model="selectedTier" class="text-body-s select-input" :disabled="actionLoading">
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="team">Team</option>
            </select>
            <Btn
                variant="ghost" size="sm"
                :disabled="selectedTier === (user.subscription_tier || 'free') || actionLoading"
                :loading="actionLoading"
                @click="handleChangeTier"
            >
              Apply
            </Btn>
          </div>
        </div>

        <!-- Delete Account (super_admin only) -->
        <div v-if="hasMinRole(role, 'super_admin')" class="action-row action-row--danger">
          <div class="action-info">
            <span class="text-body-s fw-medium color-text-danger">Delete Account</span>
            <span class="text-caption color-text-tertiary">Soft-delete with 30-day grace period</span>
          </div>
          <Btn
              variant="danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleDelete"
          >
            Delete
          </Btn>
        </div>
      </div>

      <!-- Browse Data -->
      <div v-if="hasMinRole(role, 'support')" class="browse-card card">
        <RouterLink :to="`/content/${user.id}`" class="browse-btn">
          <svg class="browse-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3h5l2 2h7v12H3V3z"/></svg>
          <div class="browse-text">
            <span class="text-body-s fw-medium">Browse User Data</span>
            <span class="text-caption color-text-tertiary">View inbox, actions, projects, tags, attachments</span>
          </div>
          <span class="text-body-s color-text-tertiary">&rarr;</span>
        </RouterLink>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <Modal :visible="showDeleteModal" title="Delete User Account" @close="showDeleteModal = false">
      <p class="text-body-s">
        This will soft-delete the account with a 30-day grace period. Type the user's email to confirm:
      </p>
      <p class="text-body-s fw-semibold delete-email">{{ user?.email }}</p>
      <Inpt
          v-model="deleteEmailInput"
          type="email"
          placeholder="Type email to confirm"
          :disabled="actionLoading"
      />
      <p v-if="deleteError" class="text-body-s color-text-danger delete-error">{{ deleteError }}</p>

      <template #actions>
        <Btn variant="ghost" size="sm" @click="showDeleteModal = false" :disabled="actionLoading">Cancel</Btn>
        <Btn
            variant="danger" size="sm"
            :loading="actionLoading"
            :disabled="actionLoading || deleteEmailInput !== user?.email"
            @click="confirmDelete"
        >
          Delete Account
        </Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import StatusDot from '../components/StatusDot.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const route = useRoute()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const user = ref(null)
const loading = ref(true)
const actionLoading = ref(false)

const role = computed(() => auth.currentAdmin.value?.role)
const selectedTier = ref('free')

// Delete modal state
const showDeleteModal = ref(false)
const deleteEmailInput = ref('')
const deleteError = ref('')

async function load() {
  loading.value = true
  try {
    user.value = await apiClient.getPlatformUser(route.params.id)
    if (user.value) selectedTier.value = user.value.subscription_tier || 'free'
  } catch (err) {
    toaster.push(err.message || 'Failed to load user')
    user.value = null
  } finally {
    loading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

async function handleChangeTier() {
  const confirmed = await confirm.show({
    title: 'Change Tier',
    message: `Change ${user.value.email}'s tier to ${selectedTier.value}?`,
    confirmText: 'Change Tier',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.changePlatformUserTier(user.value.id, selectedTier.value)
    toaster.success('Tier updated')
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to change tier')
  } finally {
    actionLoading.value = false
  }
}

async function handleToggleDisabled() {
  const isDisabled = user.value.disabled
  const action = isDisabled ? 'enable' : 'disable'
  const confirmed = await confirm.show({
    title: `${isDisabled ? 'Enable' : 'Disable'} Account`,
    message: `Are you sure you want to ${action} ${user.value.email}?`,
    confirmText: isDisabled ? 'Enable' : 'Disable',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    if (isDisabled) {
      await apiClient.enablePlatformUser(user.value.id)
    } else {
      await apiClient.disablePlatformUser(user.value.id)
    }
    toaster.success(`Account ${action}d`)
    await load()
  } catch (err) {
    toaster.push(err.message || `Failed to ${action} account`)
  } finally {
    actionLoading.value = false
  }
}

async function handleResetPassword() {
  const confirmed = await confirm.show({
    title: 'Reset Password',
    message: `Send a password reset email to ${user.value.email}?`,
    confirmText: 'Reset Password',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.resetPlatformUserPassword(user.value.id)
    toaster.success('Password reset email sent')
  } catch (err) {
    toaster.push(err.message || 'Failed to send reset email')
  } finally {
    actionLoading.value = false
  }
}

async function handleForceLogout() {
  const confirmed = await confirm.show({
    title: 'Force Logout',
    message: `Invalidate all sessions for ${user.value.email}?`,
    confirmText: 'Force Logout',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.forceLogoutPlatformUser(user.value.id)
    toaster.success('All sessions invalidated')
  } catch (err) {
    toaster.push(err.message || 'Failed to force logout')
  } finally {
    actionLoading.value = false
  }
}

function handleDelete() {
  deleteEmailInput.value = ''
  deleteError.value = ''
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (deleteEmailInput.value !== user.value.email) {
    deleteError.value = 'Email does not match'
    return
  }

  actionLoading.value = true
  deleteError.value = ''
  try {
    await apiClient.deletePlatformUser(user.value.id, deleteEmailInput.value)
    toaster.success('Account deleted (30-day grace period)')
    showDeleteModal.value = false
    await load()
  } catch (err) {
    deleteError.value = err.message || 'Failed to delete account'
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
  max-width: 800px;
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

.section-title {
  margin: 0 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

/* WNA grid */
.wna-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 16px;
}

/* Login history */
.login-history {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.history-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle);
  gap: 16px;
}

.history-row:last-child {
  border-bottom: none;
}

.history-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-times {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: right;
  white-space: nowrap;
}

/* Actions card */
.actions-card {
  padding: 20px;
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

.action-row--danger {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
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

/* Browse card */
.browse-card {
  padding: 0;
}

.browse-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  text-decoration: none;
  color: var(--color-text-primary);
  border-radius: 8px;
  transition: background 0.15s;
}

.browse-btn:hover {
  background: var(--color-bg-secondary);
}

.browse-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  color: var(--color-action);
}

.browse-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

/* Delete modal */
.delete-email {
  margin: 8px 0;
  font-family: var(--font-family-mono);
}

.delete-error {
  margin: 8px 0 0;
}

@media (max-width: 768px) {
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .history-times {
    text-align: left;
  }
}
</style>