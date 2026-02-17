<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="detail-back-link" @click="goBack">&lt;</a>
          <span class="detail-meta-link" @click="goBack">{{ backLabel }}</span>
        </div>
        <div v-if="project" class="detail-header-right">
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
      <div v-else-if="project" class="detail-body">

        <!-- Title area -->
        <div class="detail-title-area">
          <ProjectsIcon class="detail-type-icon" />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <span class="detail-spinner"></span>
            </div>
            <h2
                class="detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title', 'detail-title--completed': isCompleted }"
                @click="startEdit('title', project.title)"
            >{{ project.title }}</h2>
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
                variant="ghost"
                size="sm"
                :loading="actionLoading === 'complete'"
                @click="onComplete"
            >
              Complete
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
            <button class="dropdown-item" @click="onMoveToSomeday"><SomedayIcon class="dropdown-item-icon" /> Someday</button>
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
          <label class="detail-section-label">Outcome</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'outcome'"
                class="detail-section-content"
                :class="{ 'detail-section-content--empty': !project.outcome }"
                @click="startEdit('outcome', project.outcome || '')"
            >{{ project.outcome || 'What does done look like?' }}</p>
            <textarea
                v-else
                ref="outcomeInput"
                v-model="editValue"
                class="detail-section-textarea"
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
                  variant="ghost"
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
          <div class="next-action-header">
            <label class="detail-section-label">Next Action</label>
            <button
                v-if="orderedActions.length > 0 || !actionsLoading"
                class="next-action-expand-btn"
                @click="actionsExpanded = !actionsExpanded"
            >
              {{ actionsExpanded ? '▲' : '▼' }} {{ backlogItems.length > 0 ? `+${backlogItems.length}` : '' }}
            </button>
          </div>
          <div class="next-action-wrapper">
            <div v-if="actionsLoading" class="next-action-loading">
              <span class="detail-spinner-sm"></span>
            </div>
            <template v-else>
              <!-- Collapsed: Next action card -->
              <template v-if="!actionsExpanded">
                <div v-if="nextAction" class="next-action-card" @click="goToActionDetail(nextAction)">
                  <input
                      type="checkbox"
                      class="next-action-checkbox"
                      :checked="false"
                      :disabled="completingActionId === nextAction.id"
                      @click.stop
                      @change="onCompleteNextAction"
                  />
                  <span
                      v-if="editingActionId !== nextAction.id"
                      class="next-action-title"
                      @click.stop="startEditAction(nextAction)"
                  >{{ nextAction.title }}</span>
                  <span v-else class="action-input-wrapper" @click.stop>
                    <span ref="actionInputMeasure" class="action-input-measure">{{ editActionValue || ' ' }}</span>
                    <input
                        ref="actionTitleInput"
                        v-model="editActionValue"
                        class="action-input-auto"
                        :style="{ width: actionInputWidth + 'px' }"
                        @keyup.enter="saveActionTitle(nextAction.id)"
                        @keyup.esc="cancelEditAction"
                        @blur="saveActionTitle(nextAction.id)"
                    />
                  </span>
                  <div class="next-action-actions" @click.stop>
                    <ActionBtn variant="primary" @click="goToNextActions">→ Next</ActionBtn>
                  </div>
                  <span v-if="completingActionId === nextAction.id" class="next-action-spinner"></span>
                </div>
                <p v-else class="detail-section-content detail-section-content--empty" @click="onExpandAndFocus">Add a next action...</p>
              </template>

              <!-- Expanded: full action list -->
              <div v-else class="actions-expanded">
                <div ref="actionsScrollRef" class="actions-list-scroll">
                  <VueDraggable
                      v-if="orderedActions.length > 0"
                      v-model="orderedActions"
                      :delay="100"
                      :animation="150"
                      chosen-class="action-item--chosen"
                      ghost-class="action-item--ghost"
                      @end="onBacklogReorder"
                  >
                    <div
                        v-for="(action, index) in orderedActions"
                        :key="action.id"
                        :class="index === 0 ? 'next-action-card next-action-card--in-list' : 'action-item'"
                        @click="goToActionDetail(action)"
                    >
                      <!-- First item: next action card style -->
                      <template v-if="index === 0">
                        <input
                            type="checkbox"
                            class="next-action-checkbox"
                            :checked="false"
                            :disabled="completingActionId === action.id"
                            @click.stop
                            @change="onCompleteNextAction"
                        />
                        <span
                            v-if="editingActionId !== action.id"
                            class="next-action-title"
                            @click.stop="startEditAction(action)"
                        >{{ action.title }}</span>
                        <span v-else class="action-input-wrapper" @click.stop>
                          <span ref="actionInputMeasure" class="action-input-measure">{{ editActionValue || ' ' }}</span>
                          <input
                              ref="actionTitleInput"
                              v-model="editActionValue"
                              class="action-input-auto"
                              :style="{ width: actionInputWidth + 'px' }"
                              @keyup.enter="saveActionTitle(action.id)"
                              @keyup.esc="cancelEditAction"
                              @blur="saveActionTitle(action.id)"
                          />
                        </span>
                        <div class="next-action-actions" @click.stop>
                          <ActionBtn variant="primary" @click="goToNextActions">→ Next</ActionBtn>
                          <ActionBtn variant="danger" :loading="trashingActionId === action.id" @click="onTrashAction(action)">✕</ActionBtn>
                        </div>
                        <span v-if="completingActionId === action.id" class="next-action-spinner"></span>
                      </template>
                      <!-- Other items: regular backlog style -->
                      <template v-else>
                        <span
                            v-if="editingActionId !== action.id"
                            class="action-title"
                            @click.stop="startEditAction(action)"
                        >{{ action.title }}</span>
                        <span v-else class="action-input-wrapper" @click.stop>
                          <span ref="actionInputMeasure" class="action-input-measure">{{ editActionValue || ' ' }}</span>
                          <input
                              ref="actionTitleInput"
                              v-model="editActionValue"
                              class="action-input-auto"
                              :style="{ width: actionInputWidth + 'px' }"
                              @keyup.enter="saveActionTitle(action.id)"
                              @keyup.esc="cancelEditAction"
                              @blur="saveActionTitle(action.id)"
                          />
                        </span>
                        <div class="action-item-actions" @click.stop>
                          <ActionBtn variant="danger" :loading="trashingActionId === action.id" @click="onTrashAction(action)">✕</ActionBtn>
                        </div>
                      </template>
                    </div>
                  </VueDraggable>
                </div>

                <!-- Quick-add at bottom -->
                <div class="actions-quick-add">
                  <input
                      ref="quickAddInput"
                      v-model="newActionTitle"
                      class="actions-quick-add-input"
                      type="text"
                      placeholder="+ Add action..."
                      :disabled="addingAction"
                      @keydown.enter="onAddAction"
                  />
                  <span v-if="addingAction" class="actions-quick-add-spinner"></span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <p
                v-if="editingField !== 'description'"
                class="detail-section-content"
                :class="{ 'detail-section-content--empty': !project.description }"
                @click="startEdit('description', project.description || '')"
            >{{ project.description || 'Add a description...' }}</p>
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
            <span class="detail-metadata-value">{{ formatDate(project.created) }}</span>
          </span>
          <span class="detail-metadata-separator">·</span>
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Updated</span>
            <span class="detail-metadata-value">{{ formatDate(project.updated) }}</span>
          </span>
        </div>

      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import Dropdown from '../components/Dropdown.vue'
