<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="text-body-m detail-back-link" @click="goBack">&lt;</a>
          <span class="text-body-s detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="action && hasPositionNav" class="detail-header-right">
          <div class="detail-nav-buttons">
            <Btn variant="icon" class="detail-nav-btn" title="First" :disabled="navigating || currentPosition <= 0" @click="goFirst"><ChevronsLeftIcon class="detail-nav-icon" /></Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Previous" :disabled="navigating || currentPosition <= 0" @click="goPrev"><TriangleLeftIcon class="detail-nav-icon" /></Btn>
            <span class="text-body-s detail-position">
              <span class="detail-nav-spinner" v-if="navigating"></span>
              {{ currentPosition + 1 }} of {{ totalItems }}
            </span>
            <Btn variant="icon" class="detail-nav-btn" title="Next" :disabled="navigating || currentPosition >= totalItems - 1" @click="goNext"><TriangleRightIcon class="detail-nav-icon" /></Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Last" :disabled="navigating || currentPosition >= totalItems - 1" @click="goLast"><ChevronsRightIcon class="detail-nav-icon" /></Btn>
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
                class="text-h2 detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title', 'detail-title--completed': isCompleted }"
                @click="startEdit('title', action.title)"
            >{{ action.title }}</h2>
            <textarea
                v-if="editingField === 'title'"
                ref="titleInput"
                v-model="editValue"
                class="text-h2 detail-title-input"
                :disabled="savingField === 'title'"
                @keydown.enter.prevent="saveField('title')"
                @keyup.esc="cancelEdit"
                @blur="saveField('title')"
                @input="autoResizeTitle"
                rows="1"
            ></textarea>
          </div>
        </div>

        <!-- Recurring indicator -->
        <div v-if="action.recurring_parent_id" class="text-body-s detail-recurring-badge" @click="goToRecurring">
          <svg class="detail-recurring-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
          </svg>
          <span>Recurring</span>
        </div>

        <!-- Weekly Review link -->
        <div v-if="action.recurring_parent_id && action.recurring_parent_id === reviewTemplateId" class="text-body-s detail-review-badge" @click="goToReview">
          <ReviewIcon class="detail-review-badge__icon" />
          <span>Start Weekly Review</span>
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
                variant="secondary"
                size="sm"
                :loading="actionLoading === 'done'"
                @click="onMarkDone"
            >
              Done
            </Btn>
          </template>
          <template v-else>
            <Btn
                variant="secondary"
                size="sm"
                :loading="actionLoading === 'done'"
                @click="onMarkDone"
            >
              Done
            </Btn>
          </template>
          <Dropdown v-if="!isCompleted" v-model="showMoveDialog" title="Move to">
            <template #trigger>
              <Btn
                  variant="secondary"
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
            <button class="dropdown-item" @click="onMoveTo('REFERENCE')"><ReferenceIcon class="dropdown-item-icon" /> Reference</button>
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

        <!-- Project section (if action belongs to a project) -->
        <div v-if="action.project" class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Project</label>
          <div class="detail-section-wrapper">
            <a class="text-body-m detail-project-link" @click="goToProject">
              <ProjectsIcon class="detail-project-link__icon" />
              <span>{{ action.project.title || 'View project' }}</span>
            </a>
          </div>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'description'"
                class="text-body-m detail-section-content"
                :class="{ 'detail-section-content--empty': !action.description }"
                @click="startEdit('description', action.description || '')"
            >{{ action.description || 'Add a description...' }}</p>
            <textarea
                v-else
                ref="descriptionInput"
                v-model="editValue"
                class="text-body-m detail-section-textarea"
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
                  variant="secondary"
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
          <label class="text-body-s fw-semibold detail-section-label">Tags</label>
          <div class="detail-section-wrapper">
            <div v-if="editingField !== 'tags'" class="detail-tags-display" @click="startTagEdit">
              <span v-if="action.tags && action.tags.length > 0" class="detail-tags-chips">
                <span v-for="tag in action.tags" :key="tag" class="text-body-s detail-tag-chip">{{ tag }}</span>
              </span>
              <span v-else class="text-body-m detail-section-content detail-section-content--empty">Add tags...</span>
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
                    variant="secondary"
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
          <label class="text-body-s fw-semibold detail-section-label">Waiting on</label>
          <div class="detail-section-wrapper">
            <p class="text-body-m detail-section-content">
              <span class="detail-waiting-for">{{ action.waiting_for || 'Unknown' }}</span>
              <span v-if="action.waiting_since" class="detail-waiting-since">{{ formatWaitingDuration(action.waiting_since) }}</span>
            </p>
          </div>
        </div>

        <!-- Dates Section (collapsible) -->
        <div class="detail-section-area">
          <div class="detail-section-header" @click="toggleDatesSection">
            <label class="text-body-s fw-semibold detail-section-label">Dates</label>
            <span v-if="!datesExpanded && !hasAnyDate" class="text-body-m detail-section-content detail-section-content--empty detail-section-content--inline">Add dates...</span>
            <span v-else-if="!datesExpanded" class="text-body-m detail-section-content detail-section-content--inline">{{ datesSummary }}</span>
            <span class="text-footnote detail-section-toggle">{{ datesExpanded ? '▼' : '▶' }}</span>
          </div>

          <div v-if="datesExpanded" class="detail-dates-grid">
            <!-- Scheduled Date -->
            <div class="detail-date-row">
              <label class="text-body-s fw-semibold detail-date-label">Scheduled</label>
              <!-- Disabled when start or due is set -->
              <div v-if="isScheduledDisabled" class="detail-section-wrapper">
                <p class="text-body-m detail-section-content detail-section-content--disabled">Not available (has start or due date)</p>
              </div>
              <!-- Display mode -->
              <div v-else-if="editingField !== 'scheduled'" class="detail-section-wrapper">
                <p
                    class="text-body-m detail-section-content"
                    :class="{ 'detail-section-content--empty': !action.scheduled_date }"
                    @click="startScheduledEdit"
                >{{ scheduledDisplay }}</p>
              </div>
              <!-- Edit mode -->
              <div v-else class="detail-date-edit-wrapper" @keyup.esc="cancelEdit">
                <DateTimeInput
                    ref="scheduledDateInput"
                    :date="dateEdit.date"
                    @update:date="dateEdit.date = $event"
                    :time="dateEdit.time"
                    @update:time="dateEdit.time = $event"
                    :duration="dateEdit.duration"
                    @update:duration="dateEdit.duration = $event"
                    :with-duration="true"
                    :clearable="true"
                    :disabled="savingField === 'scheduled'"
                />
                <div class="detail-section-actions">
                  <Btn variant="primary" size="sm" :loading="savingField === 'scheduled'" @mousedown.prevent @click="saveScheduledField">Save</Btn>
                  <Btn variant="secondary" size="sm" :disabled="savingField === 'scheduled'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
                  <Btn v-if="action.scheduled_date" variant="ghost-danger" size="sm" :disabled="savingField === 'scheduled'" @mousedown.prevent @click="clearScheduledField">Clear</Btn>
                </div>
              </div>
            </div>

            <!-- Start Date -->
            <div class="detail-date-row">
              <label class="text-body-s fw-semibold detail-date-label">Start</label>
              <!-- Disabled when scheduled is set -->
              <div v-if="isStartDueDisabled" class="detail-section-wrapper">
                <p class="text-body-m detail-section-content detail-section-content--disabled">Not available (has scheduled date)</p>
              </div>
              <!-- Display mode -->
              <div v-else-if="editingField !== 'start_date'" class="detail-section-wrapper">
                <p
                    class="text-body-m detail-section-content"
                    :class="{ 'detail-section-content--empty': !action.start_date }"
                    @click="startStartEdit"
                >{{ startDisplay }}</p>
              </div>
              <!-- Edit mode -->
              <div v-else class="detail-date-edit-wrapper" @keyup.esc="cancelEdit">
                <DateTimeInput
                    ref="startDateInput"
                    :date="dateEdit.date"
                    @update:date="dateEdit.date = $event"
                    :time="dateEdit.time"
                    @update:time="dateEdit.time = $event"
                    :with-duration="false"
                    :clearable="true"
                    :disabled="savingField === 'start_date'"
                />
                <div class="detail-section-actions">
                  <Btn variant="primary" size="sm" :loading="savingField === 'start_date'" @mousedown.prevent @click="saveStartField">Save</Btn>
                  <Btn variant="secondary" size="sm" :disabled="savingField === 'start_date'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
                  <Btn v-if="action.start_date" variant="ghost-danger" size="sm" :disabled="savingField === 'start_date'" @mousedown.prevent @click="clearStartField">Clear</Btn>
                </div>
              </div>
            </div>

            <!-- Due Date -->
            <div class="detail-date-row">
              <label class="text-body-s fw-semibold detail-date-label">Due</label>
              <!-- Disabled when scheduled is set -->
              <div v-if="isStartDueDisabled" class="detail-section-wrapper">
                <p class="text-body-m detail-section-content detail-section-content--disabled">Not available (has scheduled date)</p>
              </div>
              <!-- Display mode -->
              <div v-else-if="editingField !== 'due_date'" class="detail-section-wrapper">
                <p
                    class="text-body-m detail-section-content"
                    :class="{ 'detail-section-content--empty': !action.due_date }"
                    @click="startDateEdit('due_date')"
                >{{ formatDateTimeDisplay(action.due_date, action.due_time) || 'Not set' }}</p>
              </div>
              <!-- Edit mode -->
              <div v-else class="detail-date-edit-wrapper" @keyup.esc="cancelEdit">
                <DateTimeInput
                    ref="dueDateInput"
                    :date="dateEdit.date"
                    @update:date="dateEdit.date = $event"
                    :time="dateEdit.time"
                    @update:time="dateEdit.time = $event"
                    :with-duration="false"
                    :clearable="true"
                    :disabled="savingField === 'due_date'"
                />
                <div class="detail-section-actions">
                  <Btn variant="primary" size="sm" :loading="savingField === 'due_date'" @mousedown.prevent @click="saveDateField('due_date')">Save</Btn>
                  <Btn variant="secondary" size="sm" :disabled="savingField === 'due_date'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
                  <Btn v-if="action.due_date" variant="ghost-danger" size="sm" :disabled="savingField === 'due_date'" @mousedown.prevent @click="clearDateField('due_date')">Clear</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Attachments section -->
        <AttachmentSection v-if="action.id" :entity-type="'action'" :item-id="action.id" />

        <!-- Comments section -->
        <CommentSection v-if="action.id" :entity-type="'action'" :item-id="action.id" />

        <!-- Metadata section -->
        <div class="detail-metadata">
          <span class="detail-metadata-item">
            <span class="text-footnote detail-metadata-label">Created</span>
            <span class="text-footnote detail-metadata-value">{{ formatDate(action.created) }}</span>
          </span>
          <span class="text-footnote detail-metadata-separator">·</span>
          <span class="detail-metadata-item">
            <span class="text-footnote detail-metadata-label">Updated</span>
            <span class="text-footnote detail-metadata-value">{{ formatDate(action.updated) }}</span>
          </span>
        </div>

      </div>

    </div>

  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import Dropdown from '../../components/Dropdown.vue'
