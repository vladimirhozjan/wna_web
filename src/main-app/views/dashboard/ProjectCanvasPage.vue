<template>
  <div class="canvas-page">

    <!-- Header -->
    <div class="detail-header">
      <div class="detail-header-left">
        <a class="text-body-m detail-back-link" @click="goBack">&lt;</a>
        <span class="text-body-s detail-meta-link" @click="goBack">Project</span>
      </div>
      <div v-if="ready" class="detail-header-right">
        <span v-if="statusText" class="text-footnote canvas-status" :class="statusDanger ? 'color-text-danger' : 'color-text-secondary'" data-testid="canvas-save-status">
          {{ statusText }}
          <Lnk v-if="canvas.saveStatus.value === 'error'" text="" link="Retry" class="canvas-retry" @action="canvas.retryNow()" />
        </span>
        <template v-if="!isMobile">
          <template v-if="canvas.canEdit.value">
            <Btn variant="ghost" size="sm" :disabled="!canvas.canUndo.value" @mousedown.prevent @click="onUndo">Undo</Btn>
            <Btn variant="ghost" size="sm" :disabled="!canvas.canRedo.value" @mousedown.prevent @click="onRedo">Redo</Btn>
          </template>
          <Btn v-if="canvas.isOwner.value" variant="ghost" size="sm" @click="download">
            <DownloadIcon class="canvas-btn-icon" /> Download
          </Btn>
          <Btn variant="icon" title="Help: brainstorming" @click="openHelp">?</Btn>
          <Btn v-if="canvas.canEdit.value" variant="primary" size="sm" @click="convertOpen = true">Convert to backlog</Btn>
        </template>
        <Dropdown v-else align="right" title="Brainstorm">
          <template #trigger>
            <Btn variant="icon" title="More"><MoreIcon class="canvas-btn-icon" /></Btn>
          </template>
          <template #default="{ close }">
            <button v-if="canvas.canEdit.value" class="dropdown-item" @click="close(); convertOpen = true">Convert to backlog</button>
            <button v-if="canvas.isOwner.value" class="dropdown-item" @click="close(); download()">Download</button>
            <button class="dropdown-item" @click="close(); openHelp()">Help</button>
          </template>
        </Dropdown>
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
      <!-- Outcome strip -->
      <div v-if="canvas.project.value.outcome" class="canvas-outcome" @click="isMobile && (outcomeExpanded = !outcomeExpanded)">
        <span class="text-overline color-text-secondary">Outcome</span>
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
      <CanvasDrillDown v-if="isMobile" class="canvas-body" @move="moveId = $event" @help="openHelp" />
      <CanvasMap v-else ref="mapRef" class="canvas-body" @move="moveId = $event" @help="openHelp" />
    </template>

    <CanvasConvertModal :visible="convertOpen" @close="convertOpen = false" />
    <CanvasMovePicker :node-id="moveId" @close="moveId = null" />
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
import CanvasMovePicker from '../../components/canvas/CanvasMovePicker.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import DownloadIcon from '../../assets/DownloadIcon.vue'
import MoreIcon from '../../assets/MoreIcon.vue'
import { canvasModel } from '../../scripts/models/canvasModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
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
const confirm = confirmModel()

const isMobile = ref(isMobileViewport())
const convertOpen = ref(false)
const moveId = ref(null)
const outcomeExpanded = ref(false)
const mapRef = ref(null)
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

const viewOnlyMessage = computed(() => {
  if (!canvas.project.value || canvas.canEdit.value) return ''
  if (!canvas.isOwner.value) return 'Only the project owner can edit this brainstorm.'
  return VIEW_ONLY_BY_STATE[canvas.project.value.state] || ''
})

// The map's open edit ends first; dropping an empty new idea is the undo
function onUndo() {
  if (!mapRef.value?.finishEdit()) canvas.undo()
}

function onRedo() {
  mapRef.value?.finishEdit()
  canvas.redo()
}

function goBack() {
  router.push({ name: 'project-detail', params: { id: route.params.id } })
}

function openHelp() {
  const href = router.resolve({ name: 'help-getting-started', hash: '#brainstorming-a-project' }).href
  window.open(href, '_blank', 'noopener')
}

function download() {
  const blob = new Blob([canvas.exportJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${canvas.projectTitle.value} canvas.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
  if (id) canvas.load(id)
}, { immediate: true })

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
  .canvas-status {
    margin-right: 0;
  }

  .canvas-outcome {
    cursor: pointer;
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
