<template>
  <div class="canvas-page">

    <!-- Header -->
    <div class="detail-header">
      <div class="detail-header-left" :class="{ 'canvas-header-left--drill': drillDeep }">
        <a class="text-body-m detail-back-link" @click="goBack">&lt;</a>
        <span class="text-body-s detail-meta-link canvas-back-label" @click="goBack">{{ backLabel }}</span>
      </div>
      <div v-if="ready" class="detail-header-right">
        <template v-if="!isMobile">
          <span v-if="statusText" class="text-footnote canvas-status" :class="statusDanger ? 'color-text-danger' : 'color-text-secondary'" data-testid="canvas-save-status">
            {{ statusText }}
            <Lnk v-if="canvas.saveStatus.value === 'error'" text="" link="Retry" class="canvas-retry" @action="canvas.retryNow()" />
          </span>
          <template v-if="canvas.canEdit.value">
            <Btn variant="ghost" size="sm" :disabled="!canvas.canUndo.value" @mousedown.prevent @click="onUndo">Undo</Btn>
            <Btn variant="ghost" size="sm" :disabled="!canvas.canRedo.value" @mousedown.prevent @click="onRedo">Redo</Btn>
          </template>
          <Btn variant="ghost" size="sm" data-testid="canvas-help" @click="openHelp">Help</Btn>
          <span v-if="showAiConvert" class="canvas-turn" :title="aiDisabledReason || aiTooltip">
            <Btn variant="secondary" size="sm" :disabled="!!aiDisabledReason" data-testid="canvas-convert-with-ai" @click="openConvert('ai')">
              <BoltIcon class="canvas-bolt-icon" />Convert with AI
            </Btn>
          </span>
          <span v-if="canvas.canEdit.value" class="canvas-turn" :title="turnDisabledReason">
            <Btn variant="primary" size="sm" :disabled="!!turnDisabledReason" data-testid="canvas-turn-into-actions" @click="openConvert('manual')">Turn into actions</Btn>
          </span>
        </template>
        <template v-else>
          <div v-if="drillSiblings.length > 1" class="detail-nav-buttons">
            <Btn variant="icon" class="detail-nav-btn" title="Previous" :disabled="drillSiblingIndex <= 0" @click="goSibling(-1)"><TriangleLeftIcon class="detail-nav-icon" /></Btn>
            <span class="text-body-s detail-position">{{ drillSiblingIndex + 1 }} of {{ drillSiblings.length }}</span>
            <Btn variant="icon" class="detail-nav-btn" title="Next" :disabled="drillSiblingIndex >= drillSiblings.length - 1" @click="goSibling(1)"><TriangleRightIcon class="detail-nav-icon" /></Btn>
          </div>
          <Dropdown v-if="canvas.canEdit.value" align="right" title="Brainstorm">
            <template #trigger>
              <Btn variant="icon" title="More"><MoreIcon class="canvas-btn-icon" /></Btn>
            </template>
            <template #default="{ close }">
              <template v-if="drillDeep">
                <button class="dropdown-item" @click="close(); moveId = drillCurrent.id">Move to…</button>
                <button v-if="drillCurrent.converted" class="dropdown-item" @click="close(); canvas.unmarkConverted(drillCurrent.id)">Mark as not converted</button>
                <button class="dropdown-item dropdown-item--danger" @click="close(); deleteIdea(drillCurrent.id)">{{ drillDeleteLabel }}</button>
                <div class="dropdown-divider"></div>
              </template>
              <button class="dropdown-item canvas-menu-turn" :disabled="!!turnDisabledReason" data-testid="canvas-turn-into-actions" @click="close(); openConvert('manual')">
                <span>Turn into actions…</span>
                <span v-if="turnDisabledReason" class="text-caption color-text-secondary">{{ turnDisabledReason }}</span>
              </button>
              <button v-if="showAiConvert" class="dropdown-item canvas-menu-turn" :disabled="!!aiDisabledReason" data-testid="canvas-convert-with-ai" @click="close(); openConvert('ai')">
                <span>Convert with AI…</span>
                <span v-if="aiDisabledReason" class="text-caption color-text-secondary">{{ aiDisabledReason }}</span>
              </button>
              <button class="dropdown-item" @click="close(); openHelp()">Help</button>
            </template>
          </Dropdown>
          <Btn v-else variant="ghost" size="sm" data-testid="canvas-help" @click="openHelp">Help</Btn>
        </template>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="canvas.loading.value" class="detail-loading">
      <Spinner />
    </div>

    <!-- Not found -->
    <div v-else-if="canvas.notFound.value" class="detail-not-found">
      <EmptyState
          :icon="ProjectsIcon"
          title="This project is no longer here"
          text="It may have been deleted, or you no longer have access."
          buttonText="Go to Projects"
          @action="router.push({ name: 'projects' })"
      />
    </div>

    <!-- Load error -->
    <div v-else-if="canvas.loadError.value" class="canvas-banner">
      <Alert type="error" title="Couldn't load this brainstorm" message="Check your connection and try again.">
        <Btn variant="secondary" size="sm" @click="canvas.load(route.params.id)">Try again</Btn>
      </Alert>
    </div>

    <template v-else-if="ready">
      <!-- Mobile: the save status shows only when a save failed -->
      <div v-if="isMobile && canvas.unsaved.value" class="canvas-banner" data-testid="canvas-save-status">
        <Alert type="error" :title="statusText">
          <Btn v-if="canvas.saveStatus.value === 'error'" variant="secondary" size="sm" @click="canvas.retryNow()">Retry</Btn>
        </Alert>
      </div>

      <!-- Outcome strip -->
      <div v-if="canvas.project.value.outcome" class="canvas-outcome" @click="isMobile && (outcomeExpanded = !outcomeExpanded)">
        <span :class="isMobile ? 'text-body-s fw-semibold canvas-outcome-label' : 'text-overline color-text-secondary'">Outcome</span>
        <p
            class="text-body-s canvas-outcome-text"
            :class="{ 'canvas-outcome-text--expanded': outcomeExpanded }"
            :title="canvas.project.value.outcome"
        >{{ canvas.project.value.outcome }}</p>
      </div>

      <!-- Banners -->
      <div v-if="canvas.conflict.value" class="canvas-banner">
        <Alert
            type="warning"
            title="Loaded the latest version"
            message="This brainstorm was changed in another tab or on another device. Your latest changes weren't saved — please add them again."
        >
          <Btn variant="secondary" size="sm" @click="canvas.dismissConflict()">Got it</Btn>
        </Alert>
      </div>
      <div v-if="viewOnlyMessage" class="canvas-banner">
        <Alert type="info" title="View only" :message="viewOnlyMessage" />
      </div>

      <!-- Canvas body -->
      <CanvasDrillDown
          v-if="isMobile"
          v-model:current-id="drillId"
          class="canvas-body"
          @move="moveId = $event"
          @delete="deleteIdea"
          @sibling="goSibling"
          @help="openHelp"
      />
      <CanvasMap v-else ref="mapRef" class="canvas-body" @move="moveId = $event" @help="openHelp" />
    </template>

    <CanvasConvertModal :visible="convertOpen" :mode="convertMode" @close="convertOpen = false" />
    <CanvasMovePicker :node-id="moveId" @close="moveId = null" @moved="onMoved" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import Btn from '../../components/Btn.vue'
