<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="detail-back-link" @click="goBack">&lt;</a>
          <span class="detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="action" class="detail-header-right">
          <div class="detail-nav-buttons">
            <Btn variant="icon" class="detail-nav-btn" title="First" :disabled="navigating || currentPosition <= 0" @click="goFirst">⏮</Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Previous" :disabled="navigating || currentPosition <= 0" @click="goPrev">◀</Btn>
            <span class="detail-position">
              <span class="detail-nav-spinner" v-if="navigating"></span>
              {{ currentPosition + 1 }} of {{ totalItems }}
            </span>
            <Btn variant="icon" class="detail-nav-btn" title="Next" :disabled="navigating || currentPosition >= totalItems - 1" @click="goNext">▶</Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Last" :disabled="navigating || currentPosition >= totalItems - 1" @click="goLast">⏭</Btn>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="pageLoading" class="detail-loading">
        <span class="detail-spinner"></span>
      </div>

      <!-- Content -->
      <div v-else-if="action" class="detail-body">

        <!-- Title area -->
        <div class="detail-title-area">
          <ActionIcon class="detail-type-icon" />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <span class="detail-spinner"></span>
            </div>
            <h2
                class="detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title', 'detail-title--completed': isCompleted }"
                @click="startEdit('title', action.title)"
            >{{ action.title }}</h2>
            <textarea
                v-if="editingField === 'title'"
                ref="titleInput"
                v-model="editValue"
                class="detail-title-input"
                :disabled="savingField === 'title'"
                @keydown.enter.prevent="saveField('title')"
                @keyup.esc="cancelEdit"
                @blur="saveField('title')"
                @input="autoResizeTitle"
                rows="1"
            ></textarea>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="detail-actions">
          <template v-if="isCompleted">
            <Btn
                variant="primary"
                size="sm"
                :loading="actionLoading === 'undo'"
                @click="onUndo"
            >
              Undo
            </Btn>
          </template>
          <template v-else>
            <Btn
                variant="ghost"
                size="sm"
                :loading="actionLoading === 'done'"
                @click="onMarkDone"
            >
              Done
            </Btn>
          </template>
          <div v-if="!isCompleted" class="detail-action-wrapper">
            <Btn
                variant="ghost"
                size="sm"
                :loading="actionLoading === 'move'"
                @click="toggleMoveDialog"
            >
              Move
            </Btn>
            <template v-if="showMoveDialog && actionLoading !== 'move'">
              <div class="detail-dropdown-backdrop" @click="showMoveDialog = false"></div>
              <div class="detail-dropdown detail-dropdown--actions">
                <div class="detail-dropdown-options">
                  <button v-if="action.state !== 'NEXT'" class="detail-dropdown-option" @click="onMoveTo('NEXT')"><NextIcon class="detail-dropdown-icon" /> Next Actions</button>
                  <button v-if="action.state !== 'TODAY'" class="detail-dropdown-option" @click="onMoveTo('TODAY')"><TodayIcon class="detail-dropdown-icon" /> Today</button>
                  <button v-if="action.state !== 'WAITING'" class="detail-dropdown-option" @click="onMoveTo('WAITING')"><WaitingIcon class="detail-dropdown-icon" /> Waiting For</button>
                  <button v-if="action.state !== 'CALENDAR'" class="detail-dropdown-option" @click="onMoveTo('CALENDAR')"><CalendarIcon class="detail-dropdown-icon" /> Calendar</button>
                  <button v-if="action.state !== 'SOMEDAY'" class="detail-dropdown-option" @click="onMoveTo('SOMEDAY')"><SomedayIcon class="detail-dropdown-icon" /> Someday</button>
                </div>
              </div>
            </template>
          </div>
          <Btn
              v-if="!isCompleted"
              variant="ghost-danger"
              size="sm"
              :loading="actionLoading === 'trash'"
              @click="onTrash"
          >
            Trash
          </Btn>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'description'"
                class="detail-section-content"
                :class="{ 'detail-section-content--empty': !action.description }"
                @click="startEdit('description', action.description || '')"
            >{{ action.description || 'Add a description...' }}</p>
            <textarea
                v-else
                ref="descriptionInput"
                v-model="editValue"
                class="detail-section-textarea"
                :disabled="savingField === 'description'"
                @keyup.esc="cancelEdit"
                @blur="saveField('description')"
                rows="1"
            ></textarea>
            <div v-if="editingField === 'description'" class="detail-section-actions">
              <Btn
                  variant="primary"
                  size="sm"
                  :disabled="savingField === 'description'"
                  :loading="savingField === 'description'"
                  @mousedown.prevent
                  @click="saveField('description')"
              >Save</Btn>
              <Btn
                  variant="ghost"
                  size="sm"
                  :disabled="savingField === 'description'"
                  @mousedown.prevent
                  @click="cancelEdit"
              >Cancel</Btn>
            </div>
          </div>
        </div>

        <!-- Metadata section -->
        <div class="detail-metadata">
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Created</span>
            <span class="detail-metadata-value">{{ formatDate(action.created) }}</span>
          </span>
          <span class="detail-metadata-separator">·</span>
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Updated</span>
            <span class="detail-metadata-value">{{ formatDate(action.updated) }}</span>
          </span>
        </div>

      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import { nextActionModel } from '../scripts/nextActionModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import apiClient from '../scripts/apiClient.js'
