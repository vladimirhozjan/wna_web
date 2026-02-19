<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="detail-back-link" @click="goBack">&lt;</a>
          <span class="detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="action && !fromCalendar && !fromProject" class="detail-header-right">
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
          <template v-else-if="isSomeday">
            <Btn
                variant="primary"
                size="sm"
                :loading="actionLoading === 'activate'"
                @click="onActivate"
            >
              Activate
            </Btn>
            <Btn
                variant="ghost-danger"
                size="sm"
                :loading="actionLoading === 'trash'"
                @click="onTrash"
            >
              Trash
            </Btn>
          </template>
          <template v-else-if="isWaiting">
            <Btn
                variant="primary"
                size="sm"
                :loading="actionLoading === 'unwait'"
                @click="onGotIt"
            >
              Got it
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
            <button v-if="action.state !== 'NEXT'" class="dropdown-item" @click="onMoveTo('NEXT')"><NextIcon class="dropdown-item-icon" /> Next Actions</button>
            <button v-if="action.state !== 'TODAY'" class="dropdown-item" @click="onMoveTo('TODAY')"><TodayIcon class="dropdown-item-icon" /> Today</button>
            <button v-if="action.state !== 'CALENDAR'" class="dropdown-item" @click="onMoveTo('CALENDAR')"><CalendarIcon class="dropdown-item-icon" /> Calendar</button>
            <button v-if="action.state !== 'WAITING'" class="dropdown-item" @click="onMoveTo('WAITING')"><WaitingIcon class="dropdown-item-icon" /> Waiting For</button>
            <button v-if="action.state !== 'SOMEDAY'" class="dropdown-item" @click="onMoveTo('SOMEDAY')"><SomedayIcon class="dropdown-item-icon" /> Someday</button>
            <button class="dropdown-item" @click="onMoveTo('PROJECT')"><ProjectsIcon class="dropdown-item-icon" /> Projects</button>
          </Dropdown>
          <Btn
              v-if="!isCompleted && !isSomeday"
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

        <!-- Tags section -->
        <div class="detail-section-area">
          <label class="detail-section-label">Tags</label>
          <div class="detail-section-wrapper">
            <div v-if="editingField !== 'tags'" class="detail-tags-display" @click="startTagEdit">
              <span v-if="action.tags && action.tags.length > 0" class="detail-tags-chips">
                <span v-for="tag in action.tags" :key="tag" class="detail-tag-chip">{{ tag }}</span>
              </span>
              <span v-else class="detail-section-content detail-section-content--empty">Add tags...</span>
            </div>
            <template v-else>
              <TagInput
                  v-model="editTags"
                  :disabled="savingField === 'tags'"
              />
              <div class="detail-section-actions">
                <Btn
                    variant="primary"
                    size="sm"
                    :disabled="savingField === 'tags'"
                    :loading="savingField === 'tags'"
                    @mousedown.prevent
                    @click="saveTags"
                >Save</Btn>
                <Btn
                    variant="ghost"
                    size="sm"
                    :disabled="savingField === 'tags'"
                    @mousedown.prevent
                    @click="cancelEdit"
                >Cancel</Btn>
              </div>
            </template>
          </div>
        </div>

        <!-- Waiting For section (only for WAITING state) -->
        <div v-if="isWaiting" class="detail-section-area">
          <label class="detail-section-label">Waiting on</label>
          <div class="detail-section-wrapper">
            <p class="detail-section-content">
              <span class="detail-waiting-for">{{ action.waiting_for || 'Unknown' }}</span>
              <span v-if="action.waiting_since" class="detail-waiting-since">{{ formatWaitingDuration(action.waiting_since) }}</span>
            </p>
          </div>
        </div>

        <!-- Dates Section (collapsible) -->
        <div class="detail-section-area">
          <div class="detail-section-header" @click="toggleDatesSection">
            <label class="detail-section-label">Dates</label>
            <span v-if="!datesExpanded && !hasAnyDate" class="detail-section-content detail-section-content--empty detail-section-content--inline">Add dates...</span>
            <span v-else-if="!datesExpanded" class="detail-section-content detail-section-content--inline">{{ datesSummary }}</span>
            <span class="detail-section-toggle">{{ datesExpanded ? '▼' : '▶' }}</span>
          </div>

          <div v-if="datesExpanded" class="detail-dates-grid">
            <!-- Deferred: Start Date OR Scheduled Date (mutually exclusive) -->
            <div class="detail-date-row">
              <label class="detail-date-label">Deferred</label>
              <!-- Display mode -->
              <div v-if="editingField !== 'deferred'" class="detail-section-wrapper">
                <p
                    class="detail-section-content"
                    :class="{ 'detail-section-content--empty': !hasDeferredDate }"
                    @click="startDeferredEdit"
                >{{ deferredDisplay }}</p>
              </div>
              <!-- Edit mode -->
              <div v-else class="detail-date-edit-wrapper">
                <div class="detail-date-type-selector">
                  <label class="detail-date-radio">
                    <input type="radio" v-model="dateEdit.deferType" value="scheduled" :disabled="savingField === 'deferred'" />
                    <span>Scheduled for</span>
                  </label>
                  <label class="detail-date-radio">
                    <input type="radio" v-model="dateEdit.deferType" value="start" :disabled="savingField === 'deferred'" />
                    <span>Start after</span>
                  </label>
                </div>
                <div class="detail-date-inputs">
                  <input
                      ref="deferredDateInput"
                      type="date"
                      v-model="dateEdit.date"
                      class="detail-input"
                      :disabled="savingField === 'deferred'"
                      @keyup.esc="cancelEdit"
                  />
                  <span v-if="!dateEdit.showTime" class="detail-link" @click="dateEdit.showTime = true">Add time</span>
                  <template v-else>
                    <input
                        type="time"
                        v-model="dateEdit.time"
                        class="detail-input detail-input--time"
                        :disabled="savingField === 'deferred'"
                        @keyup.esc="cancelEdit"
                    />
                    <div v-if="dateEdit.deferType === 'scheduled'" class="detail-duration-input">
                      <input
                          type="number"
                          v-model.number="dateEdit.duration"
                          class="detail-input detail-input--duration"
                          min="5"
                          step="5"
                          :disabled="savingField === 'deferred'"
                          @keyup.esc="cancelEdit"
                      />
                      <span class="detail-duration-label">min</span>
                    </div>
                  </template>
                </div>
                <div class="detail-section-actions">
                  <Btn variant="primary" size="sm" :loading="savingField === 'deferred'" @mousedown.prevent @click="saveDeferredField">Save</Btn>
                  <Btn variant="ghost" size="sm" :disabled="savingField === 'deferred'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
                  <Btn v-if="hasDeferredDate" variant="ghost-danger" size="sm" :disabled="savingField === 'deferred'" @mousedown.prevent @click="clearDeferredField">Clear</Btn>
                </div>
              </div>
            </div>

            <!-- Due Date -->
            <div class="detail-date-row">
              <label class="detail-date-label">Due</label>
              <!-- Display mode -->
              <div v-if="editingField !== 'due_date'" class="detail-section-wrapper">
                <p
                    class="detail-section-content"
                    :class="{ 'detail-section-content--empty': !action.due_date }"
                    @click="startDateEdit('due_date')"
                >{{ formatDateTimeDisplay(action.due_date, action.due_time) || 'Not set' }}</p>
              </div>
              <!-- Edit mode -->
              <div v-else class="detail-date-edit-wrapper">
                <div class="detail-date-inputs">
                  <input
                      ref="dueDateInput"
                      type="date"
                      v-model="dateEdit.date"
                      class="detail-input"
                      :disabled="savingField === 'due_date'"
                      @keyup.esc="cancelEdit"
                  />
                  <span v-if="!dateEdit.showTime" class="detail-link" @click="dateEdit.showTime = true">Add time</span>
                  <input
                      v-else
                      type="time"
                      v-model="dateEdit.time"
                      class="detail-input detail-input--time"
                      :disabled="savingField === 'due_date'"
                      @keyup.esc="cancelEdit"
                  />
                </div>
                <div class="detail-section-actions">
                  <Btn variant="primary" size="sm" :loading="savingField === 'due_date'" @mousedown.prevent @click="saveDateField('due_date')">Save</Btn>
                  <Btn variant="ghost" size="sm" :disabled="savingField === 'due_date'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
                  <Btn v-if="action.due_date" variant="ghost-danger" size="sm" :disabled="savingField === 'due_date'" @mousedown.prevent @click="clearDateField('due_date')">Clear</Btn>
                </div>
              </div>
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
import Dropdown from '../components/Dropdown.vue'
import TagInput from '../components/TagInput.vue'
import { nextActionModel } from '../scripts/nextActionModel.js'
import { todayModel } from '../scripts/todayModel.js'
import { waitingModel } from '../scripts/waitingModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import apiClient, { deferAction, undeferAction, setDueDate, clearDueDate, waitAction, unwaitAction, todayAction, activateAction } from '../scripts/apiClient.js'
import { moveModel } from '../scripts/moveModel.js'
import { tagModel } from '../scripts/tagModel.js'
import ActionIcon from '../assets/ActionIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import TodayIcon from '../assets/TodayIcon.vue'
import WaitingIcon from '../assets/WaitingIcon.vue'
import CalendarIcon from '../assets/CalendarIcon.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const mover = moveModel()
const tagMdl = tagModel()

