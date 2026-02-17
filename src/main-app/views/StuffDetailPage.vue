<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="detail-back-link" @click="goBack">&lt;</a>
          <span class="detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="item" class="detail-header-right">
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
      <div v-else-if="item" class="detail-body">

        <!-- Title area -->
        <div class="detail-title-area">
          <InboxIcon class="detail-type-icon" />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <span class="detail-spinner"></span>
            </div>
            <h2
                class="detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title', 'detail-title--completed': isCompleted }"
                @click="startEdit('title', item.title)"
            >{{ item.title }}</h2>
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
          <template v-else-if="isSomeday">
            <Btn
                variant="primary"
                size="sm"
                :loading="actionLoading === 'activate'"
                @click="onActivate"
            >
              Activate
            </Btn>
          </template>
          <template v-else>
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
          </template>
          <Dropdown v-if="!isCompleted && !isSomeday" v-model="showMoveDialog" title="Move to">
            <template #trigger>
              <Btn
                  variant="ghost"
                  size="sm"
                  :loading="actionLoading === 'move'"
              >
                Move
              </Btn>
            </template>
            <button class="dropdown-item" @click="onMoveTo('action')"><NextIcon class="dropdown-item-icon" /> Next Actions</button>
            <button class="dropdown-item" @click="onMoveTo('today')"><TodayIcon class="dropdown-item-icon" /> Today</button>
            <button class="dropdown-item" @click="onMoveTo('calendar')"><CalendarIcon class="dropdown-item-icon" /> Calendar</button>
            <button class="dropdown-item" @click="onMoveTo('waiting')"><WaitingIcon class="dropdown-item-icon" /> Waiting For</button>
            <button class="dropdown-item" @click="onMoveTo('project')"><ProjectsIcon class="dropdown-item-icon" /> Projects</button>
            <button class="dropdown-item" @click="onMoveTo('someday')"><SomedayIcon class="dropdown-item-icon" /> Someday</button>
            <button class="dropdown-item" @click="onMoveTo('reference')"><ReferenceIcon class="dropdown-item-icon" /> Reference</button>
            <div class="dropdown-divider"></div>
            <button class="dropdown-item" @click="onMoveTo('completed')"><CompletedIcon class="dropdown-item-icon" /> Completed</button>
            <button class="dropdown-item dropdown-item--danger" @click="onMoveTo('trash')"><TrashIcon class="dropdown-item-icon" /> Trash</button>
          </Dropdown>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'description'"
                class="detail-section-content"
                :class="{ 'detail-section-content--empty': !item.description }"
                @click="startEdit('description', item.description || '')"
            >{{ item.description || 'Add a description...' }}</p>
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
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import Dropdown from '../components/Dropdown.vue'
import ClarifyPanel from '../components/ClarifyPanel.vue'
import { stuffModel } from '../scripts/stuffModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import { clarifyModel } from '../scripts/clarifyModel.js'
import apiClient from '../scripts/apiClient.js'
import { moveModel } from '../scripts/moveModel.js'
import InboxIcon from '../assets/InboxIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import TodayIcon from '../assets/TodayIcon.vue'
import CalendarIcon from '../assets/CalendarIcon.vue'
import WaitingIcon from '../assets/WaitingIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'
import ReferenceIcon from '../assets/ReferenceIcon.vue'
import CompletedIcon from '../assets/CompletedIcon.vue'
import TrashIcon from '../assets/TrashIcon.vue'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const mover = moveModel()

const {
  error,
  getStuff,
  getStuffByPosition,
  updateStuff,
  trashStuff,
} = stuffModel()

const item = ref(null)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)

// Clarify state
const showClarify = ref(false)
const isMobile = ref(false)
const actionLoading = ref(null)
const showMoveDialog = ref(false)

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)
const fromSource = ref(null)