import ActionIcon from '../assets/ActionIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import TodayIcon from '../assets/TodayIcon.vue'
import WaitingIcon from '../assets/WaitingIcon.vue'
import CalendarIcon from '../assets/CalendarIcon.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()

const {
  error,
  getAction,
  getActionByPosition,
  updateAction,
  trashAction,
  completeAction,
  changeActionState,
} = nextActionModel()

const action = ref(null)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)
const actionLoading = ref(null)
const showMoveDialog = ref(false)

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)

// Computed
const isCompleted = computed(() => action.value?.state === 'COMPLETED')
const isSomeday = computed(() => action.value?.state === 'SOMEDAY')
const backLabel = computed(() => {
  if (isCompleted.value) return 'Completed'
  if (isSomeday.value) return 'Someday / Maybe'
  return 'Next'
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  try {
    const data = await getAction(route.params.id)
    action.value = { ...data }

    currentPosition.value = Number(route.query.position) || 0
    totalItems.value = Number(route.query.total) || 1

  } catch {
    toaster.push('Failed to load action')
    router.push({ name: 'next' })
  } finally {
    pageLoading.value = false
  }
})

function goBack() {
  if (isCompleted.value) {
    router.push({ name: 'completed' })
  } else if (isSomeday.value) {
    router.push({ name: 'someday' })
  } else {
    router.push({ name: 'next' })
  }
}

