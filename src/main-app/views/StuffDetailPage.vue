<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="detail-back-link" @click="goBack">&lt;</a>
          <template v-if="item">
            <div class="detail-meta-item">
              <span
                  v-if="!showStateDialog && savingField !== 'state'"
                  class="detail-meta-link"
                  @click="toggleStateDialog"
              >{{ formatState(item.state) }}</span>
              <template v-else>
                <div class="detail-meta-input-wrapper">
                  <div v-if="savingField === 'state'" class="detail-section-overlay">
                    <span class="field-spinner"></span>
                  </div>
                  <button class="detail-meta-input detail-meta-input--open" @click="toggleStateDialog">
                    {{ formatState(item.state) }}
                    <span class="detail-meta-input-arrow">▾</span>
                  </button>
                </div>
                <template v-if="showStateDialog && savingField !== 'state'">
                  <div class="detail-dropdown-backdrop" @click="showStateDialog = false"></div>
                  <div class="detail-dropdown">
                    <div class="detail-dropdown-options">
                      <button
                          v-for="opt in stateOptions"
                          :key="opt.value"
                          class="detail-dropdown-option"
                          :class="{ 'detail-dropdown-option--selected': (item.state || 'INBOX') === opt.value }"
                          @click="selectState(opt.value)"
                      >{{ opt.label }}</button>
                    </div>
                  </div>
                </template>
              </template>
            </div>
            <span class="detail-meta-separator">/</span>
            <div class="detail-meta-item">
              <span
                  v-if="!showTypeDialog && savingField !== 'type'"
                  class="detail-meta-link"
                  @click="toggleTypeDialog"
              >{{ formatType(item.type) }}</span>
              <template v-else>
                <div class="detail-meta-input-wrapper">
                  <div v-if="savingField === 'type'" class="detail-section-overlay">
                    <span class="field-spinner"></span>
                  </div>
                  <button class="detail-meta-input detail-meta-input--open" @click="toggleTypeDialog">
                    {{ formatType(item.type) }}
                    <span class="detail-meta-input-arrow">▾</span>
                  </button>
                </div>
                <template v-if="showTypeDialog && savingField !== 'type'">
                  <div class="detail-dropdown-backdrop" @click="showTypeDialog = false"></div>
                  <div class="detail-dropdown">
                    <div class="detail-dropdown-options">
                      <button
                          v-for="opt in typeOptions"
                          :key="opt.value"
                          class="detail-dropdown-option"
                          :class="{ 'detail-dropdown-option--selected': (item.type || 'STUFF') === opt.value }"
                          @click="selectType(opt.value)"
                      >{{ opt.label }}</button>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </template>
        </div>
        <div v-if="item" class="detail-header-right">
          <div class="detail-nav-buttons">
            <Btn variant="icon" class="detail-nav-btn" title="First" :disabled="navigating || currentPosition <= 0" @click="goFirst">⏮</Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Previous" :disabled="navigating || currentPosition <= 0" @click="goPrev">◀</Btn>
            <span class="detail-position">Item {{ currentPosition + 1 }} of {{ totalItems }}</span>
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
      <div v-else-if="item" class="detail-body">

        <!-- Title area -->
        <div class="detail-title-area">
          <input
              type="checkbox"
              class="detail-checkbox"
              :checked="item.checked"
              :disabled="savingField === 'checked'"
              @change="onCheckChange"
          />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <span class="detail-spinner"></span>
            </div>
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
            <h2
                v-else
                class="detail-title"
                @click="startEdit('title', item.title)"
            >{{ item.title }}</h2>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="detail-actions">
          <Btn
              variant="primary"
              size="sm"
              @click="openClarify"
          >
            Clarify
          </Btn>
          <Btn
              variant="ghost"
              size="sm"
              :loading="actionLoading === 'done'"
              @click="onMarkDone"
          >
            Done
          </Btn>
          <div class="detail-action-wrapper">
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
                  <button class="detail-dropdown-option" @click="onMoveTo('action')"><NextIcon class="detail-dropdown-icon" /> Next Actions</button>
                  <button class="detail-dropdown-option" @click="onMoveTo('project')"><ProjectsIcon class="detail-dropdown-icon" /> Projects</button>
                  <button class="detail-dropdown-option" @click="onMoveTo('someday')"><SomedayIcon class="detail-dropdown-icon" /> Someday</button>
                  <button class="detail-dropdown-option" @click="onMoveTo('reference')"><ReferenceIcon class="detail-dropdown-icon" /> Reference</button>
                </div>
              </div>
            </template>
          </div>
          <Btn
              variant="ghost-danger"
              size="sm"
              :loading="actionLoading === 'delete'"
              @click="onDelete"
          >
            Delete
          </Btn>
        </div>

        <!-- Description area -->
        <div class="detail-description-area">
          <label class="detail-section-label">Description</label>
          <div v-if="editingField === 'description'" class="detail-description-edit">
            <textarea
                ref="descriptionInput"
                v-model="editValue"
                class="detail-textarea"
                :disabled="savingField === 'description'"
                @keyup.esc="cancelEdit"
                @blur="saveField('description')"
                rows="4"
            ></textarea>
            <div class="detail-description-actions">
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
          <p
              v-else
              class="detail-description"
              :class="{ 'detail-description--empty': !item.description }"
              @click="startEdit('description', item.description || '')"
          >{{ item.description || 'Add a description...' }}</p>
        </div>

        <!-- Metadata section -->
        <div class="detail-metadata">
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Created</span>
            <span class="detail-metadata-value">{{ formatDate(item.created) }}</span>
          </span>
          <span class="detail-metadata-separator">·</span>
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Updated</span>
            <span class="detail-metadata-value">{{ formatDate(item.updated) }}</span>
          </span>
        </div>

      </div>

      <!-- Clarify Slide-over (Desktop) -->
      <Teleport to="body" v-if="showClarify && item && !isMobile">
        <div class="clarify-slideover-overlay" @click="closeClarify">
          <div class="clarify-slideover" @click.stop>
            <ClarifyPanel
                :stuff-item="item"
                mode="modal"
                @done="onClarifyDone"
                @cancel="closeClarify"
            />
          </div>
        </div>
      </Teleport>

      <!-- Clarify Fullscreen (Mobile) -->
      <Teleport to="body" v-if="showClarify && item && isMobile">
        <ClarifyPanel
            :stuff-item="item"
            mode="fullscreen"
            @done="onClarifyDone"
            @cancel="closeClarify"
        />
      </Teleport>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import ClarifyPanel from '../components/ClarifyPanel.vue'