const nextModel = nextActionModel()
const todayMdl = todayModel()
const waitingMdl = waitingModel()

const {
  error,
  getAction,
  getActionByPosition,
  updateAction,
  trashAction,
  completeAction,
  changeActionState,
} = nextModel

// Source tracking (next, today, etc.)
const fromSource = ref(null)

const action = ref(null)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)
const actionLoading = ref(null)
const showMoveDialog = ref(false)

// Tags state
const editTags = ref([])

// Date section state
const datesExpanded = ref(false)
const dateEdit = ref({ date: '', time: '', showTime: false, deferType: 'scheduled', duration: 15 })
const deferredDateInput = ref(null)
const dueDateInput = ref(null)

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)

// Computed
const isCompleted = computed(() => action.value?.state === 'COMPLETED')
const isSomeday = computed(() => action.value?.state === 'SOMEDAY')
const isWaiting = computed(() => action.value?.state === 'WAITING')
const isToday = computed(() => fromSource.value === 'today')
const fromCalendar = computed(() => fromSource.value === 'calendar')
const fromWaiting = computed(() => fromSource.value === 'waiting')
const fromProject = computed(() => fromSource.value === 'project')
const fromCompleted = computed(() => fromSource.value === 'completed')
const fromSomeday = computed(() => fromSource.value === 'someday')
const fromMixedList = computed(() => fromCompleted.value || fromSomeday.value)