function startEdit(field, value) {
  if (savingField.value) return
  editingField.value = field
  editValue.value = value
  nextTick(() => {
    if (field === 'title' && titleInput.value) {
      autoResizeTitle()
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

function autoResizeTitle() {
  if (titleInput.value) {
    titleInput.value.style.height = '0'
    titleInput.value.style.height = Math.max(44, titleInput.value.scrollHeight) + 'px'
  }
}

async function saveField(field) {
  if (editingField.value !== field) return
  if (savingField.value) return
  const newValue = editValue.value.trim()

  if (field === 'title' && (!newValue || newValue === action.value.title)) {
    editingField.value = null
    return
  }

  if (field === 'description' && newValue === (action.value.description || '')) {
    editingField.value = null
    return
  }

  const oldValue = action.value[field]
  action.value[field] = newValue
  savingField.value = field

  try {
    await updateAction(action.value.id, { title: action.value.title, description: action.value.description })
    editingField.value = null
  } catch {
    action.value[field] = oldValue
    setTimeout(() => {
      if (field === 'title') {
        titleInput.value?.focus()
      } else if (field === 'description') {
        descriptionInput.value?.focus()
      }
    }, 100)
  } finally {
    savingField.value = null
  }
}

function toggleMoveDialog() {
  showMoveDialog.value = !showMoveDialog.value
}

async function onMoveTo(newState) {
  showMoveDialog.value = false
  const currentState = action.value.state || 'NEXT'
  if (newState === currentState) return

  actionLoading.value = 'move'
  const oldState = action.value.state
  action.value.state = newState

  const stateLabels = {
    NEXT: 'Next Actions',
    TODAY: 'Today',
    WAITING: 'Waiting For',
    CALENDAR: 'Calendar',
    SOMEDAY: 'Someday'
  }

  try {
    await changeActionState(action.value.id, newState, action.value.title)
    toaster.success(`"${truncateTitle(action.value.title)}" moved to ${stateLabels[newState]}`)
    await navigateToNextOrPrev()
  } catch {
    action.value.state = oldState
    toaster.push('Failed to move action')
  } finally {
    actionLoading.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

// Navigation functions
async function navigateToPosition(position) {
  if (navigating.value) return
  if (position < 0 || position >= totalItems.value) return

  navigating.value = true
  try {
    const data = await getActionByPosition(position)
    action.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    router.replace({
      name: 'action-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value }
    })
  } catch {
    toaster.push('Failed to load action')
  } finally {
    navigating.value = false
  }
}

function goFirst() {
  navigateToPosition(0)
}

function goPrev() {
  navigateToPosition(currentPosition.value - 1)
}

function goNext() {
  navigateToPosition(currentPosition.value + 1)
}

function goLast() {
  navigateToPosition(totalItems.value - 1)
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onMarkDone() {
  actionLoading.value = 'done'
  const title = truncateTitle(action.value.title)
  try {
    await completeAction(action.value.id)
    toaster.success(`"${title}" completed`)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to complete action')
  } finally {
    actionLoading.value = null
  }
}

async function navigateToNextOrPrev() {
  const newTotal = totalItems.value - 1
  if (newTotal <= 0) {
    router.push({ name: 'next' })
    return
  }

  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    const data = await getActionByPosition(nextPos)
    action.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'action-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value }
    })
  } catch {
    router.push({ name: 'next' })
  }
}

async function onTrash() {
  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: `Are you sure you want to move "${action.value.title}" to trash?`,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  actionLoading.value = 'trash'
  try {
    await trashAction(action.value.id)
    toaster.success(`"${truncateTitle(action.value.title)}" moved to trash`)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to move action to trash')
  } finally {
    actionLoading.value = null
  }
}

async function onUndo() {
  actionLoading.value = 'undo'
  const title = truncateTitle(action.value.title)
  try {
    await apiClient.uncompleteAction(action.value.id)
    toaster.success(`"${title}" restored to next actions`)
    router.push({ name: 'completed' })
  } catch (err) {
    toaster.push(err.message || 'Failed to restore action')
  } finally {
    actionLoading.value = null
  }
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-back-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-link-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.detail-back-link:hover {
  background: var(--color-bg-secondary);
  color: var(--color-link-hover);
}

.detail-position {
  position: relative;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  min-width: 60px;
  text-align: center;
  padding: 0 4px;
}

.detail-nav-buttons {
  display: flex;
  align-items: center;
  gap: 2px;
}

.detail-nav-btn {
  font-size: 12px;
}

.detail-nav-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  background: var(--color-bg-primary);
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ── Meta (State) ── */

.detail-meta-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-link-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-meta-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

/* ── Dropdowns __ */
.detail-dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.detail-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: var(--color-bg-primary);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  z-index: 100;
}

.detail-dropdown-options {
  padding: 4px;
}

.detail-dropdown-option {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px ;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
}

.detail-dropdown-option:hover {
  background: var(--color-bg-secondary);
}

.detail-dropdown-option--selected {
  background: var(--color-bg-secondary);
  color: var(--color-action);
  font-weight: 500;
}

.detail-section-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 4px;
}

/* ── Title area ── */
.detail-title-area {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 24px 24px 0 4px; /* 4px centers 42px icon in 50px space */
}

.detail-type-icon {
  width: 42px;
  height: 42px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  align-self: center;
}

.detail-title-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.detail-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  line-height: 1.4;
  word-break: break-word;
  cursor: pointer;
}

.detail-title:hover {
  background: var(--color-bg-secondary);
}

.detail-title--hidden {
  visibility: hidden;
}

.detail-title--completed {
  text-decoration: line-through;
  color: var(--color-text-secondary);
  opacity: 0.6;
}

.detail-title-input {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  line-height: 1.4;
  box-sizing: border-box;
  outline: none;
  background: var(--color-bg-primary);
  resize: none;
  overflow: hidden;
}

.detail-title-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* ── Action buttons ── */
.detail-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px 16px 50px; /* 42px icon + 8px gap */
}

.detail-action-wrapper {
  position: relative;
}

.detail-dropdown--actions {
  left: 0;
  min-width: 160px;
}

.detail-dropdown-icon {
  width: 32px;
  height: 32px;
  margin-right: 4px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.detail-dropdown-option:hover .detail-dropdown-icon {
  color: var(--color-action);
}

/* ── Section areas (description) ── */
.detail-section-area {
  padding: 12px 24px 12px 50px; /* 42px icon + 8px gap */
  border-bottom: 1px solid var(--color-border-light);
}

.detail-section-label {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  min-height: 32px;
  box-sizing: border-box;
}

.detail-section-content:hover {
  background: var(--color-bg-secondary);
}

.detail-section-content--empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.detail-section-textarea {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  padding: 4px 0;
  outline: none;
  width: 100%;
  resize: none;
  background: var(--color-bg-primary);
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 32px;
  field-sizing: content;
}

.detail-section-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.detail-section-actions {
  display: flex;
  gap: 8px;
}

/* ── Metadata section ── */
.detail-metadata {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 16px 24px 24px 50px; /* 42px icon + 8px gap */
  margin-top: 8px;
}

.detail-metadata-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-metadata-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.detail-metadata-value {
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.detail-metadata-separator {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

.detail-section-textarea:disabled,
.detail-title-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Spinners __ */
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

/* ── Responsive ── */
@media (max-width: 768px) {
  .detail-header {
    padding: 8px 12px;
  }

  .detail-header-left {
    gap: 6px;
  }

  .detail-header-right {
    gap: 8px;
  }

  .detail-title-area {
    padding: 16px 16px 0 4px;
  }

  .detail-actions {
    padding: 12px 16px 12px 50px;
  }

  .detail-section-area {
    padding: 12px 16px 12px 50px;
  }

  .detail-metadata {
    padding: 12px 16px 16px 50px;
  }
}
</style>