import Lnk from '../../components/Lnk.vue'
import Alert from '../../components/Alert.vue'
import Spinner from '../../components/Spinner.vue'
import Dropdown from '../../components/Dropdown.vue'
import EmptyState from '../../components/EmptyState.vue'
import CanvasMap from '../../components/canvas/CanvasMap.vue'
import CanvasDrillDown from '../../components/canvas/CanvasDrillDown.vue'
import CanvasConvertModal from '../../components/canvas/CanvasConvertModal.vue'
import BoltIcon from '../../assets/BoltIcon.vue'
import { assistantModel, onAssistantChange } from '../../scripts/models/assistantModel.js'
import CanvasMovePicker from '../../components/canvas/CanvasMovePicker.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import TriangleLeftIcon from '../../assets/TriangleLeftIcon.vue'
import TriangleRightIcon from '../../assets/TriangleRightIcon.vue'
import { canvasModel } from '../../scripts/models/canvasModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { truncateTitle } from '../../scripts/core/textUtils.js'
import { isMobileViewport } from '../../scripts/core/swipe.js'

const LEAVE_FLUSH_WAIT_MS = 2000

const VIEW_ONLY_BY_STATE = {
  COMPLETED: 'This project is completed. Undo the completion on the project page to edit its brainstorm.',
  SOMEDAY: 'This project is in Someday. Activate it to edit its brainstorm.',
  ARCHIVED: 'This project is archived, so its brainstorm can\'t be edited.',
  TRASH: 'This project is in Trash. Restore it to edit its brainstorm.',
}