// Computed
const isCompleted = computed(() => item.value?.state === 'COMPLETED')
const isSomeday = computed(() => item.value?.state === 'SOMEDAY')
const fromCompleted = computed(() => fromSource.value === 'completed')
const backLabel = computed(() => {
  if (fromCompleted.value || isCompleted.value) return 'Completed'
  if (isSomeday.value) return 'Someday / Maybe'
  return 'Inbox'
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  try {
    fromSource.value = route.query.from || null

    const data = await getStuff(route.params.id)
    item.value = { ...data }

    currentPosition.value = Number(route.query.position) || 0
    totalItems.value = Number(route.query.total) || 1

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
  if (fromCompleted.value || isCompleted.value) {
    router.push({ name: 'completed' })
  } else if (isSomeday.value) {
    router.push({ name: 'someday' })
  } else {
    router.push({ name: 'inbox' })
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
    toaster.push('Failed to save changes')
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
    const getByPosition = fromCompleted.value
      ? apiClient.getCompletedByPosition
      : getStuffByPosition
    const data = await getByPosition(position)

    // Completed list has mixed types - redirect if type changed
    if (fromCompleted.value && data.type !== 'STUFF') {
      const query = { position: data.position, total: data.total_items || totalItems.value, from: 'completed' }
      const name = data.type === 'ACTION' ? 'action-detail' : 'project-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    item.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    // Update URL without adding history entry
    router.replace({
      name: 'stuff-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value || undefined }
    })
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

async function onClarifyDone() {
  // Navigate to next item and continue clarifying
  const newTotal = totalItems.value - 1
  if (newTotal <= 0) {
    // No more items - close clarify and go to inbox
    showClarify.value = false
    router.push({ name: 'inbox' })
    return
  }

  // Get next item (same position, or previous if we were at the end)
  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    const data = await getStuffByPosition(nextPos)
    item.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'stuff-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value }
    })

    // Restart clarify for the new item
    const clarify = clarifyModel()
    clarify.start(item.value, isMobile.value ? 'fullscreen' : 'modal')
  } catch {
    showClarify.value = false
    router.push({ name: 'inbox' })
  }
}

// Action button handlers

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onMarkDone() {
  actionLoading.value = 'done'
  const title = truncateTitle(item.value.title)
  try {
    await apiClient.completeStuff(item.value.id)
    toaster.success(`"${title}" completed`)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to complete item')
  } finally {
    actionLoading.value = null
  }
}

async function navigateToNextOrPrev() {
  const newTotal = totalItems.value - 1
  const backRoute = fromCompleted.value ? 'completed' : 'inbox'

  if (newTotal <= 0) {
    router.push({ name: backRoute })
    return
  }

  // Try same position (next item slides into this position)
  // If we were at the last item, go to previous
  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    const getByPosition = fromCompleted.value
      ? apiClient.getCompletedByPosition
      : getStuffByPosition
    const data = await getByPosition(nextPos)

    // Completed list has mixed types - redirect if type changed
    if (fromCompleted.value && data.type !== 'STUFF') {
      const query = { position: data.position, total: data.total_items ?? newTotal, from: 'completed' }
      const name = data.type === 'ACTION' ? 'action-detail' : 'project-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    item.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'stuff-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value || undefined }
    })
  } catch {
    router.push({ name: backRoute })
  }
}