import { stuffModel } from '../scripts/stuffModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import apiClient from '../scripts/apiClient.js'
import NextIcon from '../assets/NextIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'
import ReferenceIcon from '../assets/ReferenceIcon.vue'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()

const {
  error,
  getStuff,
  getStuffByPosition,
  updateStuff,
  deleteStuff,
} = stuffModel()

const item = ref(null)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)
const showTypeDialog = ref(false)
const showStateDialog = ref(false)

// Clarify state
const showClarify = ref(false)
const isMobile = ref(false)
const actionLoading = ref(null)
const showMoveDialog = ref(false)

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)

const typeOptions = [
  { value: 'STUFF', label: 'Stuff' },
  { value: 'ACTION', label: 'Action' },
  { value: 'PROJECT', label: 'Project' },
]

const stateOptions = [
  { value: 'INBOX', label: 'Inbox' },
  { value: 'SOMEDAY', label: 'Someday' },
]

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  try {
    const data = await getStuff(route.params.id)
    item.value = { ...data }

    currentPosition.value = Number(route.query.position)
    totalItems.value = Number(route.query.total)

  } catch {
    toaster.push('Failed to load item')
  } finally {
    pageLoading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function goBack() {
  router.push({ name: 'inbox' })
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
    titleInput.value.style.height = 'auto'
    titleInput.value.style.height = titleInput.value.scrollHeight + 'px'
  }
}

