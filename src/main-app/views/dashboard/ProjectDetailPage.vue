<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="text-body-m detail-back-link" @click="goBack">&lt;</a>
          <span class="text-body-s detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="project" class="detail-header-right">
          <div class="detail-nav-buttons">
            <Btn variant="icon" class="detail-nav-btn" title="First" :disabled="navigating || currentPosition <= 0" @click="goFirst"><ChevronsLeftIcon class="detail-nav-icon" /></Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Previous" :disabled="navigating || currentPosition <= 0" @click="goPrev"><TriangleLeftIcon class="detail-nav-icon" /></Btn>
            <span class="text-body-s detail-position">
              <Spinner v-if="navigating" :size="18" class="detail-nav-spinner" />
              {{ currentPosition + 1 }} of {{ totalItems }}
            </span>
            <Btn variant="icon" class="detail-nav-btn" title="Next" :disabled="navigating || currentPosition >= totalItems - 1" @click="goNext"><TriangleRightIcon class="detail-nav-icon" /></Btn>
            <Btn variant="icon" class="detail-nav-btn" title="Last" :disabled="navigating || currentPosition >= totalItems - 1" @click="goLast"><ChevronsRightIcon class="detail-nav-icon" /></Btn>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="pageLoading" class="detail-loading">
        <Spinner />
      </div>

      <!-- Content -->
      <div v-else-if="project" ref="detailBodyRef" class="detail-body" :class="{ scrolling: bodyScrolling }">

        <!-- Title area -->
        <div class="detail-title-area">
          <ProjectsIcon class="detail-type-icon" />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <Spinner />
            </div>
            <h2
                class="text-h2 detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title', 'detail-title--completed': isCompleted }"
                @click="startEdit('title', project.title)"
            >{{ project.title }}</h2>
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
                variant="secondary"
                size="sm"
                :loading="actionLoading === 'complete'"
                @click="onComplete"
            >
              Complete
            </Btn>
          </template>
          <template v-else>
            <Btn
                variant="secondary"
                size="sm"
                :loading="actionLoading === 'complete'"
                @click="onComplete"
            >
              Complete
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
            <button class="dropdown-item" @click="onMoveTo('ACTION')"><NextIcon class="dropdown-item-icon" /> Next Actions</button>
            <button class="dropdown-item" @click="onMoveTo('REFERENCE')"><ReferenceIcon class="dropdown-item-icon" /> Reference</button>
            <button v-if="!isSomeday" class="dropdown-item" @click="onMoveTo('SOMEDAY')"><SomedayIcon class="dropdown-item-icon" /> Someday</button>
          </Dropdown>
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

        <!-- Outcome area -->
        <div class="detail-section-area detail-section-area--no-border">
          <label class="text-body-s fw-semibold detail-section-label">Outcome</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'outcome'"
                class="text-body-m detail-section-content"
                :class="{ 'detail-section-content--empty': !project.outcome }"
                @click="startEdit('outcome', project.outcome || '')"
            >{{ project.outcome || 'What does done look like?' }}</p>
            <textarea
                v-else
                ref="outcomeInput"
                v-model="editValue"
                class="text-body-m detail-section-textarea"
                :disabled="savingField === 'outcome'"
                @keyup.esc="cancelEdit"
                @blur="saveField('outcome')"
                rows="1"
            ></textarea>
            <div v-if="editingField === 'outcome'" class="detail-section-actions">
              <Btn
                  variant="primary"
                  size="sm"
                  :disabled="savingField === 'outcome'"
                  :loading="savingField === 'outcome'"
                  @mousedown.prevent
                  @click="saveField('outcome')"
              >Save</Btn>
              <Btn
                  variant="secondary"
                  size="sm"
                  :disabled="savingField === 'outcome'"
                  @mousedown.prevent
                  @click="cancelEdit"
              >Cancel</Btn>
            </div>
          </div>
        </div>

        <!-- Next Action section -->
        <div v-if="!isCompleted" class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Next Action</label>
          <div class="next-action-wrapper">
            <div v-if="actionsLoading" class="next-action-loading">
              <Spinner :size="16" />
            </div>
            <template v-else>
              <!-- Add input at top (visible when items exist or user clicked warning) -->
              <div v-if="orderedActions.length > 0 || addInputVisible" class="actions-quick-add actions-quick-add--top">
                <input
                    ref="quickAddInput"
                    v-model="newActionTitle"
                    class="text-body-m actions-quick-add-input"
                    type="text"
                    placeholder="Add action..."
                    :disabled="addingAction"
                    @keydown.enter="onAddAction"
                    @blur="onAddInputBlur"
                />
                <Btn
                    variant="primary"
                    size="sm"
                    class="actions-quick-add-btn"
                    :disabled="!newActionTitle.trim() || addingAction"
                    :loading="addingAction"
                    @mousedown.prevent
                    @click="onAddAction"
                >Add</Btn>
              </div>

              <!-- Warning when no actions -->
              <div v-if="orderedActions.length === 0 && !isSomeday && !addInputVisible" class="next-action-prompt" @click="focusAddInput">
                <WarningIcon class="next-action-prompt__icon" />
                <div class="next-action-prompt__text">
                  <strong class="text-body-m fw-bold">What's the next physical step?</strong>
                  <span class="text-body-s">Every active project needs a next action.</span>
                </div>
              </div>

              <!-- Action list -->
              <div v-if="orderedActions.length > 0" ref="actionsScrollRef" class="actions-list-scroll" :class="{ scrolling: listScrolling }">
                <VueDraggable
                    v-model="orderedActions"
                    :delay="150"
                    :delay-on-touch-only="true"
                    :animation="150"
                    chosen-class="action-wrapper--chosen"
                    ghost-class="action-wrapper--ghost"
                    @end="onBacklogReorder"
                >
                  <div
                      v-for="action in orderedActions"
                      :key="action.id"
                      class="action-wrapper"
                  >
                    <div class="action-row">
                      <Item
                          :id="action.id"
                          :title="action.title"
                          :loading="completingActionId === action.id"
                          @update="onActionUpdate"
                          @check="() => onCompleteAction(action)"
                          @click="goToActionDetail(action)"
                      >
                        <template #actions>
                          <ActionBtn variant="danger" :loading="trashingActionId === action.id" @click="onTrashAction(action)">✕</ActionBtn>
                        </template>
                      </Item>
                      <a v-if="action.state !== 'BACKLOG'" class="text-footnote action-state-link" @click.stop="goToActionList(action.state)">{{ actionStateLabel(action.state) }}</a>
                    </div>
                  </div>
                </VueDraggable>
              </div>
            </template>
          </div>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="text-body-s fw-semibold detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'description'"
                class="text-body-m detail-section-content"
                :class="{ 'detail-section-content--empty': !project.description }"
                @click="startEdit('description', project.description || '')"
            >{{ project.description || 'Add a description...' }}</p>
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
              <span v-if="project.tags && project.tags.length > 0" class="detail-tags-chips">
                <span v-for="tag in project.tags" :key="tag" class="text-body-s detail-tag-chip">{{ tag }}</span>
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

        <!-- Attachments section -->
        <AttachmentSection v-if="project.id" :entity-type="'project'" :item-id="project.id" />

        <!-- Comments section -->
        <CommentSection v-if="project.id" :entity-type="'project'" :item-id="project.id" />

        <!-- Metadata section -->
        <div class="detail-metadata">
          <span class="detail-metadata-item">
            <span class="text-footnote detail-metadata-label">Created</span>
            <span class="text-footnote detail-metadata-value">{{ formatDate(project.created) }}</span>
          </span>
          <span class="text-footnote detail-metadata-separator">·</span>
          <span class="detail-metadata-item">
            <span class="text-footnote detail-metadata-label">Updated</span>
            <span class="text-footnote detail-metadata-value">{{ formatDate(project.updated) }}</span>
          </span>
        </div>

      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import Dropdown from '../../components/Dropdown.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import TagInput from '../../components/TagInput.vue'
