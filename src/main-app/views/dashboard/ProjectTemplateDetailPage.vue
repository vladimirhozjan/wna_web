<template>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="text-body-m detail-back-link" @click="goToList">&lt;</a>
          <span class="text-body-s detail-meta-link" @click="goToList">Templates</span>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="pageLoading" class="detail-loading">
        <Spinner />
      </div>

      <!-- Not found state -->
      <div v-else-if="notFound" class="detail-not-found" data-testid="template-not-found">
        <EmptyState
            :icon="TextFileIcon"
            title="This template is no longer here"
            text="It may have been deleted."
            buttonText="Go to templates"
            @action="goToList"
        />
      </div>

      <!-- Content -->
      <div v-else-if="template" class="detail-body">

        <!-- Title area -->
        <div class="detail-title-area">
          <TextFileIcon class="detail-type-icon" />
          <div class="detail-title-wrapper">
            <div v-if="savingName" class="detail-section-overlay">
              <Spinner />
            </div>
            <h2
                class="text-h2 detail-title"
                :class="{ 'detail-title--hidden': editingName }"
                data-testid="template-title"
                @click="startRename"
            >{{ editingName ? (nameValue || ' ') : template.name }}</h2>
            <textarea
                v-if="editingName"
                ref="nameInput"
                v-model="nameValue"
                class="text-h2 detail-title-input"
                :disabled="savingName"
                @keydown.enter.prevent="saveName"
                @keyup.esc="cancelRename"
                @blur="saveName"
                @input="autoResizeName"
                rows="1"
            ></textarea>
          </div>
        </div>

        <!-- Action buttons -->
        <div ref="detailActionsRef" class="detail-actions">
          <Btn
              v-if="visibleActions.includes('new')"
              variant="primary"
              size="sm"
              data-testid="template-new-project-btn"
              @click="openNewProject"
          >New project</Btn>
          <Btn
              v-if="visibleActions.includes('add')"
              variant="secondary"
              size="sm"
              data-testid="template-add-to-project-btn"
              @click="openAddToProject"
          >Add to project</Btn>
          <Btn
              v-if="visibleActions.includes('delete')"
              variant="ghost-danger"
              size="sm"
              :loading="deleting"
              data-testid="template-delete-btn"
              @click="onDeleteTemplate"
          >Delete</Btn>
          <Dropdown v-if="overflowActions.length" title="More">
            <template #trigger>
              <Btn variant="icon" size="sm" title="More" data-testid="detail-more-menu"><MoreIcon class="detail-more-icon" /></Btn>
            </template>
            <template #default="{ close }">
              <button class="dropdown-item dropdown-item--danger" :disabled="deleting" data-testid="template-delete-btn" @click="close(); onDeleteTemplate()">Delete</button>
            </template>
          </Dropdown>
        </div>

        <!-- Actions -->
        <div class="detail-section-area detail-section-area--no-border">
          <label class="text-body-s fw-semibold detail-section-label">Actions</label>
          <div class="actions-quick-add actions-quick-add--top">
            <input
                ref="addInput"
                v-model="newActionTitle"
                class="text-body-m actions-quick-add-input"
                type="text"
                placeholder="Add action..."
                :disabled="addingAction"
                data-testid="template-action-input"
                @keydown.enter="onAddAction"
            />
            <Btn
                variant="primary"
                size="sm"
                class="actions-quick-add-btn"
                :disabled="!newActionTitle.trim() || addingAction"
                :loading="addingAction"
                data-testid="template-action-add-btn"
                @mousedown.prevent
                @click="onAddAction"
            >Add</Btn>
          </div>

          <div ref="listRef" class="actions-list-scroll">
            <VueDraggable
                v-model="template.actions"
                :delay="LONG_PRESS_MS"
                :delay-on-touch-only="true"
                :animation="150"
                :disabled="!!editingDescId"
                chosen-class="action-wrapper--chosen"
                ghost-class="action-wrapper--ghost"
                @end="onDragEnd"
            >
              <div
                  v-for="(action, index) in template.actions"
                  :key="action.id"
                  class="action-wrapper"
                  data-testid="template-action-row"
                  :data-id="action.id"
              >
                <div class="action-row">
                  <Item
                      :id="action.id"
                      :title="action.title"
                      :no-checkbox="true"
                      :loading="busyActionId === action.id"
                      @update="onActionTitle"
                      @click="openDescription(action)"
                  >
                    <template #prefix>
                      <span v-if="index === 0" class="action-state-icon" title="Becomes the Next Action" role="img" aria-label="Becomes the Next Action" data-testid="template-action-next-icon"><NextIcon /></span>
                      <span v-else class="action-state-icon"></span>
                    </template>
                    <template v-if="action.description" #subtitle>
                      <span class="text-body-s color-text-secondary action-description-preview">{{ firstLine(action.description) }}</span>
                    </template>
                    <template #actions>
                      <ActionBtn variant="primary" class="action-description-btn" title="Description" data-testid="template-action-description-btn" @click="openDescription(action)"><DescriptionIcon /></ActionBtn>
                      <ActionBtn variant="danger" data-testid="template-action-delete" @click="onDeleteAction(action)" />
                    </template>
                  </Item>
                </div>
                <div v-if="editingDescId === action.id" class="action-description-editor">
                  <textarea
                      ref="descInput"
                      v-model="descValue"
                      class="text-body-m detail-section-textarea"
                      placeholder="Add a description..."
                      :disabled="savingDesc"
                      data-testid="template-description-input"
                      @keyup.esc="closeDescription"
                      @blur="saveDescription"
                      rows="2"
                  ></textarea>
                  <div class="detail-section-actions">
                    <Btn
                        variant="primary"
                        size="sm"
                        :disabled="savingDesc"
                        :loading="savingDesc"
                        data-testid="template-description-save"
                        @mousedown.prevent
                        @click="saveDescription"
                    >Save</Btn>
                    <Btn
                        variant="secondary"
                        size="sm"
                        :disabled="savingDesc"
                        @mousedown.prevent
                        @click="closeDescription"
                    >Cancel</Btn>
                  </div>
                </div>
              </div>
            </VueDraggable>
          </div>
        </div>

      </div>

    </div>

    <!-- New project dialog -->
    <Modal :visible="newProject.visible" title="New project" @close="closeNewProject">
      <div class="np" data-testid="new-project-dialog">
        <Inpt
            v-model="newProject.name"
            type="text"
            placeholder="Project name"
            :disabled="newProject.creating"
            data-testid="new-project-name"
            @keyup.enter="onCreateProject"
        />
        <Inpt
            ref="outcomeInput"
            v-model="newProject.outcome"
            type="text"
            placeholder="Outcome"
            :footer="OUTCOME_HELPER"
            :disabled="newProject.creating"
            data-testid="new-project-outcome"
            @keyup.enter="onCreateProject"
        />
        <p class="text-footnote color-text-secondary np-note">The first action becomes the Next Action. The rest go to the backlog.</p>
        <p v-if="newProject.error" class="text-body-s color-text-error np-error" data-testid="new-project-error">{{ newProject.error }}</p>
      </div>
      <template #actions>
        <Btn variant="secondary" size="sm" :disabled="newProject.creating" @click="closeNewProject">Cancel</Btn>
        <Btn
            variant="primary"
            size="sm"
            :disabled="!canCreateProject"
            :loading="newProject.creating"
            data-testid="new-project-create"
            @click="onCreateProject"
        >Create project</Btn>
      </template>
    </Modal>

    <!-- Add to project dialog -->
    <Modal :visible="addTo.visible" title="Add to project" :fullscreen-mobile="true" @close="closeAddToProject">
      <div class="ap" data-testid="add-to-project-dialog">
        <p class="text-body-s color-text-secondary ap-intro">The actions go to the end of the backlog. The Next Action stays as it is.</p>

        <div v-if="addTo.loading" class="ap-state"><Spinner /></div>

        <div v-else-if="addTo.loadError" class="ap-state">
          <span class="text-body-s color-text-secondary">Couldn't load your projects.</span>
          <Btn variant="secondary" size="sm" data-testid="add-to-project-retry" @click="loadTargets">Retry</Btn>
        </div>

        <div v-else-if="addTo.targets.length === 0" class="ap-state" data-testid="add-to-project-empty">
          <span class="text-body-s color-text-secondary">You have no active projects to add these actions to.</span>
          <Btn variant="primary" size="sm" data-testid="add-to-project-new-instead" @click="onNewInstead">New project instead</Btn>
        </div>

        <template v-else>
          <Inpt
              v-if="addTo.targets.length > SEARCH_MIN"
              v-model="addTo.search"
              type="text"
              placeholder="Search projects"
              class="ap-search"
              data-testid="add-to-project-search"
          />
          <p v-if="filteredTargets.length === 0" class="text-body-s color-text-secondary ap-no-match">No projects match your search.</p>
          <div v-else class="ap-list">
            <button
                v-for="t in filteredTargets"
                :key="t.id"
                type="button"
                class="ap-row"
                :disabled="!!addTo.addingId"
                data-testid="add-to-project-target"
                :data-id="t.id"
                @click="onPickTarget(t)"
            >
              <span class="text-body-m ap-title">{{ t.title }}</span>
              <Spinner v-if="addTo.addingId === t.id" :size="18" />
              <Badge v-else-if="t.shared" type="primary" label="Shared" />
            </button>
          </div>
        </template>
      </div>
      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeAddToProject">Cancel</Btn>
      </template>
    </Modal>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { LONG_PRESS_MS } from '../../scripts/core/swipe.js'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import Item from '../../components/Item.vue'
