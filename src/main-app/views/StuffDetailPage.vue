<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <Btn variant="ghost" size="sm" @click="goBack">← Back</Btn>
      </div>

      <!-- Loading state -->
      <div v-if="pageLoading" class="detail-loading">
        <span class="detail-spinner"></span>
      </div>

      <!-- Content -->
      <div v-else-if="item" class="detail-content">

        <!-- Checkbox -->
        <div class="detail-row">
          <label class="detail-label">Checked</label>
          <div class="detail-value">
            <input
                type="checkbox"
                class="detail-checkbox"
                :checked="item.checked"
                :disabled="savingField === 'checked'"
                @change="onCheckChange"
            />
            <span v-if="savingField === 'checked'" class="field-spinner"></span>
          </div>
        </div>

        <!-- Type -->
        <div class="detail-row">
          <label class="detail-label">Type</label>
          <div class="detail-value">
            <select
                class="detail-select"
                :value="item.type || 'stuff'"
                :disabled="savingField === 'type'"
                @change="onTypeChange"
            >
              <option value="stuff">Stuff</option>
              <option value="action">Action</option>
              <option value="project">Project</option>
            </select>
            <span v-if="savingField === 'type'" class="field-spinner"></span>
          </div>
        </div>

        <!-- State -->
        <div class="detail-row">
          <label class="detail-label">State</label>
          <div class="detail-value">
            <select
                class="detail-select"
                :value="item.state || 'inbox'"
                :disabled="savingField === 'state'"
                @change="onStateChange"
            >
              <option value="inbox">Inbox</option>
              <option value="next">Next</option>
              <option value="calendar">Calendar</option>
              <option value="waiting">Waiting For</option>
              <option value="someday">Someday</option>
              <option value="reference">Reference</option>
            </select>
            <span v-if="savingField === 'state'" class="field-spinner"></span>
          </div>
        </div>

        <!-- Title -->
        <div class="detail-row">
          <label class="detail-label">Title</label>
          <div class="detail-value">
            <span v-if="savingField === 'title'" class="field-spinner"></span>
            <input
                v-if="editingField === 'title'"
                ref="titleInput"
                v-model="editValue"
                class="detail-input"
                :disabled="savingField === 'title'"
                @keyup.enter="saveField('title')"
                @keyup.esc="cancelEdit"
                @blur="saveField('title')"
            />
            <span
                v-else
                class="detail-text detail-text--editable"
                @click="startEdit('title', item.title)"
            >{{ item.title }}</span>
          </div>
        </div>

        <!-- Description -->
        <div class="detail-row detail-row--top">
          <label class="detail-label">Description</label>
          <div class="detail-value">
            <span v-if="savingField === 'description'" class="field-spinner"></span>
            <textarea
                v-if="editingField === 'description'"
                ref="descriptionInput"
                v-model="editValue"
                class="detail-textarea"
                :disabled="savingField === 'description'"
                @keyup.esc="cancelEdit"
                @blur="saveField('description')"
                rows="4"
            ></textarea>
            <span
                v-else
                class="detail-text detail-text--editable"
                :class="{ 'detail-text--placeholder': !item.description }"
                @click="startEdit('description', item.description || '')"
            >{{ item.description || 'Add description...' }}</span>
          </div>
        </div>

        <!-- Position -->
        <div class="detail-row">
          <label class="detail-label">Position</label>
          <div class="detail-value">
            <span v-if="savingField === 'position'" class="field-spinner"></span>
            <input
                type="number"
                class="detail-input detail-input--narrow"
                :value="item.position"
                :disabled="savingField === 'position'"
                @change="onPositionChange"
            />
          </div>
        </div>

        <!-- Created at -->
        <div class="detail-row">
          <label class="detail-label">Created at</label>
          <div class="detail-value">
            <span class="detail-text">{{ formatDate(item.created_at) }}</span>
          </div>
        </div>

        <!-- Updated at -->
        <div class="detail-row">
          <label class="detail-label">Updated at</label>
          <div class="detail-value">
            <span class="detail-text">{{ formatDate(item.updated_at) }}</span>
          </div>
        </div>

      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import { stuffModel } from '../scripts/stuffModel.js'