import CommentSection from '../../components/CommentSection.vue'
import AttachmentSection from '../../components/AttachmentSection.vue'
import { projectModel } from '../../scripts/models/projectModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import apiClient from '../../scripts/core/apiClient.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { tagModel } from '../../scripts/models/tagModel.js'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import ReferenceIcon from '../../assets/ReferenceIcon.vue'
import SomedayIcon from '../../assets/SomedayIcon.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
import TriangleLeftIcon from '../../assets/TriangleLeftIcon.vue'
import TriangleRightIcon from '../../assets/TriangleRightIcon.vue'
import ChevronsLeftIcon from '../../assets/ChevronsLeftIcon.vue'
import ChevronsRightIcon from '../../assets/ChevronsRightIcon.vue'
import Item from '../../components/Item.vue'
import Spinner from '../../components/Spinner.vue'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const tagMdl = tagModel()

const {
  error,
  getProject,
  getProjectByPosition,
  updateProject,
  trashProject,
  completeProject,
  getProjectActions,
} = projectModel()

const project = ref(null)
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)
const outcomeInput = ref(null)
const actionLoading = ref(null)
const showMoveDialog = ref(false)
const editTags = ref([])

// Actions state
const actionsLoading = ref(false)
const orderedActions = ref([])
const addInputVisible = ref(false)
const completingActionId = ref(null)
const trashingActionId = ref(null)
const newActionTitle = ref('')
const addingAction = ref(false)
const actionsScrollRef = ref(null)
const quickAddInput = ref(null)
const detailBodyRef = ref(null)