import Modal from '../../components/Modal.vue'
import Badge from '../../components/Badge.vue'
import Dropdown from '../../components/Dropdown.vue'
import Spinner from '../../components/Spinner.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import EmptyState from '../../components/EmptyState.vue'
import TextFileIcon from '../../assets/TextFileIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import DescriptionIcon from '../../assets/DescriptionIcon.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import { projectTemplateModel } from '../../scripts/models/projectTemplateModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { shortcutModel } from '../../scripts/core/shortcutModel.js'
import { useOverflowFit } from '../../scripts/core/useOverflowFit.js'
import { OUTCOME_HELPER } from '../../scripts/core/textUtils.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

const SEARCH_MIN = 8
const LAST_ACTION_MESSAGE = 'A template needs at least one action. Add another one before you delete this.'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const model = projectTemplateModel()
const template = model.current

const pageLoading = ref(true)
const notFound = ref(false)
const deleting = ref(false)
const detailActionsRef = ref(null)

const editingName = ref(false)
const nameValue = ref('')
const savingName = ref(false)
const nameInput = ref(null)

const newActionTitle = ref('')
const addingAction = ref(false)
const addInput = ref(null)
const listRef = ref(null)
const busyActionId = ref(null)

const editingDescId = ref(null)
const descValue = ref('')
const savingDesc = ref(false)
const descInput = ref(null)