const route = useRoute()
const router = useRouter()
const canvas = canvasModel()
const assistant = assistantModel()
const confirm = confirmModel()
const toaster = errorModel()

const isMobile = ref(isMobileViewport())
const convertOpen = ref(false)
const convertMode = ref('manual')
const moveId = ref(null)
const outcomeExpanded = ref(false)
const mapRef = ref(null)
const drillId = ref(null)
const mobileQuery = window.matchMedia('(max-width: 768px)')

const ready = computed(() => !canvas.loading.value && !canvas.loadError.value && !canvas.notFound.value && !!canvas.project.value)

const statusText = computed(() => {
  switch (canvas.saveStatus.value) {
    case 'saving': return 'Saving…'
    case 'saved': return 'Saved'
    case 'error': return 'Not saved — check your connection.'
    case 'too_large': return 'Not saved — this brainstorm is too large. Remove some ideas.'
    default: return ''
  }
})

const statusDanger = computed(() => canvas.unsaved.value)

const turnDisabledReason = computed(() => {
  if (canvas.convertCandidates.value.length) return ''
  const allConverted = canvas.nodes.value.some(n => n.parent_id != null && n.converted && n.text.trim() && !canvas.childrenOf(n.id).length)
  return allConverted ? 'Every idea is already an action.' : 'Add ideas first — ideas without sub-ideas become actions.'
})

// Same editors as Turn into actions; the AI reads the whole canvas, so any non-blank idea is enough
const showAiConvert = computed(() => canvas.canEdit.value && assistant.enabled.value)
const aiDisabledReason = computed(() =>
    canvas.nodes.value.some(n => n.parent_id != null && n.text.trim()) ? '' : 'Add ideas first.')
const aiTooltip = computed(() => {
  const n = assistant.selectedModel.value?.credits_per_request
  return n ? `Uses 1 request (${n.toLocaleString('en-US')} credits)` : ''
})

function openConvert(mode) {
  convertMode.value = mode
  convertOpen.value = true
}

// Mobile drill-down: the idea on screen (null = the root)
const drillCurrent = computed(() => canvas.getNode(drillId.value) || canvas.nodes.value.find(n => n.parent_id == null) || null)
const drillDeep = computed(() => isMobile.value && ready.value && drillCurrent.value?.parent_id != null)
const drillSiblings = computed(() => drillDeep.value ? canvas.childrenOf(drillCurrent.value.parent_id) : [])
const drillSiblingIndex = computed(() => drillSiblings.value.indexOf(drillCurrent.value))
const drillDeleteLabel = computed(() => {
  const n = drillDeep.value ? canvas.descendantCount(drillCurrent.value.id) : 0
  return n ? `Delete with ${n} sub-ideas` : 'Delete'
})
const backLabel = computed(() => drillDeep.value ? canvas.displayText(canvas.getNode(drillCurrent.value.parent_id)) : 'Project')

const viewOnlyMessage = computed(() => {
  if (!canvas.project.value || canvas.canEdit.value) return ''
  if (!canvas.isOwner.value) return 'Only the project owner can edit this brainstorm.'
  return VIEW_ONLY_BY_STATE[canvas.project.value.state] || ''
})

// While the assistant works it may write this canvas: a save it overtakes rebases instead of the conflict banner
watch(() => assistant.working.value, (on) => canvas.expectAssistantWrites(on), { immediate: true })
onAssistantChange(() => canvas.refreshFromServer())

// The map's open edit ends first; dropping an empty new idea is the undo
function onUndo() {
  if (!mapRef.value?.finishEdit()) canvas.undo()
}

function onRedo() {
  mapRef.value?.finishEdit()
  canvas.redo()
}

function goBack() {
  if (drillDeep.value) {
    drillId.value = drillCurrent.value.parent_id
    return
  }
  router.push({ name: 'project-detail', params: { id: route.params.id } })
}

function goSibling(step) {
  const next = drillSiblings.value[drillSiblingIndex.value + step]
  if (next) drillId.value = next.id
}

function ideaLabel(node) {
  return truncateTitle(node.text.trim()) || 'Untitled idea'
}

// The canvas undo toast undoes exactly its own change: any later edit or leaving the page closes it
let canvasUndo = null

function showCanvasUndo(message) {
  closeCanvasUndo()
  const run = () => canvas.undo()
  toaster.undoable(message, run)
  canvasUndo = { run, seq: canvas.commitSeq.value }
}