import TagInput from '../../components/TagInput.vue'
import CommentSection from '../../components/CommentSection.vue'
import AttachmentSection from '../../components/AttachmentSection.vue'
import DateTimeInput from '../../components/DateTimeInput.vue'
import { nextActionModel } from '../../scripts/models/nextActionModel.js'
import { todayModel } from '../../scripts/models/todayModel.js'
import { waitingModel } from '../../scripts/models/waitingModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import apiClient, { deferAction, undeferAction, setDueDate, clearDueDate, waitAction, unwaitAction, todayAction, activateAction } from '../../scripts/core/apiClient.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { moveModel } from '../../scripts/models/moveModel.js'
import { tagModel } from '../../scripts/models/tagModel.js'
import ActionIcon from '../../assets/ActionIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import TodayIcon from '../../assets/TodayIcon.vue'
import WaitingIcon from '../../assets/WaitingIcon.vue'
import CalendarIcon from '../../assets/CalendarIcon.vue'
import SomedayIcon from '../../assets/SomedayIcon.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import ReferenceIcon from '../../assets/ReferenceIcon.vue'
import ReviewIcon from '../../assets/ReviewIcon.vue'
import TriangleLeftIcon from '../../assets/TriangleLeftIcon.vue'
import TriangleRightIcon from '../../assets/TriangleRightIcon.vue'
import ChevronsLeftIcon from '../../assets/ChevronsLeftIcon.vue'
import ChevronsRightIcon from '../../assets/ChevronsRightIcon.vue'
import { reviewModel } from '../../scripts/models/reviewModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const mover = moveModel()
const tagMdl = tagModel()
const { reviewTemplateId } = reviewModel()
const settings = settingsModel()

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
const dateEdit = ref({ date: '', time: null, duration: null })
const scheduledDateInput = ref(null)
const startDateInput = ref(null)
const dueDateInput = ref(null)

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)