const outcomeInput = ref(null)
const newProject = reactive({ visible: false, name: '', outcome: '', creating: false, error: '' })
const addTo = reactive({ visible: false, loading: false, loadError: false, targets: [], search: '', addingId: null })

const actionKeys = computed(() => template.value ? ['new', 'add', 'delete'] : [])
const { visibleCount } = useOverflowFit(detailActionsRef, actionKeys, ['delete'])
const visibleActions = computed(() => actionKeys.value.slice(0, visibleCount.value))
const overflowActions = computed(() => actionKeys.value.slice(visibleActions.value.length))

const canCreateProject = computed(() => !newProject.creating && newProject.name.trim() && newProject.outcome.trim())

const filteredTargets = computed(() => {
  const q = addTo.search.trim().toLowerCase()
  return q ? addTo.targets.filter(t => t.title.toLowerCase().includes(q)) : addTo.targets
})

// Command palette "This item" — mirrors the action buttons below the title
const itemCommands = computed(() => {
  if (pageLoading.value || notFound.value || !template.value) return []
  return [
    { label: 'New project from template', run: openNewProject },
    { label: 'Add to project', run: openAddToProject },
    { label: 'Delete template', run: onDeleteTemplate },
  ]
})
shortcutModel().registerItemCommands(itemCommands)

function goToList() {
  router.push({ name: 'project-templates' })
}

function firstLine(text) {
  return text.split('\n')[0]
}

// A template deleted elsewhere answers 404 on every call; everything else is a toast
function handleError(err) {
  if (err.code === 'template_not_found') {
    notFound.value = true
    newProject.visible = false
    addTo.visible = false
    return
  }
  toaster.push(err.message)
}

async function loadTemplate() {
  try {
    await model.getTemplate(route.params.id)
  } catch (err) {
    if (err.status === 404 || err.status === 400) notFound.value = true
    else toaster.push(err.message)
  }
}

// ── Rename ──

