<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/connections" class="text-body-s back-link">&larr; Connections</RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!connection" class="empty-state">
      <p class="text-body-m color-text-secondary">Connection not found.</p>
    </div>

    <div v-else class="detail">
      <!-- Info -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Connection</h3>
        <div class="info-row">
          <span class="text-label color-text-secondary">Status</span>
          <Badge :type="statusType(connection.status)" :value="connection.status" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Inviter</span>
          <span class="text-body-m fw-medium">{{ connection.inviter_email || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Inviter ID</span>
          <span class="text-caption color-text-tertiary mono">{{ connection.inviter_id || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Invitee</span>
          <span class="text-body-m fw-medium">{{ connection.invitee_email || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Invitee ID</span>
          <span class="text-caption color-text-tertiary mono">{{ connection.invitee_id || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Created</span>
          <span class="text-body-s">{{ formatDate(connection.created_at) }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Accepted</span>
          <span class="text-body-s">{{ formatDate(connection.accepted_at) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="hasMinRole(role, 'admin')" class="actions-card card">
        <h3 class="text-label color-text-secondary section-title">Actions</h3>
        <div class="action-row action-row--danger">
          <div class="action-info">
            <span class="text-body-s fw-medium color-text-danger">Remove Connection</span>
            <span class="text-caption color-text-tertiary">
              Force-removes the connection. Cascades to shared-project membership (assigned actions return to backlog; last non-owner removal auto-unshares).
            </span>
          </div>
          <Btn
              variant="danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading || connection.status === 'removed'"
              @click="handleRemove"
          >
            Remove
          </Btn>
        </div>
      </div>
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
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const route = useRoute()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const connection = ref(null)
const loading = ref(true)
const actionLoading = ref(false)

const role = computed(() => auth.currentAdmin.value?.role)

function statusType(value) {
  switch (value) {
    case 'accepted': return 'active'
    case 'pending': return 'pending'
    case 'declined': return 'failed'
    default: return 'draft'
  }
}

async function load() {
  loading.value = true
  try {
    connection.value = await apiClient.getConnection(route.params.id)
  } catch (err) {
    toaster.push(err.message || 'Failed to load connection')
    connection.value = null
  } finally {
    loading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

async function handleRemove() {
  const confirmed = await confirm.show({
    title: 'Remove Connection',
    message: `Force-remove the connection between ${connection.value.inviter_email || 'inviter'} and ${connection.value.invitee_email || 'invitee'}? This also removes them from any shared projects they share.`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.removeConnection(connection.value.id)
    toaster.success('Connection removed')
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to remove connection')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  margin-bottom: 16px;
}

.back-link {
  color: var(--color-text-secondary);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-text-primary);
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 640px;
}

.card {
  padding: 20px;
}

.section-title {
  margin: 0 0 16px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.info-row:last-child {
  border-bottom: none;
}

.mono {
  font-family: var(--font-mono, monospace);
}

.action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
}

.action-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.action-row--danger {
  border-top: 1px solid var(--color-border-subtle);
}
</style>