// From-source route and label mappings
const FROM_ROUTES = {
  inbox: 'inbox', next: 'next', today: 'today', calendar: 'calendar',
  waiting: 'waiting-for', completed: 'completed', someday: 'someday',
  projects: 'projects', engage: 'engage', overdue: 'overdue',
  reference: 'reference', review: 'review',
}

const FROM_LABELS = {
  inbox: 'Inbox', next: 'Next', today: 'Today', calendar: 'Calendar',
  waiting: 'Waiting For', completed: 'Completed', someday: 'Someday / Maybe',
  projects: 'Projects', engage: 'Dashboard', overdue: 'Overdue',
  reference: 'Reference', review: 'Review', recurring: 'Recurring',
}

// Sources that don't support position-based navigation
const NO_POSITION_SOURCES = ['calendar', 'engage', 'overdue', 'project', 'recurring', 'reference', 'review']

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
const fromRecurring = computed(() => fromSource.value === 'recurring')
const fromEngage = computed(() => fromSource.value === 'engage')
const fromMixedList = computed(() => fromCompleted.value || fromSomeday.value)
const hasPositionNav = computed(() => !NO_POSITION_SOURCES.includes(fromSource.value))

const backLabel = computed(() => {
  if (fromSource.value === 'project') return route.query.project_title || 'Project'
  if (fromSource.value && FROM_LABELS[fromSource.value]) return FROM_LABELS[fromSource.value]
  if (isCompleted.value) return 'Completed'
  if (isSomeday.value) return 'Someday / Maybe'
  if (isWaiting.value) return 'Waiting For'
  return 'Next'
})