import { errorModel } from '../scripts/errorModel.js'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()

const {
  current,
  loading,
  error,
  getStuff,
  updateStuff,
  moveStuff,
} = stuffModel()

const item = ref(null)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  try {
    const data = await getStuff(route.params.id)
    item.value = { ...data }
  } catch {
    toaster.push('Failed to load item')
  } finally {
    pageLoading.value = false
  }
})

function goBack() {
  router.push({ name: 'inbox' })
}

function startEdit(field, value) {
  if (savingField.value) return
  editingField.value = field
  editValue.value = value
  nextTick(() => {
    if (field === 'title' && titleInput.value) {
      titleInput.value.focus()
      titleInput.value.select()
    } else if (field === 'description' && descriptionInput.value) {
      descriptionInput.value.focus()
    }
  })
}

function cancelEdit() {
  editingField.value = null
  editValue.value = ''
}

async function saveField(field) {
  if (editingField.value !== field) return
  const newValue = editValue.value.trim()
  editingField.value = null

  if (field === 'title' && (!newValue || newValue === item.value.title)) return
  if (field === 'description' && newValue === (item.value.description || '')) return

  const oldValue = item.value[field]
  item.value[field] = newValue
  savingField.value = field

  try {
    await updateStuff(item.value.id, { title: item.value.title, description: item.value.description })
  } catch {
    item.value[field] = oldValue
  } finally {
    savingField.value = null
  }
}

async function onCheckChange(e) {
  const checked = e.target.checked
  const old = item.value.checked
  item.value.checked = checked
  savingField.value = 'checked'

  try {
    await updateStuff(item.value.id, { title: item.value.title, checked })
  } catch {
    item.value.checked = old
  } finally {
    savingField.value = null
  }
}

async function onTypeChange(e) {
  const oldType = item.value.type
  item.value.type = e.target.value
  savingField.value = 'type'

  // API not yet implemented
  await new Promise(r => setTimeout(r, 300))
  toaster.push('Type change not yet implemented')
  item.value.type = oldType
  savingField.value = null
}

async function onStateChange(e) {
  const oldState = item.value.state
  item.value.state = e.target.value
  savingField.value = 'state'

  // API not yet implemented
  await new Promise(r => setTimeout(r, 300))
  toaster.push('State change not yet implemented')
  item.value.state = oldState
  savingField.value = null
}

async function onPositionChange(e) {
  const newPos = parseInt(e.target.value, 10)
  if (isNaN(newPos) || newPos === item.value.position) return

  const oldPos = item.value.position
  item.value.position = newPos
  savingField.value = 'position'

  try {
    await moveStuff(item.value.id, newPos)
  } catch {
    item.value.position = oldPos
  } finally {
    savingField.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  flex-shrink: 0;
  padding: 10px;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 24px;
}

.detail-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-row--top {
  align-items: flex-start;
}

.detail-label {
  flex-shrink: 0;
  width: 120px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
  font-weight: 500;
}

.detail-value {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.detail-text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
}

.detail-text--editable {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.detail-text--editable:hover {
  background: var(--color-bg-secondary);
}

.detail-text--placeholder {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.detail-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  padding: 4px 8px;
  outline: none;
  width: 100%;
}

.detail-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.detail-input--narrow {
  width: 80px;
}

.detail-textarea {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  padding: 8px;
  outline: none;
  width: 100%;
  resize: vertical;
}

.detail-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.detail-select {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  padding: 4px 8px;
  outline: none;
  background: var(--color-bg-primary);
  cursor: pointer;
}

.detail-select:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.detail-select:disabled,
.detail-input:disabled,
.detail-textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-action);
}

.detail-checkbox:disabled {
  cursor: not-allowed;
}

.field-spinner {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.detail-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>