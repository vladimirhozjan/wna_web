<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Feature Flags</h1>
      <Btn variant="primary" size="sm" @click="openCreateModal">Create Flag</Btn>
    </div>

    <DataTable
        :columns="columns"
        :rows="flags"
        :loading="loading"
        :row-clickable="true"
        empty-text="No feature flags defined."
        @row-click="openEditModal"
    >
      <template #cell-enabled="{ row }">
        <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--on': row.enabled }"
            :disabled="actionLoading"
            @click.stop="handleToggle(row)"
            :aria-label="row.enabled ? 'Disable' : 'Enable'"
        >
          <span class="toggle-knob"></span>
        </button>
      </template>
      <template #cell-segments="{ value }">
        <span class="text-caption">{{ formatSegment(value) }}</span>
      </template>
      <template #cell-updated_at="{ value }">
        {{ formatDate(value) }}
      </template>
    </DataTable>

    <!-- Create / Edit Modal -->
    <Modal :visible="showModal" :title="editingFlag ? 'Edit Flag' : 'Create Flag'" @close="closeModal">
      <form @submit.prevent="handleSave" class="flag-form">
        <Inpt
            v-model="formName"
            v-model:error="formNameError"
            type="text"
            title="Name"
            placeholder="feature_name"
            :disabled="saving || !!editingFlag"
        />
        <Inpt
            v-model="formDescription"
            v-model:error="formDescError"
            type="text"
            title="Description"
            placeholder="What does this flag control?"
            :disabled="saving"
        />

        <label class="select-label">
          <span class="text-label color-text-primary">Enabled</span>
          <select v-model="formEnabled" class="text-body-m select-input" :disabled="saving">
            <option :value="true">Yes</option>
            <option :value="false">No</option>
          </select>
        </label>

        <label class="select-label">
          <span class="text-label color-text-primary">Segment Type</span>
          <select v-model="formSegmentType" class="text-body-m select-input" :disabled="saving" @change="onSegmentTypeChange">
            <option value="all">All Users</option>
            <option value="percentage">Percentage</option>
            <option value="user_ids">Specific Users</option>
          </select>
        </label>

        <Inpt
            v-if="formSegmentType === 'percentage'"
            v-model="formSegmentValue"
            v-model:error="formSegmentError"
            type="number"
            title="Rollout Percentage (0-100)"
            placeholder="50"
            :disabled="saving"
        />

        <Inpt
            v-if="formSegmentType === 'user_ids'"
            v-model="formSegmentValue"
            v-model:error="formSegmentError"
            type="text"
            title="User IDs (comma-separated)"
            placeholder="uuid1, uuid2"
            :disabled="saving"
        />

        <p v-if="formError" class="text-body-s color-text-danger form-error">{{ formError }}</p>
      </form>

      <template #actions>
        <Btn v-if="editingFlag && hasMinRole(role, 'super_admin')" variant="ghost-danger" size="sm" :disabled="saving" @click="handleDelete">
          Delete
        </Btn>
        <div class="actions-spacer"></div>
        <Btn variant="secondary" size="sm" @click="closeModal" :disabled="saving">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="saving" @click="handleSave">
          {{ editingFlag ? 'Save' : 'Create' }}
        </Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Btn from '../components/Btn.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const auth = authModel()
const toaster = errorModel()
const confirm = confirmModel()

const role = computed(() => auth.currentAdmin.value?.role)

const columns = [
  { key: 'name', label: 'Name', sortable: false },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'enabled', label: 'Enabled', sortable: false, width: '80px' },
  { key: 'segments', label: 'Segment', sortable: false, width: '160px' },
  { key: 'updated_at', label: 'Updated', sortable: false, width: '150px' },
]

const flags = ref([])
const loading = ref(false)
const actionLoading = ref(false)

async function load() {
  loading.value = true
  try {
    const data = await apiClient.listFeatureFlags()
    flags.value = Array.isArray(data) ? data : data.items || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load feature flags')
  } finally {
    loading.value = false
  }
}

async function handleToggle(flag) {
  actionLoading.value = true
  try {
    await apiClient.updateFeatureFlag(flag.id, { enabled: !flag.enabled })
    toaster.success(`Flag "${flag.name}" ${!flag.enabled ? 'enabled' : 'disabled'}`)
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to toggle flag')
  } finally {
    actionLoading.value = false
  }
}