async function saveField(field) {
  if (editingField.value !== field) return
  if (savingField.value) return
  const newValue = editValue.value.trim()

  if (field === 'title' && (!newValue || newValue === item.value.title)) {
    editingField.value = null
    return
  }

  if (field === 'description' && newValue === (item.value.description || '')) {
    editingField.value = null
    return
  }

  const oldValue = item.value[field]
  item.value[field] = newValue
  savingField.value = field

  try {
    await updateStuff(item.value.id, { title: item.value.title, description: item.value.description })
    editingField.value = null
  } catch {
    item.value[field] = oldValue
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

async function onCheckChange(e) {
  const checked = e.target.checked
  const old = item.value.checked
  item.value.checked = checked
  savingField.value = 'checked'

  try {
    await updateStuff(item.value.id, { title: item.value.title })
  } catch {
    item.value.checked = old
  } finally {
    savingField.value = null
  }
}

function toggleStateDialog() {
  showStateDialog.value = !showStateDialog.value
  showTypeDialog.value = false
}

function toggleTypeDialog() {
  showTypeDialog.value = !showTypeDialog.value
  showStateDialog.value = false
}

function formatType(type) {
  const opt = typeOptions.find(o => o.value === type)
  return opt ? opt.label : type || 'Stuff'
}

function formatState(state) {
  const opt = stateOptions.find(o => o.value === state)
  return opt ? opt.label : state || 'Inbox'
}

async function selectType(newType) {
  showTypeDialog.value = false
  const currentType = item.value.type || 'STUFF'
  if (newType === currentType) return

  const oldType = item.value.type
  item.value.type = newType
  savingField.value = 'type'

  // API not yet implemented
  await new Promise(r => setTimeout(r, 300))
  toaster.push('Type change not yet implemented')
  item.value.type = oldType
  savingField.value = null
}

async function selectState(newState) {
  showStateDialog.value = false
  const currentState = item.value.state || 'INBOX'
  if (newState === currentState) return

  const oldState = item.value.state
  item.value.state = newState
  savingField.value = 'state'

  // API not yet implemented
  await new Promise(r => setTimeout(r, 300))
  toaster.push('State change not yet implemented')
  item.value.state = oldState
  savingField.value = null
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
    const data = await getStuffByPosition(position)
    item.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    // Update URL without adding history entry
    router.replace({ params: { id: data.id, totalItems: data.totalItems } })
  } catch {
    toaster.push('Failed to load item')
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

// Clarify functions
function openClarify() {
  showClarify.value = true
}

function closeClarify() {
  showClarify.value = false
}

function onClarifyDone() {
  showClarify.value = false
  // Navigate back to inbox after clarifying
  router.push({ name: 'inbox' })
}

// Action button handlers
function toggleMoveDialog() {
  showMoveDialog.value = !showMoveDialog.value
}

async function onMarkDone() {
  actionLoading.value = 'done'
  try {
    await apiClient.clarifyToTrash(item.value.id)
    router.push({ name: 'inbox' })
  } catch (err) {
    toaster.push(err.message || 'Failed to mark as done')
  } finally {
    actionLoading.value = null
  }
}

async function navigateToNextOrPrev() {
  const newTotal = totalItems.value - 1
  if (newTotal <= 0) {
    router.push({ name: 'inbox' })
    return
  }

  // Try same position (next item slides into this position)
  // If we were at the last item, go to previous
  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    const data = await getStuffByPosition(nextPos)
    item.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({ params: { id: data.id } })
  } catch {
    router.push({ name: 'inbox' })
  }
}

async function onMoveTo(destination) {
  showMoveDialog.value = false
  actionLoading.value = 'move'

  try {
    switch (destination) {
      case 'action':
        await apiClient.clarifyToAction(item.value.id, {
          title: item.value.title,
          description: item.value.description || ''
        })
        break
      case 'project':
        await apiClient.clarifyToProject(item.value.id, {
          title: item.value.title,
          description: item.value.description || ''
        })
        break
      case 'someday':
        await apiClient.clarifyToSomeday(item.value.id)
        break
      case 'reference':
        await apiClient.clarifyToReference(item.value.id)
        break
    }
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to move item')
  } finally {
    actionLoading.value = null
  }
}

async function onDelete() {
  const confirmed = await confirm.show({
    title: 'Delete Item',
    message: `Are you sure you want to delete "${item.value.title}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  actionLoading.value = 'delete'
  try {
    await deleteStuff(item.value.id)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to delete item')
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
  gap: 8px;
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
  color: var(--color-button-hover);
}

.detail-position {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  min-width: 20px;
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

/* ── Meta (State / Type) ── */

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
  color: var(--color-button-hover);
  text-decoration: underline;
}

.detail-meta-input-wrapper {
  position: relative;
}

.detail-meta-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-meta-input:hover {
  border-color: var(--color-input-border-focus);
}

.detail-meta-input--open {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.detail-meta-input-arrow {
  font-size: 10px;
  color: var(--color-text-tertiary);
}

.detail-meta-item {
  position: relative;
}

.detail-meta-separator {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
}

/* ── Dropdowns ── */
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
  gap: 12px;
  padding: 24px 24px 0;
}

.detail-title-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  word-break: break-word;
}

.detail-title:hover {
  background: var(--color-bg-secondary);
}

.detail-title-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  padding: 4px 8px;
  outline: none;
  width: 100%;
  background: var(--color-bg-primary);
}

.detail-title-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* ── Action buttons ── */
.detail-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
}

.detail-action-wrapper {
  position: relative;
}

.detail-dropdown--actions {
  left: 0;
  min-width: 160px;
}

/* ── Description area ── */
.detail-description-area {
  padding: 20px 24px 28px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-section-label {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.detail-description {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-description:hover {
  background: var(--color-bg-secondary);
}

.detail-description--empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.detail-description-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
}


.detail-description-actions {
  display: flex;
  gap: 8px;
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
  background: var(--color-bg-primary);
  box-sizing: border-box;
}

.detail-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* ── Metadata section ── */
.detail-metadata {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 16px 24px 24px;
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

.detail-textarea:disabled,
.detail-title-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-action);
  flex-shrink: 0;
}

.detail-checkbox:disabled {
  cursor: not-allowed;
}

/* ── Spinners ── */
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

/* ── Clarify Slide-over ── */
.clarify-slideover-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.clarify-slideover {
  width: 480px;
  max-width: 100%;
  height: 100%;
  background: var(--color-bg-primary);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  animation: slideInRight 0.3s ease;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
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
    padding: 16px 16px 0;
  }

  .detail-actions {
    padding: 12px 16px;
  }

  .detail-description-area {
    padding: 12px 16px 16px;
  }

  .detail-metadata {
    padding: 12px 16px 16px;
  }

  .clarify-slideover {
    display: none;
  }
}
</style>
