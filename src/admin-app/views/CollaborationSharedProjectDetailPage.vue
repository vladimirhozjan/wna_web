<template>
  <div class="page">
    <div class="page-header">
      <RouterLink to="/shared-projects" class="text-body-s back-link">&larr; Shared Projects</RouterLink>
    </div>

    <div v-if="loading" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!project" class="empty-state">
      <p class="text-body-m color-text-secondary">Shared project not found.</p>
    </div>

    <div v-else class="detail">
      <!-- Project info -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Project</h3>
        <div class="info-row">
          <span class="text-label color-text-secondary">Title</span>
          <span class="text-body-m fw-medium">{{ project.title || '(untitled)' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">State</span>
          <Badge type="primary" :value="project.state || 'ACTIVE'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Shared</span>
          <Badge :type="project.shared ? 'active' : 'draft'" :value="project.shared ? 'shared' : 'personal'" />
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Owner ID</span>
          <span class="text-caption color-text-tertiary mono">{{ project.owner_id || '—' }}</span>
        </div>
        <div class="info-row">
          <span class="text-label color-text-secondary">Project ID</span>
          <span class="text-caption color-text-tertiary mono">{{ project.id }}</span>
        </div>
      </div>

      <!-- Members -->
      <div class="info-card card">
        <h3 class="text-label color-text-secondary section-title">Members ({{ members.length }})</h3>
        <DataTable
            :columns="memberColumns"
            :rows="members"
            :loading="false"
            empty-text="No members."
        >
          <template #cell-user_id="{ value }">
            <span class="text-caption mono">{{ value }}</span>
          </template>
          <template #cell-role="{ value }">
            <Badge type="role" :value="value" />
          </template>
          <template #cell-added_at="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #cell-actions="{ row }">
            <Btn
                v-if="hasMinRole(role, 'admin') && row.role !== 'owner'"
                variant="ghost-danger" size="sm"
                :loading="memberActionId === row.user_id"
                :disabled="!!memberActionId"
                @click="handleRemoveMember(row)"
            >
              Remove
            </Btn>
          </template>
        </DataTable>
      </div>

      <!-- Actions -->
      <div v-if="hasMinRole(role, 'admin') && project.shared" class="actions-card card">
        <h3 class="text-label color-text-secondary section-title">Actions</h3>
        <div class="action-row action-row--danger">
          <div class="action-info">
            <span class="text-body-s fw-medium color-text-danger">Unshare Project</span>
            <span class="text-caption color-text-tertiary">
              Force-converts back to a personal project: all members removed, assigned actions return to backlog, per-user tags dropped.
            </span>
          </div>
          <Btn
              variant="danger" size="sm"
              :loading="actionLoading"
              :disabled="actionLoading"
              @click="handleUnshare"
          >
            Unshare
          </Btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Spinner from '../components/Spinner.vue'
import DataTable from '../components/DataTable.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const route = useRoute()
const router = useRouter()
const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const project = ref(null)
const members = ref([])
const loading = ref(true)
const actionLoading = ref(false)
const memberActionId = ref(null)

const role = computed(() => auth.currentAdmin.value?.role)

const memberColumns = [
  { key: 'user_id', label: 'User ID', sortable: false },
  { key: 'role', label: 'Role', sortable: false, width: '110px' },
  { key: 'added_at', label: 'Added', sortable: false, width: '160px' },
  { key: 'actions', label: '', sortable: false, width: '100px' },
]

async function load() {
  loading.value = true
  try {
    const data = await apiClient.getSharedProject(route.params.id)
    project.value = data.project || null
    members.value = data.members || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load shared project')
    project.value = null
  } finally {
    loading.value = false
  }
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

async function handleUnshare() {
  const confirmed = await confirm.show({
    title: 'Unshare Project',
    message: `Force-convert "${project.value.title || '(untitled)'}" back to a personal project? All members lose access and their assigned actions return to the backlog.`,
    confirmText: 'Unshare',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  actionLoading.value = true
  try {
    await apiClient.unshareSharedProject(project.value.id)
    toaster.success('Project unshared')
    router.push({ name: 'shared-projects' })
  } catch (err) {
    toaster.push(err.message || 'Failed to unshare project')
  } finally {
    actionLoading.value = false
  }
}

async function handleRemoveMember(member) {
  const confirmed = await confirm.show({
    title: 'Remove Member',
    message: `Remove this member from "${project.value.title || '(untitled)'}"? Their assigned actions return to the backlog. If they are the last non-owner member, the project auto-unshares.`,
    confirmText: 'Remove',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  memberActionId.value = member.user_id
  try {
    const res = await apiClient.removeSharedProjectMember(project.value.id, member.user_id)
    if (res?.auto_unshared) {
      toaster.success('Member removed — project auto-unshared')
      router.push({ name: 'shared-projects' })
      return
    }
    toaster.success('Member removed')
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to remove member')
  } finally {
    memberActionId.value = null
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
  max-width: 760px;
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