function formatSegment(seg) {
  if (!seg) return 'all'
  if (seg.type === 'all') return 'All users'
  if (seg.type === 'percentage') return `${seg.value}% rollout`
  if (seg.type === 'user_ids') return `${seg.value?.length || 0} users`
  return JSON.stringify(seg)
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

// --- Create / Edit Modal ---
const showModal = ref(false)
const editingFlag = ref(null)
const formName = ref('')
const formDescription = ref('')
const formEnabled = ref(false)
const formSegmentType = ref('all')
const formSegmentValue = ref('')
const formNameError = ref('')
const formDescError = ref('')
const formSegmentError = ref('')
const formError = ref('')
const saving = ref(false)

function openCreateModal() {
  editingFlag.value = null
  formName.value = ''
  formDescription.value = ''
  formEnabled.value = false
  formSegmentType.value = 'all'
  formSegmentValue.value = ''
  clearFormErrors()
  showModal.value = true
}

function openEditModal(flag) {
  editingFlag.value = flag
  formName.value = flag.name
  formDescription.value = flag.description || ''
  formEnabled.value = flag.enabled
  if (flag.segments?.type === 'percentage') {
    formSegmentType.value = 'percentage'
    formSegmentValue.value = String(flag.segments.value || '')
  } else if (flag.segments?.type === 'user_ids') {
    formSegmentType.value = 'user_ids'
    formSegmentValue.value = (flag.segments.value || []).join(', ')
  } else {
    formSegmentType.value = 'all'
    formSegmentValue.value = ''
  }
  clearFormErrors()
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingFlag.value = null
}

function clearFormErrors() {
  formNameError.value = ''
  formDescError.value = ''
  formSegmentError.value = ''
  formError.value = ''
}

function onSegmentTypeChange() {
  formSegmentValue.value = ''
  formSegmentError.value = ''
}

function buildSegments() {
  if (formSegmentType.value === 'all') return { type: 'all' }
  if (formSegmentType.value === 'percentage') {
    const val = Number(formSegmentValue.value)
    if (isNaN(val) || val < 0 || val > 100) {
      formSegmentError.value = 'Must be 0-100'
      return null
    }
    return { type: 'percentage', value: val }
  }
  if (formSegmentType.value === 'user_ids') {
    const ids = formSegmentValue.value.split(',').map(s => s.trim()).filter(Boolean)
    if (!ids.length) {
      formSegmentError.value = 'At least one user ID is required'
      return null
    }
    return { type: 'user_ids', value: ids }
  }
  return { type: 'all' }
}

async function handleSave() {
  clearFormErrors()
  if (!editingFlag.value && !formName.value.trim()) {
    formNameError.value = 'Name is required'
    return
  }

  const segments = buildSegments()
  if (!segments) return

  saving.value = true
  try {
    if (editingFlag.value) {
      await apiClient.updateFeatureFlag(editingFlag.value.id, {
        description: formDescription.value,
        enabled: formEnabled.value,
        segments,
      })
      toaster.success('Flag updated')
    } else {
      await apiClient.createFeatureFlag({
        name: formName.value.trim(),
        description: formDescription.value,
        enabled: formEnabled.value,
        segments,
      })
      toaster.success('Flag created')
    }
    closeModal()
    await load()
  } catch (err) {
    formError.value = err.message || 'Failed to save flag'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!editingFlag.value) return
  const confirmed = await confirm.show({
    title: 'Delete Feature Flag',
    message: `Delete flag "${editingFlag.value.name}"? This cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  saving.value = true
  try {
    await apiClient.deleteFeatureFlag(editingFlag.value.id)
    toaster.success('Flag deleted')
    closeModal()
    await load()
  } catch (err) {
    formError.value = err.message || 'Failed to delete flag'
  } finally {
    saving.value = false
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

/* Toggle */
.toggle-btn {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: var(--color-border-medium);
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.toggle-btn--on {
  background: var(--color-success);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.toggle-btn--on .toggle-knob {
  transform: translateX(18px);
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form */
.flag-form {
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

.form-error {
  margin: 0;
}

.actions-spacer {
  flex: 1;
}
</style>