const backLabel = computed(() => {
  if (fromProject.value) return route.query.project_title || 'Project'
  if (fromCalendar.value) return 'Calendar'
  if (fromCompleted.value || isCompleted.value) return 'Completed'
  if (fromSomeday.value || isSomeday.value) return 'Someday / Maybe'
  if (isWaiting.value || fromWaiting.value) return 'Waiting For'
  if (isToday.value) return 'Today'
  return 'Next'
})

// Date section computed
const hasAnyDate = computed(() =>
  action.value?.start_date || action.value?.scheduled_date || action.value?.due_date
)

const hasDeferredDate = computed(() =>
  action.value?.start_date || action.value?.scheduled_date
)

const deferredDisplay = computed(() => {
  if (action.value?.scheduled_date) {
    let display = formatDateTimeDisplay(action.value.scheduled_date, action.value.scheduled_time)
    if (action.value.scheduled_time && action.value.scheduled_duration) {
      display += ` (${action.value.scheduled_duration} min)`
    }
    return `Scheduled for ${display}`
  }
  if (action.value?.start_date) {
    const display = formatDateTimeDisplay(action.value.start_date, action.value.start_time)
    return `Start after ${display}`
  }
  return 'Not set'
})

const datesSummary = computed(() => {
  const parts = []
  if (action.value?.due_date) {
    parts.push(`Due: ${formatShortDate(action.value.due_date)}`)
  }
  if (action.value?.scheduled_date) {
    parts.push(`Scheduled: ${formatShortDate(action.value.scheduled_date)}`)
  }
  if (action.value?.start_date) {
    parts.push(`Starts: ${formatShortDate(action.value.start_date)}`)
  }
  return parts.join(' · ')
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  try {
    // Track source for navigation
    fromSource.value = route.query.from || null

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
  if (fromProject.value) {
    router.push({ name: 'project-detail', params: { id: route.query.project_id } })
  } else if (fromCalendar.value) {
    router.push({ name: 'calendar' })
  } else if (fromCompleted.value || isCompleted.value) {
    router.push({ name: 'completed' })
  } else if (fromSomeday.value || isSomeday.value) {
    router.push({ name: 'someday' })
  } else if (isWaiting.value || fromWaiting.value) {
    router.push({ name: 'waiting-for' })
  } else if (isToday.value) {
    router.push({ name: 'today' })
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

function startTagEdit() {
  if (savingField.value) return
  editingField.value = 'tags'
  editTags.value = [...(action.value.tags || [])]
}

async function saveTags() {
  if (editingField.value !== 'tags' || savingField.value) return

  const newTags = [...editTags.value]
  const oldTags = action.value.tags || []

  // No change
  if (JSON.stringify(newTags) === JSON.stringify(oldTags)) {
    editingField.value = null
    return
  }

  action.value.tags = newTags
  savingField.value = 'tags'

  try {
    await updateAction(action.value.id, { title: action.value.title, tags: newTags })
    tagMdl.addToCache(newTags)
    editingField.value = null
  } catch {
    action.value.tags = oldTags
    toaster.push('Failed to save tags')
  } finally {
    savingField.value = null
  }
}

async function onMoveTo(newState) {
  showMoveDialog.value = false
  const currentState = action.value.state || 'NEXT'
  if (newState === currentState) return

  const stateLabels = {
    NEXT: 'Next Actions',
    TODAY: 'Today',
    WAITING: 'Waiting For',
    CALENDAR: 'Calendar',
    SOMEDAY: 'Someday',
    PROJECT: 'Projects'
  }

  // Special handling for PROJECT - transform action to project
  if (newState === 'PROJECT') {
    const outcome = await mover.showOutcome()
    if (!outcome) return

    actionLoading.value = 'move'
    try {
      await apiClient.addProject({
        title: action.value.title,
        description: action.value.description || '',
        outcome
      })
      await trashAction(action.value.id)
      toaster.success(`"${truncateTitle(action.value.title)}" converted to project`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to convert to project')
    } finally {
      actionLoading.value = null
    }
    return
  }

  // Special handling for WAITING - need to prompt for waiting_for
  if (newState === 'WAITING') {
    const waitingFor = await mover.showWaiting({
      waitingFor: action.value.waiting_for || ''
    })
    if (!waitingFor) return // User cancelled

    actionLoading.value = 'move'
    const oldState = action.value.state
    const oldWaitingFor = action.value.waiting_for
    action.value.state = 'WAITING'
    action.value.waiting_for = waitingFor

    try {
      await waitAction(action.value.id, waitingFor)
      toaster.success(`"${truncateTitle(action.value.title)}" moved to Waiting For`)
      await navigateToNextOrPrev()
    } catch {
      action.value.state = oldState
      action.value.waiting_for = oldWaitingFor
      toaster.push('Failed to move action')
    } finally {
      actionLoading.value = null
    }
    return
  }

  // Special handling for CALENDAR - need to prompt for date
  if (newState === 'CALENDAR') {
    const scheduleData = await mover.showSchedule({
      date: action.value.scheduled_date || '',
      time: action.value.scheduled_time || '',
      duration: action.value.scheduled_duration || 15
    })
    if (!scheduleData || !scheduleData.date) return // User cancelled

    actionLoading.value = 'move'
    const oldState = action.value.state
    const oldScheduledDate = action.value.scheduled_date
    const oldScheduledTime = action.value.scheduled_time
    const oldScheduledDuration = action.value.scheduled_duration

    action.value.state = 'CALENDAR'
    action.value.scheduled_date = scheduleData.date
    action.value.scheduled_time = scheduleData.time
    action.value.scheduled_duration = scheduleData.duration

    try {
      await deferAction(action.value.id, 'scheduled', scheduleData.date, scheduleData.time, scheduleData.duration)
      toaster.success(`"${truncateTitle(action.value.title)}" moved to Calendar`)
      await navigateToNextOrPrev()
    } catch {
      action.value.state = oldState
      action.value.scheduled_date = oldScheduledDate
      action.value.scheduled_time = oldScheduledTime
      action.value.scheduled_duration = oldScheduledDuration
      toaster.push('Failed to move action')
    } finally {
      actionLoading.value = null
    }
    return
  }

  actionLoading.value = 'move'
  const oldState = action.value.state
  action.value.state = newState

  try {
    // Use appropriate API based on current state and destination
    if (currentState === 'SOMEDAY') {
      // From Someday: need to activate first, then move if needed
      await activateAction(action.value.id)
      if (newState === 'TODAY') {
        await todayAction(action.value.id)
      }
    } else if (newState === 'TODAY') {
      await todayAction(action.value.id)
    } else if (newState === 'NEXT') {
      // Moving to NEXT - if from CALENDAR, need to undefer
      if (currentState === 'CALENDAR') {
        await undeferAction(action.value.id)
      } else {
        await changeActionState(action.value.id, newState, action.value.title)
      }
    } else if (newState === 'SOMEDAY') {
      await apiClient.somedayAction(action.value.id)
    } else {
      await changeActionState(action.value.id, newState, action.value.title)
    }
    toaster.success(`"${truncateTitle(action.value.title)}" moved to ${stateLabels[newState]}`)
    await navigateToNextOrPrev()
  } catch {
    action.value.state = oldState
    toaster.push('Failed to move action')
  } finally {
    actionLoading.value = null
  }
}

async function onGotIt() {
  actionLoading.value = 'unwait'
  const oldState = action.value.state
  const oldWaitingFor = action.value.waiting_for
  const oldWaitingSince = action.value.waiting_since

  try {
    const result = await unwaitAction(action.value.id)
    action.value.state = result?.state || 'NEXT'
    action.value.waiting_for = null
    action.value.waiting_since = null
    const stateLabel = action.value.state === 'CALENDAR' ? 'Calendar' : 'Next Actions'
    toaster.success(`"${truncateTitle(action.value.title)}" moved to ${stateLabel}`)
    // Navigate back to waiting list since item is no longer there
    router.push({ name: 'waiting-for' })
  } catch {
    action.value.state = oldState
    action.value.waiting_for = oldWaitingFor
    action.value.waiting_since = oldWaitingSince
    toaster.push('Failed to move action')
  } finally {
    actionLoading.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString()
}

// Date section functions
function toggleDatesSection() {
  datesExpanded.value = !datesExpanded.value
}

function formatShortDate(date) {
  if (!date) return ''
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  })
}

function formatDateTimeDisplay(date, time) {
  if (!date) return null
  const dateObj = new Date(date + 'T00:00:00')
  const dateStr = dateObj.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
  if (time) {
    const [h, m] = time.split(':')
    const hour = parseInt(h)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${dateStr} at ${hour % 12 || 12}:${m} ${ampm}`
  }
  return dateStr
}

function formatWaitingDuration(waitingSince) {
  if (!waitingSince) return ''
  const since = new Date(waitingSince)
  const now = new Date()
  const diffMs = now - since
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'since today'
  if (diffDays === 1) return 'for 1 day'
  if (diffDays < 7) return `for ${diffDays} days`
  if (diffDays < 14) return 'for 1 week'
  const weeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return `for ${weeks} weeks`
  const months = Math.floor(diffDays / 30)
  if (months === 1) return 'for 1 month'
  return `for ${months} months`
}

function startDeferredEdit() {
  if (savingField.value) return
  editingField.value = 'deferred'

  // Determine which type is currently set (default to scheduled)
  let deferType = 'scheduled'
  let date = ''
  let time = ''
  let duration = 15 // default 15 minutes

  if (action.value.scheduled_date) {
    deferType = 'scheduled'
    date = action.value.scheduled_date
    time = action.value.scheduled_time || ''
    duration = action.value.scheduled_duration || 15
  } else if (action.value.start_date) {
    deferType = 'start'
    date = action.value.start_date
    time = action.value.start_time || ''
  }

  dateEdit.value = {
    date,
    time,
    showTime: !!time,
    deferType,
    duration
  }

  nextTick(() => {
    deferredDateInput.value?.focus()
  })
}

async function saveDeferredField() {
  if (editingField.value !== 'deferred' || savingField.value) return

  const newDate = dateEdit.value.date || null
  const newTime = dateEdit.value.showTime ? (dateEdit.value.time || null) : null
  const deferType = dateEdit.value.deferType // 'scheduled' or 'start'
  const duration = dateEdit.value.duration || 15

  // If no date, this is a clear operation
  if (!newDate) {
    await clearDeferredField()
    return
  }

  // Save old values for rollback
  const oldStartDate = action.value.start_date
  const oldStartTime = action.value.start_time
  const oldScheduledDate = action.value.scheduled_date
  const oldScheduledTime = action.value.scheduled_time
  const oldScheduledDuration = action.value.scheduled_duration
  const oldState = action.value.state

  // Update local state optimistically
  if (deferType === 'scheduled') {
    action.value.scheduled_date = newDate
    action.value.scheduled_time = newTime
    action.value.scheduled_duration = newTime ? duration : null
    action.value.start_date = null
    action.value.start_time = null
  } else {
    action.value.start_date = newDate
    action.value.start_time = newTime
    action.value.scheduled_date = null
    action.value.scheduled_time = null
    action.value.scheduled_duration = null
  }
  action.value.state = 'CALENDAR'

  savingField.value = 'deferred'

  try {
    await deferAction(action.value.id, deferType, newDate, newTime, duration)
    editingField.value = null
  } catch {
    // Rollback on error
    action.value.start_date = oldStartDate
    action.value.start_time = oldStartTime
    action.value.scheduled_date = oldScheduledDate
    action.value.scheduled_time = oldScheduledTime
    action.value.scheduled_duration = oldScheduledDuration
    action.value.state = oldState
    toaster.push('Failed to save deferred date')
  } finally {
    savingField.value = null
  }
}

async function clearDeferredField() {
  if (savingField.value) return

  // Save old values for rollback
  const oldStartDate = action.value.start_date
  const oldStartTime = action.value.start_time
  const oldScheduledDate = action.value.scheduled_date
  const oldScheduledTime = action.value.scheduled_time
  const oldScheduledDuration = action.value.scheduled_duration
  const oldState = action.value.state

  // Update local state optimistically
  action.value.start_date = null
  action.value.start_time = null
  action.value.scheduled_date = null
  action.value.scheduled_time = null
  action.value.scheduled_duration = null
  action.value.state = 'NEXT'

  savingField.value = 'deferred'

  try {
    await undeferAction(action.value.id)
    editingField.value = null
    dateEdit.value = { date: '', time: '', showTime: false, deferType: 'scheduled', duration: 15 }
  } catch {
    // Rollback on error
    action.value.start_date = oldStartDate
    action.value.start_time = oldStartTime
    action.value.scheduled_date = oldScheduledDate
    action.value.scheduled_time = oldScheduledTime
    action.value.scheduled_duration = oldScheduledDuration
    action.value.state = oldState
    toaster.push('Failed to clear deferred date')
  } finally {
    savingField.value = null
  }
}

function startDateEdit(field) {
  if (savingField.value) return
  editingField.value = field
  const timeField = field.replace('_date', '_time')
  const existingTime = action.value[timeField] || ''
  dateEdit.value = {
    date: action.value[field] || '',
    time: existingTime,
    showTime: !!existingTime,
    deferType: 'scheduled'
  }
  nextTick(() => {
    dueDateInput.value?.focus()
  })
}

async function saveDateField(field) {
  if (editingField.value !== field || savingField.value) return

  const newDate = dateEdit.value.date || null
  const newTime = dateEdit.value.showTime ? (dateEdit.value.time || null) : null

  // If no date, this is a clear operation
  if (!newDate) {
    await clearDateField(field)
    return
  }

  // Only handle due_date for now
  if (field !== 'due_date') return

  const oldDate = action.value.due_date
  const oldTime = action.value.due_time

  // Update local state optimistically
  action.value.due_date = newDate
  action.value.due_time = newTime
  savingField.value = field

  try {
    await setDueDate(action.value.id, newDate, newTime)
    editingField.value = null
  } catch {
    action.value.due_date = oldDate
    action.value.due_time = oldTime
    toaster.push('Failed to save due date')
  } finally {
    savingField.value = null
  }
}

async function clearDateField(field) {
  if (savingField.value) return

  // Only handle due_date for now
  if (field !== 'due_date') return

  const oldDate = action.value.due_date
  const oldTime = action.value.due_time

  // Update local state optimistically
  action.value.due_date = null
  action.value.due_time = null
  savingField.value = field

  try {
    await clearDueDate(action.value.id)
    editingField.value = null
    dateEdit.value = { ...dateEdit.value, date: '', time: '', showTime: false }
  } catch {
    action.value.due_date = oldDate
    action.value.due_time = oldTime
    toaster.push('Failed to clear due date')
  } finally {
    savingField.value = null
  }
}

// Navigation functions
async function navigateToPosition(position) {
  if (navigating.value) return
  if (position < 0 || position >= totalItems.value) return

  navigating.value = true
  try {
    // Use correct model based on source
    let getByPosition
    if (fromCompleted.value) {
      getByPosition = apiClient.getCompletedByPosition
    } else if (fromSomeday.value) {
      getByPosition = apiClient.getSomedayByPosition
    } else if (fromWaiting.value) {
      getByPosition = waitingMdl.getWaitingByPosition
    } else if (isToday.value) {
      getByPosition = todayMdl.getActionByPosition
    } else {
      getByPosition = getActionByPosition
    }
    const data = await getByPosition(position)

    // Mixed-type lists - redirect if type changed
    if (fromMixedList.value && data.type !== 'ACTION') {
      const query = { position: data.position, total: data.total_items || totalItems.value, from: fromSource.value }
      const name = data.type === 'STUFF' ? 'stuff-detail' : 'project-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    action.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    router.replace({
      name: 'action-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value }
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
  let backRoute = 'next'
  if (fromCompleted.value) {
    backRoute = 'completed'
  } else if (fromSomeday.value) {
    backRoute = 'someday'
  } else if (fromWaiting.value) {
    backRoute = 'waiting-for'
  } else if (isToday.value) {
    backRoute = 'today'
  }

  if (newTotal <= 0) {
    router.push({ name: backRoute })
    return
  }

  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    // Use correct model based on source
    let getByPosition
    if (fromCompleted.value) {
      getByPosition = apiClient.getCompletedByPosition
    } else if (fromSomeday.value) {
      getByPosition = apiClient.getSomedayByPosition
    } else if (fromWaiting.value) {
      getByPosition = waitingMdl.getWaitingByPosition
    } else if (isToday.value) {
      getByPosition = todayMdl.getActionByPosition
    } else {
      getByPosition = getActionByPosition
    }
    const data = await getByPosition(nextPos)

    // Mixed-type lists - redirect if type changed
    if (fromMixedList.value && data.type !== 'ACTION') {
      const query = { position: data.position, total: data.total_items ?? newTotal, from: fromSource.value }
      const name = data.type === 'STUFF' ? 'stuff-detail' : 'project-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    action.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'action-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value }
    })
  } catch {
    router.push({ name: backRoute })
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
    if (isSomeday.value) {
      router.push({ name: 'someday' })
    } else {
      await navigateToNextOrPrev()
    }
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

async function onActivate() {
  actionLoading.value = 'activate'
  const title = truncateTitle(action.value.title)
  try {
    await apiClient.activateAction(action.value.id)
    toaster.success(`"${title}" moved to Next Actions`)
    router.push({ name: 'someday' })
  } catch (err) {
    toaster.push(err.message || 'Failed to activate action')
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

/* ── Collapsible section header ── */
.detail-section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
}

.detail-section-header:hover {
  background: var(--color-bg-secondary);
}

.detail-section-header .detail-section-label {
  margin-bottom: 0;
  cursor: pointer;
}

.detail-section-toggle {
  font-size: var(--font-size-footnote);
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.detail-section-content--inline {
  min-height: auto;
  padding: 0;
  border: none;
}

.detail-section-content--inline:hover {
  background: none;
}

/* ── Date grid ── */
.detail-dates-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 16px;
  padding-bottom: 4px;
}

.detail-date-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-date-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.detail-date-edit-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-date-type-selector {
  display: flex;
  gap: 24px;
}

.detail-date-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
}

.detail-date-radio input {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.detail-date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 8px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
}

.detail-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  outline: none;
}

.detail-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-input--time {
  width: 120px;
}

.detail-duration-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-input--duration {
  width: 70px;
  text-align: center;
}

.detail-duration-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
}

.detail-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-link-text);
  cursor: pointer;
  padding: 8px 0;
}

.detail-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.detail-date-row .detail-section-actions {
  margin-top: 4px;
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

  .detail-date-type-selector {
    flex-direction: column;
    gap: 8px;
  }

  .detail-date-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-input {
    width: 100%;
  }

  .detail-input--time {
    width: 100%;
  }

  .detail-duration-input {
    flex-direction: row;
    width: 100%;
  }

  .detail-input--duration {
    flex: 1;
    width: auto;
  }
}

/* ── Tags section ── */
.detail-tags-display {
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.detail-tags-display:hover {
  background: var(--color-bg-secondary);
}

.detail-tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  line-height: 1.4;
}

/* ── Waiting For section ── */
.detail-waiting-for {
  color: var(--color-text-primary);
}

.detail-waiting-since {
  color: var(--color-text-tertiary);
  margin-left: 8px;
}

.detail-waiting-since::before {
  content: '·';
  margin-right: 8px;
}

</style>