// Auto-hiding scrollbar
const bodyScrolling = ref(false)
const listScrolling = ref(false)
let bodyScrollTimer = null
let listScrollTimer = null

function onBodyScroll() {
  bodyScrolling.value = true
  clearTimeout(bodyScrollTimer)
  bodyScrollTimer = setTimeout(() => { bodyScrolling.value = false }, 1000)
}

function onListScroll() {
  listScrolling.value = true
  clearTimeout(listScrollTimer)
  listScrollTimer = setTimeout(() => { listScrolling.value = false }, 1000)
}

watch(detailBodyRef, (el, oldEl) => {
  if (oldEl) oldEl.removeEventListener('scroll', onBodyScroll)
  if (el) el.addEventListener('scroll', onBodyScroll, { passive: true })
})

watch(actionsScrollRef, (el, oldEl) => {
  if (oldEl) oldEl.removeEventListener('scroll', onListScroll)
  if (el) el.addEventListener('scroll', onListScroll, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(bodyScrollTimer)
  clearTimeout(listScrollTimer)
  detailBodyRef.value?.removeEventListener('scroll', onBodyScroll)
  actionsScrollRef.value?.removeEventListener('scroll', onListScroll)
})

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)
const fromSource = ref(null)

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

// Computed
const isCompleted = computed(() => project.value?.state === 'COMPLETED')
const isSomeday = computed(() => project.value?.state === 'SOMEDAY')
const fromCompleted = computed(() => fromSource.value === 'completed')
const fromSomeday = computed(() => fromSource.value === 'someday')
const fromMixedList = computed(() => fromCompleted.value || fromSomeday.value)
const backLabel = computed(() => {
  if (fromSource.value && FROM_LABELS[fromSource.value]) return FROM_LABELS[fromSource.value]
  if (isCompleted.value) return 'Completed'
  if (isSomeday.value) return 'Someday / Maybe'
  return 'Projects'
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(async () => {
  try {
    fromSource.value = route.query.from || null

    const data = await getProject(route.params.id)
    project.value = { ...data }

    currentPosition.value = Number(route.query.position) || 0
    totalItems.value = Number(route.query.total) || 1

    // Load project actions
    await loadProjectActions()

  } catch {
    toaster.push('Failed to load project')
    router.push({ name: 'projects' })
  } finally {
    pageLoading.value = false
  }
})

function goBack() {
  const mapped = fromSource.value && FROM_ROUTES[fromSource.value]
  if (mapped) {
    router.push({ name: mapped })
  } else if (isCompleted.value) {
    router.push({ name: 'completed' })
  } else if (isSomeday.value) {
    router.push({ name: 'someday' })
  } else {
    router.push({ name: 'projects' })
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
    } else if (field === 'outcome' && outcomeInput.value) {
      outcomeInput.value.focus()
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

  if (field === 'title' && (!newValue || newValue === project.value.title)) {
    editingField.value = null
    return
  }

  if (field === 'description' && newValue === (project.value.description || '')) {
    editingField.value = null
    return
  }

  if (field === 'outcome' && newValue === (project.value.outcome || '')) {
    editingField.value = null
    return
  }

  const oldValue = project.value[field]
  project.value[field] = newValue
  savingField.value = field

  try {
    await updateProject(project.value.id, {
      title: project.value.title,
      description: project.value.description,
      outcome: project.value.outcome
    })
    editingField.value = null
  } catch {
    project.value[field] = oldValue
    toaster.push('Failed to save changes')
    setTimeout(() => {
      if (field === 'title') {
        titleInput.value?.focus()
      } else if (field === 'description') {
        descriptionInput.value?.focus()
      } else if (field === 'outcome') {
        outcomeInput.value?.focus()
      }
    }, 100)
  } finally {
    savingField.value = null
  }
}

function startTagEdit() {
  if (savingField.value) return
  editingField.value = 'tags'
  editTags.value = [...(project.value.tags || [])]
}

async function saveTags() {
  if (editingField.value !== 'tags' || savingField.value) return

  const newTags = [...editTags.value]
  const oldTags = project.value.tags || []

  if (JSON.stringify(newTags) === JSON.stringify(oldTags)) {
    editingField.value = null
    return
  }

  project.value.tags = newTags
  savingField.value = 'tags'

  try {
    await updateProject(project.value.id, {
      title: project.value.title,
      description: project.value.description,
      outcome: project.value.outcome,
      tags: newTags,
    })
    tagMdl.addToCache(newTags)
    editingField.value = null
  } catch {
    project.value.tags = oldTags
    toaster.push('Failed to save tags')
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
    let getByPosition
    if (fromCompleted.value) {
      getByPosition = apiClient.getCompletedByPosition
    } else if (fromSomeday.value) {
      getByPosition = apiClient.getSomedayByPosition
    } else {
      getByPosition = getProjectByPosition
    }
    const data = await getByPosition(position)

    // Mixed-type lists - redirect if type changed
    if (fromMixedList.value && data.type !== 'PROJECT') {
      const query = { position: data.position, total: data.total_items || totalItems.value, from: fromSource.value }
      const name = data.type === 'STUFF' ? 'stuff-detail' : 'action-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    project.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    router.replace({
      name: 'project-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value || undefined }
    })
    // Reload actions for new project
    await loadProjectActions()
  } catch {
    toaster.push('Failed to load project')
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

async function onComplete() {
  const hasActions = orderedActions.value.length > 0
  if (hasActions) {
    const confirmed = await confirm.show({
      title: 'Complete Project',
      message: `This will also complete all active actions in this project. Are you sure?`,
      confirmText: 'Complete',
      cancelText: 'Cancel'
    })
    if (!confirmed) return
  }

  actionLoading.value = 'complete'
  const title = truncateTitle(project.value.title)
  try {
    await completeProject(project.value.id)
    toaster.success(`"${title}" completed`)
    await navigateToNextOrPrev()
  } catch (err) {
    toaster.push(err.message || 'Failed to complete project')
  } finally {
    actionLoading.value = null
  }
}

async function navigateToNextOrPrev() {
  const newTotal = totalItems.value - 1
  let backRoute = (fromSource.value && FROM_ROUTES[fromSource.value]) || 'projects'
  if (backRoute === 'projects') {
    // State-based fallback
    if (isCompleted.value) backRoute = 'completed'
    else if (isSomeday.value) backRoute = 'someday'
  }

  if (newTotal <= 0) {
    router.push({ name: backRoute })
    return
  }

  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    let getByPosition
    if (fromCompleted.value) {
      getByPosition = apiClient.getCompletedByPosition
    } else if (fromSomeday.value) {
      getByPosition = apiClient.getSomedayByPosition
    } else {
      getByPosition = getProjectByPosition
    }
    const data = await getByPosition(nextPos)

    // Mixed-type lists - redirect if type changed
    if (fromMixedList.value && data.type !== 'PROJECT') {
      const query = { position: data.position, total: data.total_items ?? newTotal, from: fromSource.value }
      const name = data.type === 'STUFF' ? 'stuff-detail' : 'action-detail'
      router.replace({ name, params: { id: data.id }, query })
      return
    }

    project.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'project-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value, from: fromSource.value || undefined }
    })
    // Reload actions for new project
    await loadProjectActions()
  } catch {
    router.push({ name: backRoute })
  }
}

async function onTrash() {
  const hasActions = orderedActions.value.length > 0
  const message = hasActions
    ? `This will also move all actions in this project to trash. Are you sure?`
    : `Are you sure you want to move "${project.value.title}" to trash?`

  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  actionLoading.value = 'trash'
  try {
    await trashProject(project.value.id)
    toaster.success(`"${truncateTitle(project.value.title)}" moved to trash`)
    if (isSomeday.value) {
      router.push({ name: 'someday' })
    } else {
      await navigateToNextOrPrev()
    }
  } catch (err) {
    toaster.push(err.message || 'Failed to move project to trash')
  } finally {
    actionLoading.value = null
  }
}

async function onUndo() {
  actionLoading.value = 'undo'
  const title = truncateTitle(project.value.title)
  try {
    await apiClient.uncompleteProject(project.value.id)
    statsModel().refreshStats()
    toaster.success(`"${title}" restored to projects`)
    router.push({ name: 'completed' })
  } catch (err) {
    toaster.push(err.message || 'Failed to restore project')
  } finally {
    actionLoading.value = null
  }
}

async function onActivate() {
  actionLoading.value = 'activate'
  const title = truncateTitle(project.value.title)
  try {
    await apiClient.activateProject(project.value.id)
    statsModel().refreshStats()
    toaster.success(`"${title}" moved to Projects`)
    router.push({ name: 'someday' })
  } catch (err) {
    toaster.push(err.message || 'Failed to activate project')
  } finally {
    actionLoading.value = null
  }
}

async function onMoveTo(target) {
  showMoveDialog.value = false

  const stateLabels = {
    ACTION: 'Next Actions',
    REFERENCE: 'Reference',
    SOMEDAY: 'Someday'
  }

  if (target === 'ACTION') {
    if (orderedActions.value.length > 1) {
      const confirmed = await confirm.show({
        title: 'Convert to Action',
        message: `This will trash all backlog actions in this project. Continue?`,
        confirmText: 'Convert',
        cancelText: 'Cancel'
      })
      if (!confirmed) return
    }

    actionLoading.value = 'move'
    try {
      await apiClient.transformProjectToAction(project.value.id)
      statsModel().refreshStats()
      toaster.success(`"${truncateTitle(project.value.title)}" converted to action`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to convert to action')
    } finally {
      actionLoading.value = null
    }
    return
  }

  if (target === 'REFERENCE') {
    if (orderedActions.value.length > 0) {
      const confirmed = await confirm.show({
        title: 'Convert to Reference',
        message: `This will convert the project and all its actions to a reference file. Continue?`,
        confirmText: 'Convert',
        cancelText: 'Cancel'
      })
      if (!confirmed) return
    }

    actionLoading.value = 'move'
    try {
      await apiClient.transformProjectToFile(project.value.id)
      statsModel().refreshStats()
      toaster.success(`"${truncateTitle(project.value.title)}" moved to Reference`)
      await navigateToNextOrPrev()
    } catch (err) {
      toaster.push(err.message || 'Failed to move to Reference')
    } finally {
      actionLoading.value = null
    }
    return
  }

  if (target === 'SOMEDAY') {
    actionLoading.value = 'move'
    const oldState = project.value.state
    project.value.state = 'SOMEDAY'
    const hasActions = orderedActions.value.length > 0

    try {
      await apiClient.somedayProject(project.value.id)
      statsModel().refreshStats()
      const msg = hasActions
        ? `"${truncateTitle(project.value.title)}" moved to Someday. Active actions shelved.`
        : `"${truncateTitle(project.value.title)}" moved to Someday`
      toaster.success(msg)
      await navigateToNextOrPrev()
    } catch (err) {
      project.value.state = oldState
      toaster.push(err.message || 'Failed to move project')
    } finally {
      actionLoading.value = null
    }
  }
}

const ACTION_STATE_LABELS = {
  NEXT: 'Next Action',
  TODAY: 'Today',
  WAITING: 'Waiting For',
  CALENDAR: 'Calendar',
}

const ACTION_STATE_ROUTES = {
  NEXT: 'next',
  TODAY: 'today',
  WAITING: 'waiting-for',
  CALENDAR: 'calendar',
}

function actionStateLabel(state) {
  return ACTION_STATE_LABELS[state] || state
}

function goToActionList(state) {
  const name = ACTION_STATE_ROUTES[state]
  if (name) router.push({ name })
}

// ── Project Actions functions ──

async function loadProjectActions() {
  if (!project.value?.id) return

  actionsLoading.value = true
  try {
    const data = await getProjectActions(project.value.id)
    const actions = Array.isArray(data) ? data : (data.items || [])
    orderedActions.value = actions.sort((a, b) => a.backlog_position - b.backlog_position)
  } catch {
    toaster.push('Failed to load project actions')
  } finally {
    actionsLoading.value = false
  }
}

async function onActionUpdate(actionId, data) {
  try {
    await apiClient.updateAction(actionId, data)
    const idx = orderedActions.value.findIndex(a => a.id === actionId)
    if (idx >= 0) orderedActions.value[idx].title = data.title
  } catch {
    toaster.push('Failed to update action')
    await loadProjectActions()
  }
}

async function onCompleteAction(action) {
  if (!action) return

  completingActionId.value = action.id
  const title = truncateTitle(action.title)

  try {
    await apiClient.completeAction(action.id)
    statsModel().refreshStats()
    toaster.success(`"${title}" completed`)
    await loadProjectActions()
  } catch {
    toaster.push('Failed to complete action')
  } finally {
    completingActionId.value = null
  }
}

function goToActionDetail(act) {
  router.push({
    name: 'action-detail',
    params: { id: act.id },
    query: { from: 'project', project_id: project.value.id, project_title: project.value.title }
  })
}

async function onTrashAction(action) {
  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: `Are you sure you want to move "${action.title}" to trash?`,
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  trashingActionId.value = action.id
  try {
    await apiClient.trashAction(action.id)
    statsModel().refreshStats()
    toaster.success(`"${truncateTitle(action.title)}" moved to trash`)
    if (action.id === orderedActions.value[0]?.id) {
      await loadProjectActions()
    } else {
      orderedActions.value = orderedActions.value.filter(a => a.id !== action.id)
    }
  } catch {
    toaster.push('Failed to move action to trash')
  } finally {
    trashingActionId.value = null
  }
}

async function onBacklogReorder(evt) {
  if (evt.oldIndex === evt.newIndex) return

  const movedAction = orderedActions.value[evt.newIndex]
  if (!movedAction) return

  try {
    await apiClient.moveProjectAction(movedAction.id, evt.newIndex)
    if (evt.oldIndex === 0 || evt.newIndex === 0) {
      await loadProjectActions()
    }
  } catch {
    toaster.push('Failed to reorder actions')
    await loadProjectActions()
  }
}

function focusAddInput() {
  addInputVisible.value = true
  nextTick(() => {
    quickAddInput.value?.focus()
  })
}

function onAddInputBlur() {
  if (orderedActions.value.length === 0 && !newActionTitle.value.trim()) {
    addInputVisible.value = false
  }
}

async function onAddAction() {
  const title = newActionTitle.value.trim()
  if (!title || !project.value?.id) return

  addingAction.value = true
  try {
    await apiClient.addAction({
      title,
      project_id: project.value.id,
      state: 'NEXT',
    })
    await loadProjectActions()
    newActionTitle.value = ''
    statsModel().refreshStats()
    toaster.success(`"${truncateTitle(title)}" added`)
    nextTick(() => {
      if (actionsScrollRef.value) {
        actionsScrollRef.value.scrollTop = actionsScrollRef.value.scrollHeight
      }
      quickAddInput.value?.focus()
    })
  } catch {
    toaster.push('Failed to add action')
  } finally {
    addingAction.value = false
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

.detail-meta-link {
  color: var(--color-link-text);
  cursor: pointer;
}

.detail-meta-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
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
  inset: 0;
  margin: auto;
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
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.detail-body.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.detail-body::-webkit-scrollbar {
  width: 4px;
}

.detail-body::-webkit-scrollbar-track {
  background: transparent;
}

.detail-body::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.detail-body.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
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
  left: 14px;
  width: 22px;
  height: 22px;
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

/* ── Action buttons ── */
.detail-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px 16px 50px; /* 42px icon + 8px gap */
}

/* ── Section areas (outcome, description) ── */
.detail-section-area {
  padding: 12px 24px 12px 50px; /* 42px icon + 8px gap */
  border-bottom: 1px solid var(--color-border-light);
}

.detail-section-area--no-border {
  border-bottom: none;
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


/* ── Next Action section ── */
.next-action-wrapper {
  margin-top: 4px;
}

.next-action-loading {
  padding: 12px 0;
}

.next-action-prompt {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-warning-light);
  border-left: 3px solid var(--color-warning);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.next-action-prompt:hover {
  background: var(--color-warning-light);
}

.next-action-prompt__icon {
  width: 24px;
  height: 24px;
  padding: 4px;
  box-sizing: border-box;
  flex-shrink: 0;
  color: var(--color-warning);
}

.next-action-prompt__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.next-action-prompt__text strong {
  color: var(--color-text-primary);
}

.next-action-prompt__text span {
  color: var(--color-text-secondary);
}

/* ── Action list ── */
.actions-list-scroll {
  max-height: 630px;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg-primary);
  border-radius: 4px;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.actions-list-scroll.scrolling {
  scrollbar-color: var(--color-border-light) transparent;
}

.actions-list-scroll::-webkit-scrollbar {
  width: 4px;
}

.actions-list-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.actions-list-scroll::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

.actions-list-scroll.scrolling::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.action-wrapper {
  cursor: grab;
  user-select: none;
  -webkit-touch-callout: none;
}

.action-wrapper:active {
  cursor: grabbing;
}

.action-wrapper--chosen .item {
  background: var(--color-bg-hover);
}

.action-wrapper--ghost .item {
  background: var(--color-btn-secondary-hover);
}

.action-wrapper--ghost .item > * {
  opacity: 0;
}

.action-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-primary);
  transition: background 0.15s ease;
}

@media (hover: hover) and (pointer: fine) {
  .action-row:hover {
    background: var(--color-bg-hover);
  }
}

.action-row :deep(.item) {
  flex: 1;
  min-width: 0;
  border-bottom: none;
}

.action-row :deep(.item:hover) {
  background: transparent;
}

.action-state-link {
  color: var(--color-text-tertiary);
  cursor: pointer;
  white-space: nowrap;
  padding-right: 16px;
  flex-shrink: 0;
}

.action-state-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

/* ── Actions quick-add ── */
.actions-quick-add--top {
  display: flex;
  align-items: stretch;
  gap: 8px;
  margin-bottom: 8px;
}

.actions-quick-add-input {
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 10px 12px;
  outline: none;
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
}

.actions-quick-add-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.actions-quick-add-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions-quick-add-input::placeholder {
  color: var(--color-text-tertiary);
}

.actions-quick-add-btn {
  flex-shrink: 0;
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
}
</style>