import ActionBtn from '../components/ActionBtn.vue'
import { projectModel } from '../scripts/projectModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import apiClient from '../scripts/apiClient.js'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()

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

// Actions state
const actionsLoading = ref(false)
const orderedActions = ref([])
const actionsExpanded = ref(false)
const editingActionId = ref(null)
const editActionValue = ref('')
const actionTitleInput = ref(null)
const actionInputMeasure = ref(null)
const actionInputWidth = ref(50)
const completingActionId = ref(null)
const trashingActionId = ref(null)
const newActionTitle = ref('')
const addingAction = ref(false)
const actionsScrollRef = ref(null)
const quickAddInput = ref(null)

// Navigation state
const currentPosition = ref(0)
const totalItems = ref(1)
const navigating = ref(false)

// Computed
const isCompleted = computed(() => project.value?.state === 'COMPLETED')
const nextAction = computed(() => orderedActions.value[0] || null)
const backlogItems = computed(() => orderedActions.value.slice(1))
const isSomeday = computed(() => project.value?.state === 'SOMEDAY')
const backLabel = computed(() => {
  if (isCompleted.value) return 'Completed'
  if (isSomeday.value) return 'Someday / Maybe'
  return 'Projects'
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

watch(editActionValue, () => {
  nextTick(() => {
    const measure = Array.isArray(actionInputMeasure.value)
      ? actionInputMeasure.value[0]
      : actionInputMeasure.value
    if (measure) {
      actionInputWidth.value = Math.max(50, measure.offsetWidth + 2)
    }
  })
})

onMounted(async () => {
  try {
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
  if (isCompleted.value) {
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
    const data = await getProjectByPosition(position)
    project.value = { ...data }
    currentPosition.value = data.position
    if (typeof data.total_items === 'number') {
      totalItems.value = data.total_items
    }
    router.replace({
      name: 'project-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value }
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
  const confirmed = await confirm.show({
    title: 'Complete Project',
    message: `Are you sure you want to mark "${project.value.title}" as complete?`,
    confirmText: 'Complete',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

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
  if (newTotal <= 0) {
    router.push({ name: 'projects' })
    return
  }

  const nextPos = currentPosition.value >= newTotal ? newTotal - 1 : currentPosition.value

  try {
    const data = await getProjectByPosition(nextPos)
    project.value = { ...data }
    currentPosition.value = data.position
    totalItems.value = data.total_items ?? newTotal
    router.replace({
      name: 'project-detail',
      params: { id: data.id },
      query: { position: data.position, total: totalItems.value }
    })
  } catch {
    router.push({ name: 'projects' })
  }
}

async function onTrash() {
  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: `Are you sure you want to move "${project.value.title}" to trash?`,
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
    toaster.success(`"${title}" moved to Projects`)
    router.push({ name: 'someday' })
  } catch (err) {
    toaster.push(err.message || 'Failed to activate project')
  } finally {
    actionLoading.value = null
  }
}

async function onMoveToSomeday() {
  showMoveDialog.value = false
  actionLoading.value = 'move'
  const title = truncateTitle(project.value.title)
  const oldState = project.value.state
  project.value.state = 'SOMEDAY'

  try {
    await apiClient.somedayProject(project.value.id)
    toaster.success(`"${title}" moved to Someday`)
    await navigateToNextOrPrev()
  } catch (err) {
    project.value.state = oldState
    toaster.push(err.message || 'Failed to move project')
  } finally {
    actionLoading.value = null
  }
}

// ── Project Actions functions ──

async function loadProjectActions() {
  if (!project.value?.id) return

  actionsLoading.value = true
  try {
    const actions = await getProjectActions(project.value.id)
    const next = actions.find(a => a.state === 'NEXT')
    const backlog = actions.filter(a => a.state === 'BACKLOG')

    // If no NEXT action but there are backlog items, treat first backlog as next action
    if (!next && backlog.length > 0) {
      orderedActions.value = backlog
    } else if (next) {
      orderedActions.value = [next, ...backlog]
    } else {
      orderedActions.value = []
    }
  } catch {
    toaster.push('Failed to load project actions')
  } finally {
    actionsLoading.value = false
  }
}

function startEditAction(action) {
  actionInputWidth.value = 50
  editingActionId.value = action.id
  editActionValue.value = action.title
  nextTick(() => {
    const measure = Array.isArray(actionInputMeasure.value)
      ? actionInputMeasure.value[0]
      : actionInputMeasure.value
    if (measure) {
      actionInputWidth.value = Math.max(50, measure.offsetWidth + 2)
    }
    const input = Array.isArray(actionTitleInput.value)
      ? actionTitleInput.value[0]
      : actionTitleInput.value
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function cancelEditAction() {
  editingActionId.value = null
  editActionValue.value = ''
}

async function saveActionTitle(actionId) {
  if (editingActionId.value !== actionId) return

  const newTitle = editActionValue.value.trim()
  const action = orderedActions.value.find(a => a.id === actionId)

  if (!newTitle || newTitle === action?.title) {
    editingActionId.value = null
    return
  }

  try {
    await apiClient.updateAction(actionId, { title: newTitle })
    const idx = orderedActions.value.findIndex(a => a.id === actionId)
    if (idx >= 0) orderedActions.value[idx].title = newTitle
    editingActionId.value = null
  } catch {
    toaster.push('Failed to update action')
  }
}

async function onCompleteNextAction() {
  if (!nextAction.value) return

  completingActionId.value = nextAction.value.id
  const title = truncateTitle(nextAction.value.title)

  try {
    await apiClient.completeAction(nextAction.value.id)
    toaster.success(`"${title}" completed`)
    // Reload actions - backend auto-promotes first backlog item
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

function goToNextActions() {
  router.push({ name: 'next' })
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
    toaster.success(`"${truncateTitle(action.title)}" moved to trash`)
    if (action.id === nextAction.value?.id) {
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

  // If position 0 changed, update the project's next action
  if (evt.oldIndex === 0 || evt.newIndex === 0) {
    const newNextAction = orderedActions.value[0]
    if (!newNextAction) return

    try {
      await updateProject(project.value.id, {
        title: project.value.title,
        description: project.value.description,
        outcome: project.value.outcome,
        next_action_id: newNextAction.id,
      })
    } catch {
      toaster.push('Failed to update next action')
      await loadProjectActions()
    }
  }
}

function onExpandAndFocus() {
  actionsExpanded.value = true
  nextTick(() => {
    quickAddInput.value?.focus()
  })
}

async function onAddAction() {
  const title = newActionTitle.value.trim()
  if (!title || !project.value?.id) return

  addingAction.value = true
  try {
    await apiClient.addAction({
      title,
      project_id: project.value.id
    })
    await loadProjectActions()
    newActionTitle.value = ''
    toaster.success(`"${truncateTitle(title)}" added`)
    // Scroll to bottom and keep focus for next entry
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

.detail-meta-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-link-text);
  cursor: pointer;
}

.detail-meta-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
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

.detail-spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Next Action section ── */
.next-action-wrapper {
  margin-top: 4px;
}

.next-action-loading {
  padding: 12px 0;
}

.next-action-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
}

.next-action-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-action);
  flex-shrink: 0;
}

.next-action-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.next-action-title:hover {
  text-decoration: underline;
}

/* ── Auto-sizing action input (matches Item component) ── */
.action-input-wrapper {
  position: relative;
  display: inline-block;
  min-width: 0;
  max-width: 100%;
}

.action-input-measure {
  position: absolute;
  visibility: hidden;
  white-space: pre;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
}

.action-input-auto {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-action);
  padding: 0;
  margin: 0;
  outline: none;
  min-width: 50px;
  max-width: 100%;
}

.next-action-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.next-action-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -10px;
  margin-left: -10px;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  background: var(--color-bg-secondary);
}

.next-action-empty {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-tertiary);
  font-style: italic;
  margin: 0;
  padding: 8px 0;
}



/* ── Next Action header with expand button ── */
.next-action-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.next-action-expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
}

.next-action-expand-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}


/* ── Expanded actions area ── */
.actions-expanded {
  margin-top: 8px;
}

.actions-list-scroll {
  max-height: 420px;
  overflow-y: auto;
  overflow-x: hidden;
}

.next-action-card--in-list {
  cursor: grab;
  user-select: none;
  border-radius: 6px 6px 0 0;
}

.next-action-card--in-list:active {
  cursor: grabbing;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  transition: background 0.15s ease;
  cursor: grab;
  user-select: none;
}

.action-item:first-of-type {
  border-top: 1px solid var(--color-border-light);
}

.action-item:hover {
  background: var(--color-bg-hover);
}

.action-item:active {
  cursor: grabbing;
}

.action-item--chosen {
  background: var(--color-bg-hover);
}

.action-item--ghost {
  background: var(--color-btn-ghost-hover);
  opacity: 0.5;
}

.action-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.action-title:hover {
  text-decoration: underline;
}


.action-item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.action-item:hover .action-item-actions {
  opacity: 1;
}

@media (hover: none) and (pointer: coarse) {
  .action-item-actions {
    opacity: 1;
  }
}

/* ── Actions quick-add ── */
.actions-quick-add {
  position: relative;
  margin-bottom: 8px;
}

.actions-quick-add-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 10px 12px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.actions-quick-add-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.actions-quick-add-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions-quick-add-input::placeholder {
  color: var(--color-text-tertiary);
}

.actions-quick-add-spinner {
  position: absolute;
  top: 50%;
  right: 12px;
  margin-top: -8px;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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