async function onMoveTo(destination) {
  showMoveDialog.value = false

  const destinationLabels = {
    action: 'Next Actions',
    today: 'Today',
    calendar: 'Calendar',
    waiting: 'Waiting For',
    project: 'Projects',
    someday: 'Someday',
    reference: 'Reference',
    completed: 'Completed',
    trash: 'Trash'
  }

  // Special handling for calendar - need date input
  if (destination === 'calendar') {
    const scheduleData = await mover.showSchedule({ date: '', time: '', duration: 15 })
    if (!scheduleData || !scheduleData.date) return // User cancelled

    actionLoading.value = 'move'
    try {
      await apiClient.clarifyToAction(item.value.id, {
        title: item.value.title,
        description: item.value.description || '',
        deferType: 'scheduled',
        deferDate: scheduleData.date,
        deferTime: scheduleData.time || null,
        deferDuration: scheduleData.duration || null
      })
      toaster.success(`"${truncateTitle(item.value.title)}" moved to Calendar`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move item')
    } finally {
      actionLoading.value = null
    }
    return
  }

  // Special handling for waiting - need waiting_for input
  if (destination === 'waiting') {
    const waitingFor = await mover.showWaiting({ waitingFor: '' })
    if (!waitingFor) return // User cancelled

    actionLoading.value = 'move'
    try {
      const result = await apiClient.clarifyToAction(item.value.id, {
        title: item.value.title,
        description: item.value.description || ''
      })
      await apiClient.waitAction(result.id, waitingFor)
      toaster.success(`"${truncateTitle(item.value.title)}" moved to Waiting For`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move item')
    } finally {
      actionLoading.value = null
    }
    return
  }

  // Special handling for today - transform to action then mark today
  if (destination === 'today') {
    actionLoading.value = 'move'
    try {
      const result = await apiClient.clarifyToAction(item.value.id, {
        title: item.value.title,
        description: item.value.description || ''
      })
      await apiClient.todayAction(result.id)
      toaster.success(`"${truncateTitle(item.value.title)}" moved to Today`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move item')
    } finally {
      actionLoading.value = null
    }
    return
  }

  // Special handling for trash - use confirmation
  if (destination === 'trash') {
    await onTrash()
    return
  }

  // Special handling for project - prompt for outcome
  if (destination === 'project') {
    const outcome = await mover.showOutcome()
    if (!outcome) return

    actionLoading.value = 'move'
    try {
      await apiClient.clarifyToProject(item.value.id, {
        title: item.value.title,
        description: item.value.description || '',
        outcome
      })
      toaster.success(`"${truncateTitle(item.value.title)}" moved to ${destinationLabels[destination]}`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move item')
    } finally {
      actionLoading.value = null
    }
    return
  }

  actionLoading.value = 'move'

  try {
    switch (destination) {
      case 'action':
        await apiClient.clarifyToAction(item.value.id, {
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
      case 'completed':
        await apiClient.completeStuff(item.value.id)
        break
    }
    toaster.success(`"${truncateTitle(item.value.title)}" moved to ${destinationLabels[destination]}`)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to move item')
  } finally {
    actionLoading.value = null
  }
}

async function onTrash() {
  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: `Are you sure you want to move "${item.value.title}" to trash?`,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  actionLoading.value = 'trash'
  try {
    await trashStuff(item.value.id)
    toaster.success(`"${truncateTitle(item.value.title)}" moved to trash`)
    if (isSomeday.value) {
      router.push({ name: 'someday' })
    } else {
      await navigateToNextOrPrev()
    }
  } catch (err) {
    toaster.push(err.message || 'Failed to move item to trash')
  } finally {
    actionLoading.value = null
  }
}

async function onUndo() {
  actionLoading.value = 'undo'
  const title = truncateTitle(item.value.title)
  try {
    await apiClient.uncompleteStuff(item.value.id)
    toaster.success(`"${title}" restored to inbox`)
    router.push({ name: 'completed' })
  } catch (err) {
    toaster.push(err.message || 'Failed to restore item')
  } finally {
    actionLoading.value = null
  }
}

async function onActivate() {
  actionLoading.value = 'activate'
  const title = truncateTitle(item.value.title)
  try {
    await apiClient.activateStuff(item.value.id)
    toaster.success(`"${title}" moved to Inbox`)
    router.push({ name: 'someday' })
  } catch (err) {
    toaster.push(err.message || 'Failed to activate item')
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
  color: var(--color-link-hover);
  text-decoration: underline;
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

/* ── Spinners ── */
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

/* ── Dropdown styles ── */
.dropdown-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--color-border-light);
}

.dropdown-item--danger {
  color: var(--color-danger);
}

.dropdown-item--danger:hover {
  background: var(--color-danger-bg);
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

  .clarify-slideover {
    display: none;
  }
}
</style>