function closeCanvasUndo() {
  if (!canvasUndo) return
  const toast = toaster.state.errors.find(e => e.undo === canvasUndo.run)
  if (toast && !toast.undoing) toaster.remove(toast.id)
  canvasUndo = null
}

function deleteIdea(id) {
  const node = canvas.getNode(id)
  if (!node) return
  const label = ideaLabel(node)
  if (drillCurrent.value && canvas.isInBranch(drillCurrent.value.id, id)) drillId.value = node.parent_id
  if (canvas.removeNode(id)) showCanvasUndo(`"${label}" deleted`)
}

function onMoved(id, targetId) {
  const node = canvas.getNode(id)
  if (isMobile.value) showCanvasUndo(`"${ideaLabel(node)}" moved`)
  else toaster.success(`Moved to “${canvas.displayText(canvas.getNode(targetId))}”.`)
}

function openHelp() {
  const href = router.resolve({ name: 'help-getting-started', hash: '#brainstorming-a-project' }).href
  window.open(href, '_blank', 'noopener')
}

function onMediaChange() {
  isMobile.value = mobileQuery.matches
}

function onVisibilityChange() {
  if (document.visibilityState === 'hidden') canvas.flush({ keepalive: true })
}

function onPageHide() {
  canvas.flush({ keepalive: true })
}

function onBeforeUnload(e) {
  if (!canvas.unsaved.value) return
  e.preventDefault()
  e.returnValue = ''
}

onBeforeRouteLeave(async () => {
  await Promise.race([canvas.flush(), new Promise(resolve => setTimeout(resolve, LEAVE_FLUSH_WAIT_MS))])
  if (!canvas.unsaved.value && canvas.saveStatus.value !== 'saving') return true
  return await confirm.show({
    title: 'Leave without saving?',
    message: 'Your latest changes couldn\'t be saved. If you leave now, they\'ll be lost.',
    confirmText: 'Leave',
    cancelText: 'Stay',
  })
})

watch(() => route.params.id, (id) => {
  drillId.value = null
  closeCanvasUndo()
  if (id) canvas.load(id)
}, { immediate: true })

watch(canvas.commitSeq, (seq) => {
  if (canvasUndo && seq !== canvasUndo.seq) closeCanvasUndo()
})

// An undo or a reload can remove the idea on screen
watch(() => canvas.nodes.value, () => {
  if (drillId.value && !canvas.getNode(drillId.value)) drillId.value = null
})

onMounted(() => {
  mobileQuery.addEventListener('change', onMediaChange)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)
  window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
  mobileQuery.removeEventListener('change', onMediaChange)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('pagehide', onPageHide)
  window.removeEventListener('beforeunload', onBeforeUnload)
  closeCanvasUndo()
  canvas.expectAssistantWrites(false)
  canvas.close()
})
</script>

<style scoped>
.canvas-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.canvas-header-left--drill {
  flex-shrink: 1;
  min-width: 0;
  max-width: 45%;
}

.canvas-back-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
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
  color: var(--color-text-primary);
  min-width: 60px;
  text-align: center;
  padding: 0 4px;
  white-space: nowrap;
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

.canvas-turn {
  display: inline-flex;
}

.canvas-bolt-icon {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  color: var(--color-action);
}

.canvas-menu-turn {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.dropdown-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--color-border-light);
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
}

.canvas-status {
  margin-right: 8px;
  text-align: right;
}

.canvas-retry {
  display: inline;
  margin-left: 4px;
}

.canvas-btn-icon {
  width: 16px;
  height: 16px;
}

.canvas-outcome {
  flex-shrink: 0;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.canvas-outcome-text {
  margin: 2px 0 0;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.canvas-banner {
  flex-shrink: 0;
  padding: 12px 16px 0;
}

.canvas-body {
  flex: 1;
  min-height: 0;
}

@media (max-width: 768px) {
  .detail-header {
    padding: 8px 12px;
  }

  .canvas-status {
    margin-right: 0;
  }

  /* Same section inset and label as the drill-down below it (Project detail mobile) */
  .canvas-outcome {
    padding-left: 32px;
    cursor: pointer;
  }

  .canvas-outcome-label {
    display: block;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .canvas-outcome-text {
    -webkit-line-clamp: 1;
  }

  .canvas-outcome-text--expanded {
    -webkit-line-clamp: unset;
    display: block;
  }
}
</style>