// Date section computed
const hasAnyDate = computed(() =>
  action.value?.start_date || action.value?.scheduled_date || action.value?.due_date
)

const isScheduledDisabled = computed(() =>
  !action.value?.scheduled_date && !!(action.value?.start_date || action.value?.due_date)
)

const isStartDueDisabled = computed(() =>
  !!action.value?.scheduled_date
)

const scheduledDisplay = computed(() => {
  if (!action.value?.scheduled_date) return 'Not set'
  let display = formatDateTimeDisplay(action.value.scheduled_date, action.value.scheduled_time)
  if (action.value.scheduled_time && action.value.scheduled_duration) {
    display += ` (${action.value.scheduled_duration} min)`
  }
  return display
})

const startDisplay = computed(() => {
  if (!action.value?.start_date) return 'Not set'
  return formatDateTimeDisplay(action.value.start_date, action.value.start_time)
})

const datesSummary = computed(() => {
  const parts = []
  if (action.value?.scheduled_date) {
    let s = formatDateTimeDisplay(action.value.scheduled_date, action.value.scheduled_time)
    if (action.value.scheduled_time && action.value.scheduled_duration) {
      s += ` (${action.value.scheduled_duration} min)`
    }
    parts.push(s)
  }
  if (action.value?.start_date) {
    let s = formatDateTimeDisplay(action.value.start_date, action.value.start_time)
    parts.push(`Starts: ${s}`)
  }
  if (action.value?.due_date) {
    let s = formatDateTimeDisplay(action.value.due_date, action.value.due_time)
    parts.push(`Due: ${s}`)
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
  // Special cases with params
  if (fromProject.value) {
    router.push({ name: 'project-detail', params: { id: route.query.project_id } })
    return
  }
  if (fromRecurring.value) {
    router.push({ name: 'recurring-detail', params: { id: route.query.recurring_id } })
    return
  }
  // Lookup from source
  const mapped = fromSource.value && FROM_ROUTES[fromSource.value]
  if (mapped) {
    router.push({ name: mapped })
    return
  }
  // State-based fallback
  if (isCompleted.value) {
    router.push({ name: 'completed' })
  } else if (isSomeday.value) {
    router.push({ name: 'someday' })
  } else if (isWaiting.value) {
    router.push({ name: 'waiting-for' })
  } else {
    router.push({ name: 'next' })
  }
}

function goToProject() {
  if (!action.value?.project?.id) return
  router.push({ name: 'project-detail', params: { id: action.value.project.id } })
}

function goToRecurring() {
  if (!action.value?.recurring_parent_id) return
  router.push({ name: 'recurring-detail', params: { id: action.value.recurring_parent_id } })
}

function goToReview() {
  router.push({ name: 'review' })
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
    PROJECT: 'Projects',
    REFERENCE: 'Reference'
  }

  // Special handling for REFERENCE - transform action to file
  if (newState === 'REFERENCE') {
    actionLoading.value = 'move'
    try {
      await apiClient.transformActionToFile(action.value.id)
      statsModel().refreshStats()
      toaster.success(`"${truncateTitle(action.value.title)}" moved to Reference`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move to Reference')
    } finally {
      actionLoading.value = null
    }
    return
  }

  // Special handling for PROJECT - transform action to project
  if (newState === 'PROJECT') {
    const outcome = await mover.showOutcome()
    if (!outcome) return

    actionLoading.value = 'move'
    try {
      await apiClient.transformActionToProject(action.value.id, outcome)
      statsModel().refreshStats()
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
      statsModel().refreshStats()
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
      time: action.value.scheduled_time || null,
      duration: action.value.scheduled_duration || null
    })
    if (!scheduleData?.date) return // User cancelled

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
      statsModel().refreshStats()
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
  const oldScheduledDate = action.value.scheduled_date
  const oldScheduledTime = action.value.scheduled_time
  const oldScheduledDuration = action.value.scheduled_duration
  const oldStartDate = action.value.start_date
  const oldStartTime = action.value.start_time
  action.value.state = newState

  try {
    // When leaving CALENDAR, clear scheduled/start dates first (due_date is preserved)
    if (currentState === 'CALENDAR' && newState !== 'CALENDAR') {
      await undeferAction(action.value.id)
      action.value.scheduled_date = null
      action.value.scheduled_time = null
      action.value.scheduled_duration = null
      action.value.start_date = null
      action.value.start_time = null
    }

    // Use appropriate API based on current state and destination
    if (currentState === 'SOMEDAY' && newState === 'TODAY') {
      await todayAction(action.value.id)
    } else if (currentState === 'SOMEDAY') {
      await activateAction(action.value.id)
    } else if (newState === 'TODAY') {
      await todayAction(action.value.id)
    } else if (newState === 'NEXT') {
      // If we already called undeferAction above (from CALENDAR), skip the redundant call
      if (currentState !== 'CALENDAR') {
        await undeferAction(action.value.id)
      }
    } else if (newState === 'SOMEDAY') {
      await apiClient.somedayAction(action.value.id)
    } else {
      await changeActionState(action.value.id, newState, action.value.title)
    }
    statsModel().refreshStats()
    toaster.success(`"${truncateTitle(action.value.title)}" moved to ${stateLabels[newState]}`)
    await navigateToNextOrPrev()
  } catch {
    action.value.state = oldState
    action.value.scheduled_date = oldScheduledDate
    action.value.scheduled_time = oldScheduledTime
    action.value.scheduled_duration = oldScheduledDuration
    action.value.start_date = oldStartDate
    action.value.start_time = oldStartTime
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
    statsModel().refreshStats()
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

function formatSmartDate(date) {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const opts = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString('en-US', opts)
}

function formatTimeStr(time) {
  if (!time) return ''
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const is12h = settings.getCalendarSettings().timeFormat === '12h'
  if (is12h) {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    return `${hour % 12 || 12}:${m} ${ampm}`
  }
  return `${String(hour).padStart(2, '0')}:${m}`
}

function formatDateTimeDisplay(date, time) {
  if (!date) return null
  const dateStr = formatSmartDate(date)
  if (time) return `${dateStr} at ${formatTimeStr(time)}`
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

function startScheduledEdit() {
  if (savingField.value) return
  editingField.value = 'scheduled'

  dateEdit.value = {
    date: action.value.scheduled_date || '',
    time: action.value.scheduled_time || null,
    duration: action.value.scheduled_duration || null
  }

  nextTick(() => {
    scheduledDateInput.value?.focus()
  })
}

async function saveScheduledField() {
  if (editingField.value !== 'scheduled' || savingField.value) return

  const newDate = dateEdit.value.date || null
  const newTime = dateEdit.value.time || null
  const duration = dateEdit.value.duration || null

  if (!newDate) {
    await clearScheduledField()
    return
  }

  const oldScheduledDate = action.value.scheduled_date
  const oldScheduledTime = action.value.scheduled_time
  const oldScheduledDuration = action.value.scheduled_duration
  const oldState = action.value.state

  // Update local state optimistically
  action.value.scheduled_date = newDate
  action.value.scheduled_time = newTime
  action.value.scheduled_duration = newTime ? duration : null
  action.value.state = 'CALENDAR'

  savingField.value = 'scheduled'

  try {
    await deferAction(action.value.id, 'scheduled', newDate, newTime, duration)
    statsModel().refreshStats()
    editingField.value = null
  } catch {
    action.value.scheduled_date = oldScheduledDate
    action.value.scheduled_time = oldScheduledTime
    action.value.scheduled_duration = oldScheduledDuration
    action.value.state = oldState
    toaster.push('Failed to save scheduled date')
  } finally {
    savingField.value = null
  }
}

async function clearScheduledField() {
  if (savingField.value) return

  const oldScheduledDate = action.value.scheduled_date
  const oldScheduledTime = action.value.scheduled_time
  const oldScheduledDuration = action.value.scheduled_duration
  const oldState = action.value.state

  action.value.scheduled_date = null
  action.value.scheduled_time = null
  action.value.scheduled_duration = null
  action.value.state = 'NEXT'

  savingField.value = 'scheduled'

  try {
    await undeferAction(action.value.id)
    statsModel().refreshStats()
    editingField.value = null
    dateEdit.value = { date: '', time: null, duration: null }
  } catch {
    action.value.scheduled_date = oldScheduledDate
    action.value.scheduled_time = oldScheduledTime
    action.value.scheduled_duration = oldScheduledDuration
    action.value.state = oldState
    toaster.push('Failed to clear scheduled date')
  } finally {
    savingField.value = null
  }
}

function startStartEdit() {
  if (savingField.value) return
  editingField.value = 'start_date'

  dateEdit.value = {
    date: action.value.start_date || '',
    time: action.value.start_time || null,
    duration: null
  }

  nextTick(() => {
    startDateInput.value?.focus()
  })
}

async function saveStartField() {
  if (editingField.value !== 'start_date' || savingField.value) return

  const newDate = dateEdit.value.date || null
  const newTime = dateEdit.value.time || null

  if (!newDate) {
    await clearStartField()
    return
  }

  const oldStartDate = action.value.start_date
  const oldStartTime = action.value.start_time
  const oldState = action.value.state

  action.value.start_date = newDate
  action.value.start_time = newTime
  action.value.state = 'CALENDAR'

  savingField.value = 'start_date'

  try {
    await deferAction(action.value.id, 'start', newDate, newTime)
    statsModel().refreshStats()
    editingField.value = null
  } catch {
    action.value.start_date = oldStartDate
    action.value.start_time = oldStartTime
    action.value.state = oldState
    toaster.push('Failed to save start date')
  } finally {
    savingField.value = null
  }
}

async function clearStartField() {
  if (savingField.value) return

  const oldStartDate = action.value.start_date
  const oldStartTime = action.value.start_time
  const oldState = action.value.state

  action.value.start_date = null
  action.value.start_time = null
  action.value.state = 'NEXT'

  savingField.value = 'start_date'

  try {
    await undeferAction(action.value.id)
    statsModel().refreshStats()
    editingField.value = null
    dateEdit.value = { date: '', time: null, duration: null }
  } catch {
    action.value.start_date = oldStartDate
    action.value.start_time = oldStartTime
    action.value.state = oldState
    toaster.push('Failed to clear start date')
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
    time: existingTime || null,
    duration: null
  }
  nextTick(() => {
    dueDateInput.value?.focus()
  })
}

async function saveDateField(field) {
  if (editingField.value !== field || savingField.value) return

  const newDate = dateEdit.value.date || null
  const newTime = dateEdit.value.time || null

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
    statsModel().refreshStats()
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
    statsModel().refreshStats()
    editingField.value = null
    dateEdit.value = { date: '', time: null, duration: null }
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
  // Determine back route from source, then state-based fallback
  let backRoute = (fromSource.value && FROM_ROUTES[fromSource.value]) || null
  if (!backRoute) {
    if (isCompleted.value) backRoute = 'completed'
    else if (isSomeday.value) backRoute = 'someday'
    else if (isWaiting.value) backRoute = 'waiting-for'
    else backRoute = 'next'
  }

  // For sources without position-based lists, just go back
  if (NO_POSITION_SOURCES.includes(fromSource.value)) {
    if (fromProject.value) {
      router.push({ name: 'project-detail', params: { id: route.query.project_id } })
    } else if (fromRecurring.value) {
      router.push({ name: 'recurring-detail', params: { id: route.query.recurring_id } })
    } else {
      router.push({ name: backRoute })
    }
    return
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
    statsModel().refreshStats()
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
    statsModel().refreshStats()
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
  font-size: var(--font-size-xs);
}

.detail-nav-icon {
  width: 18px;
  height: 18px;
}

.detail-nav-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 18px;
  height: 18px;
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
  touch-action: pan-y;
}

/* ── Meta (State) ── */

.detail-meta-link {
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
  background: var(--color-overlay-white);
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
  padding: 24px 24px 0 50px;
  position: relative;
}

.detail-type-icon {
  position: absolute;
  left: 11px;
  width: 28px;
  height: 28px;
  color: var(--color-text-tertiary);
}

.detail-title-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.detail-title {
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  line-height: var(--lh-normal);
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
  left: -8px;
  right: -8px;
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  line-height: var(--lh-normal);
  box-sizing: border-box;
  outline: none;
  background: var(--color-bg-primary);
  resize: none;
  overflow: hidden;
}

.detail-title-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

/* ── Recurring badge ── */
.detail-recurring-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  margin: 8px 0 0 50px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  color: var(--color-link-text);
  cursor: pointer;
}

.detail-recurring-badge:hover {
  color: var(--color-link-hover);
  border-color: var(--color-text-tertiary);
}

.detail-recurring-icon {
  flex-shrink: 0;
}

.detail-review-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  margin: 6px 0 0 50px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  color: var(--color-link-text);
  cursor: pointer;
}

.detail-review-badge:hover {
  color: var(--color-link-hover);
  border-color: var(--color-text-tertiary);
}

.detail-review-badge__icon {
  width: 16px;
  height: 16px;
  padding: 2px;
  box-sizing: border-box;
  flex-shrink: 0;
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
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: var(--lh-relaxed);
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

.detail-section-content--disabled {
  color: var(--color-text-tertiary);
  font-style: italic;
  cursor: default;
  opacity: 0.6;
}

.detail-section-content--disabled:hover {
  background: none;
}

.detail-section-textarea {
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  padding: 4px 8px;
  margin-left: -8px;
  margin-right: -8px;
  outline: none;
  resize: none;
  background: var(--color-bg-primary);
  box-sizing: border-box;
  line-height: var(--lh-relaxed);
  min-height: 32px;
  field-sizing: content;
}

.detail-section-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
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
  color: var(--color-text-secondary);
}

.detail-date-edit-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-input {
  color: var(--color-text-primary);
  padding: 8px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
}

.detail-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
  outline: none;
}

.detail-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  color: var(--color-text-tertiary);
}

.detail-metadata-value {
  color: var(--color-text-secondary);
}

.detail-metadata-separator {
  color: var(--color-text-tertiary);
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
    padding: 16px 16px 0 50px;
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

  .detail-input {
    width: 100%;
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
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  background: var(--color-bg-accent-light);
  border: none;
  border-radius: 9999px;
  color: var(--color-action);
  white-space: nowrap;
  line-height: 1.3;
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

/* ── Project link ── */
.detail-project-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--color-link-text);
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
}

.detail-project-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.detail-project-link__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

</style>