function startRename() {
  editingName.value = true
  nameValue.value = template.value.name
  nextTick(() => {
    nameInput.value?.focus()
    autoResizeName()
  })
}

function cancelRename() {
  editingName.value = false
}

function autoResizeName() {
  const el = nameInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

async function saveName() {
  if (!editingName.value || savingName.value) return
  const name = nameValue.value.trim()
  if (!name || name === template.value.name) {
    editingName.value = false
    return
  }
  savingName.value = true
  try {
    await model.renameTemplate(template.value.id, name)
  } catch (err) {
    handleError(err)
  } finally {
    savingName.value = false
    editingName.value = false
  }
}

// ── Actions ──

async function onAddAction() {
  const title = newActionTitle.value.trim()
  if (!title || addingAction.value) return
  addingAction.value = true
  try {
    await model.addAction(template.value.id, title)
    newActionTitle.value = ''
    await nextTick()
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
  } catch (err) {
    handleError(err)
  } finally {
    addingAction.value = false
    nextTick(() => addInput.value?.focus())
  }
}

async function onActionTitle(actionId, { title }) {
  const action = template.value.actions.find(a => a.id === actionId)
  const oldTitle = action.title
  action.title = title
  busyActionId.value = actionId
  try {
    await model.updateAction(template.value.id, actionId, { title })
  } catch (err) {
    action.title = oldTitle
    handleError(err)
  } finally {
    busyActionId.value = null
  }
}

async function onDeleteAction(action) {
  if (template.value.actions.length <= 1) {
    toaster.push(LAST_ACTION_MESSAGE)
    return
  }
  if (editingDescId.value === action.id) editingDescId.value = null
  busyActionId.value = action.id
  try {
    await model.deleteAction(template.value.id, action.id)
  } catch (err) {
    handleError(err)
  } finally {
    busyActionId.value = null
  }
}

async function onDragEnd({ oldIndex, newIndex }) {
  if (oldIndex === newIndex) return
  const action = template.value.actions[newIndex]
  try {
    await model.moveAction(template.value.id, action.id, newIndex)
  } catch (err) {
    handleError(err)
    if (!notFound.value) loadTemplate()
  }
}

// ── Description editor (one open at a time) ──

function openDescription(action) {
  if (editingDescId.value === action.id) return
  editingDescId.value = action.id
  descValue.value = action.description || ''
  nextTick(() => {
    const el = Array.isArray(descInput.value) ? descInput.value[0] : descInput.value
    el?.focus()
  })
}

function closeDescription() {
  editingDescId.value = null
}

async function saveDescription() {
  const actionId = editingDescId.value
  if (!actionId || savingDesc.value) return
  const action = template.value.actions.find(a => a.id === actionId)
  const description = descValue.value.trim()
  if (description === (action?.description || '')) {
    editingDescId.value = null
    return
  }
  savingDesc.value = true
  try {
    await model.updateAction(template.value.id, actionId, { description })
  } catch (err) {
    handleError(err)
  } finally {
    savingDesc.value = false
    // A click on another row meanwhile opened its editor — keep that one
    if (editingDescId.value === actionId) editingDescId.value = null
  }
}

// ── Delete template ──

async function onDeleteTemplate() {
  const { id, name } = template.value
  const ok = await confirm.show({
    title: 'Delete template?',
    message: `"${name}" will be deleted for good. Projects made from it stay as they are.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (!ok) return
  deleting.value = true
  try {
    await model.deleteTemplate(id, name)
    router.push({ name: 'project-templates' })
  } catch (err) {
    toaster.push(err.message)
  } finally {
    deleting.value = false
  }
}

// ── New project dialog ──

function openNewProject() {
  Object.assign(newProject, { visible: true, name: template.value.name, outcome: '', creating: false, error: '' })
  nextTick(() => outcomeInput.value?.focus())
}

function closeNewProject() {
  if (newProject.creating) return
  newProject.visible = false
}

async function onCreateProject() {
  if (!canCreateProject.value) return
  newProject.creating = true
  newProject.error = ''
  try {
    const created = await model.instantiate(template.value.id, newProject.name.trim(), newProject.outcome.trim())
    newProject.visible = false
    router.push({ name: 'project-detail', params: { id: created.id }, query: { from: 'projects' } })
  } catch (err) {
    if (err.upgrade) newProject.visible = false
    else if (err.code === 'template_not_found') handleError(err)
    else newProject.error = err.message
  } finally {
    newProject.creating = false
  }
}

// ── Add to project dialog ──

function openAddToProject() {
  Object.assign(addTo, { visible: true, search: '', addingId: null })
  loadTargets()
}

function closeAddToProject() {
  if (addTo.addingId) return
  addTo.visible = false
}

async function loadTargets() {
  addTo.loading = true
  addTo.loadError = false
  try {
    addTo.targets = await model.listTargets(template.value.id)
  } catch (err) {
    if (err.code === 'template_not_found') handleError(err)
    else addTo.loadError = true
  } finally {
    addTo.loading = false
  }
}

function onNewInstead() {
  addTo.visible = false
  openNewProject()
}

async function onPickTarget(target) {
  addTo.addingId = target.id
  try {
    await model.appendToProject(template.value.id, target)
    addTo.addingId = null
    addTo.visible = false
    router.push({ name: 'project-detail', params: { id: target.id }, query: { from: 'projects' } })
  } catch (err) {
    addTo.addingId = null
    handleError(err)
    if (addTo.visible) loadTargets()
  }
}

onAssistantChange(loadTemplate)

onMounted(async () => {
  model.current.value = null
  await loadTemplate()
  pageLoading.value = false
})
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

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.detail-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  padding: 64px 24px;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  touch-action: pan-y;
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
  padding: 24px 24px 0 32px;
  position: relative;
}

.detail-type-icon {
  position: absolute;
  left: 2px;
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
  white-space: pre-wrap;
  word-break: break-word;
  cursor: pointer;
}

.detail-title:hover {
  background: var(--color-bg-secondary);
}

.detail-title--hidden {
  visibility: hidden;
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
  align-items: center;
  gap: 8px;
  padding: 16px 24px 16px 32px;
}

.detail-actions > * {
  flex-shrink: 0;
}

.detail-more-icon {
  width: 16px;
  height: 16px;
}

/* ── Sections ── */
.detail-section-area {
  padding: 12px 24px 12px 32px;
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

.detail-section-textarea {
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  padding: 4px 8px;
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

.detail-section-textarea:disabled,
.detail-title-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-section-actions {
  display: flex;
  gap: 8px;
}

/* ── Action list ── */
.actions-list-scroll {
  max-height: 630px;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--color-bg-primary);
  border-radius: 4px;
  scrollbar-width: thin;
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
  background: var(--color-bg-row-hover);
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
    background: var(--color-bg-row-hover);
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

.action-state-icon {
  display: flex;
  color: var(--color-text-tertiary);
}

.action-state-icon svg {
  width: 18px;
  height: 18px;
}

.action-state-icon:empty {
  width: 18px;
}

/* The prefix here is the 18px state icon, not Item's default 32px one: 18px + 12px gap */
.action-row :deep(.item__subtitle-row--prefix) {
  padding-left: 30px;
}

.action-description-preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-description-btn svg {
  width: 16px;
  height: 16px;
}

.action-description-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 12px;
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: default;
  user-select: text;
}

/* ── Quick add ── */
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

/* ── New project dialog ── */
.np {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.np-note,
.np-error {
  margin: 0;
}

/* ── Add to project dialog ── */
.ap {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.ap-intro {
  margin: 0 0 12px;
}

.ap-search {
  margin-bottom: 8px;
}

.ap-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  text-align: center;
}

.ap-no-match {
  margin: 8px 0;
}

.ap-list {
  max-height: 50vh;
  overflow-y: auto;
}

.ap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 8px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
  cursor: pointer;
}

.ap-row:last-child {
  border-bottom: none;
}

.ap-row:hover:not(:disabled) {
  background: var(--color-bg-secondary);
}

.ap-row:disabled {
  cursor: default;
}

.ap-title {
  min-width: 0;
  color: var(--color-text-primary);
  word-break: break-word;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .detail-header {
    padding: 8px 12px;
  }

  .detail-title-area {
    padding: 16px 16px 0 32px;
  }

  .detail-actions {
    padding: 12px 16px 12px 32px;
  }

  .detail-actions .base-btn {
    min-height: var(--touch-target-min);
  }

  .detail-section-area {
    padding: 12px 16px 12px 32px;
  }

  .ap-list {
    max-height: none;
  }
}
</style>
