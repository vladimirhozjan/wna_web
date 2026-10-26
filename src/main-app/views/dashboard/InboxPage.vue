<template>
    <div class="inbox-page">

      <!-- List Panel -->
      <div
          class="inbox-list-panel"
          @dragenter="onPanelDragEnter"
          @dragover="onPanelDragOver"
          @dragleave="onPanelDragLeave"
          @drop="onPanelDrop"
      >
        <div v-if="dropActive" class="text-body-m inbox-drop-overlay" data-testid="inbox-drop-overlay">
          {{ isProOrTeam ? 'Drop files to capture them to Inbox' : CAPTURE_LOCKED_LINE }}
        </div>
        <!-- Fixed header -->
        <div class="inbox-header">
          <div class="title">
            <h1 class="page-title">Inbox</h1>
            <Btn
                v-if="serverRows.length > 0 && !clarifyMode && !isOffline"
                variant="primary"
                size="sm"
                @click="onClarify"
            >
              Clarify
            </Btn>
            <Btn
                v-if="clarifyMode"
                variant="secondary"
                size="sm"
                @click="exitClarifyMode"
            >
              Exit
            </Btn>
          </div>

          <!-- Add Stuff -->
          <div class="inbox-input" v-if="!clarifyMode">
            <CaptureBar ref="add_input" variant="inbox" @saved="hadItems = true" />
          </div>
        </div>

        <!-- Scrollable content -->
        <PullToRefresh class="inbox-content" :refresh="onRefresh" :disabled="clarifyMode || isOffline || (loading && items.length === 0)">
          <div class="card">
          <Item
              v-for="entry in queuedRows"
              :key="entry.client_key"
              :id="entry.client_key"
              :title="entry.title"
              :editable="false"
              no-checkbox
              reserve-checkbox
              class="queued-row"
              data-testid="queued-row"
          >
            <template #subtitle>
              <div class="queued-row__meta">
                <Badge v-if="entry.client_key === sendingKey" type="draft" label="Syncing…" />
                <Badge v-else-if="entry.status === 'failed'" type="failed" label="Couldn't sync" />
                <Badge v-else type="draft" label="Waiting to sync" />
                <MetadataRow v-if="entry.files.length" :item="{ attachment_count: entry.files.length, input_type: entry.input_type }" entity-type="stuff" />
              </div>
              <div v-if="entry.status === 'failed' && entry.client_key !== sendingKey" class="text-footnote color-text-danger queued-row__reason">
                {{ failureCopy(entry.error) }}
              </div>
            </template>
            <template #actions>
              <template v-if="entry.client_key !== sendingKey">
                <Btn v-if="entry.status === 'failed'" variant="ghost" size="sm" @click="queue.retry(entry.client_key)">Retry</Btn>
                <ActionBtn @click="onDiscard(entry)" />
              </template>
            </template>
          </Item>
          <ItemList
              v-if="queuedRows.length === 0 || serverRows.length > 0"
              v-model="serverRows"
              :loading="loading"
              :has-more="hasMore && !clarifyMode"
              :loading-ids="loadingIds"
              :completing-ids="completingIds"
              :disabled="clarifyMode || isOffline"
              :checkbox-disabled="isOffline"
              :no-default-action="clarifyMode || isOffline"
              :active-id="currentClarifyItem?.id ?? null"
              :editable="!clarifyMode && !isOffline"
              :source-type="clarifyMode || isOffline ? null : 'stuff'"
              :swipe-right="clarifyMode || isOffline ? null : 'clarify'"
              :swipe-left="clarifyMode || isOffline ? null : 'trash'"
              @update="onItemUpdate"
              @check="onItemCheck"
              @click="onItemClick"
              @delete="onTrash"
              @swipe-right="onSwipeClarify"
              @swipe-left="onTrash"
              @move="onMove"
              @load-more="loadMore"
          >
            <template #subtitle="{ item }">
              <MetadataRow :item="item" entity-type="stuff" />
            </template>
            <template #actions="{ item }">
              <ActionBtn v-if="!clarifyMode && !isOffline" @click="onTrash(item.id)" />
            </template>
            <template #empty>
              <EmptyState v-if="isOffline && hasMore" :icon="InboxIcon" title="You're offline" text="Your Inbox loads when you're back online. Capture above — it's sent automatically." />
              <Celebration v-else-if="celebrating" title="Inbox Zero" subtitle="You're in control." @dismiss="celebrating = false" />
              <template v-else>
                <EmptyState :icon="InboxIcon" title="Inbox zero. Mind like water." text="Your head is for having ideas, not holding them. Capture the next one above." />
              </template>
            </template>
          </ItemList>
          <p v-if="isOffline && hasMore && (queuedRows.length > 0 || serverRows.length > 0)" class="text-body-s color-text-tertiary inbox-offline-footer">
            The rest of your Inbox loads when you're back online.
          </p>
          </div>
        </PullToRefresh>
      </div>

      <!-- Clarify Panel (Desktop - Slide-over) -->
      <Teleport to="body" v-if="clarifyMode && currentClarifyItem && !isMobile">
        <div class="clarify-slideover-overlay" @click="exitClarifyMode">
          <div class="clarify-slideover" @click.stop>
            <ClarifyPanel
                :key="currentClarifyItem.id"
                :stuff-item="currentClarifyItem"
                mode="modal"
                @done="onClarifyDone"
                @cancel="exitClarifyMode"
            />
          </div>
        </div>
      </Teleport>

      <!-- Clarify Panel (Mobile - Bottom sheet) -->
      <Teleport to="body" v-if="clarifyMode && currentClarifyItem && isMobile">
        <BottomSheet :dismissible="clarify.canDismiss()" @close="cancelClarify">
          <ClarifyPanel
              :key="currentClarifyItem.id"
              :stuff-item="currentClarifyItem"
              mode="sheet"
              @done="onClarifyDone"
              @cancel="exitClarifyMode"
          />
        </BottomSheet>
      </Teleport>

    </div>
</template>

<script setup>
import {ref, onMounted, nextTick, watch, computed, onUnmounted} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { stuffModel } from '../../scripts/models/stuffModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { undoModel } from '../../scripts/core/undoModel.js'
import apiClient from '../../scripts/core/apiClient.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { clarifyModel } from '../../scripts/models/clarifyModel.js'
import { captureQueue } from '../../scripts/core/captureQueue.js'
import { offlineModel } from '../../scripts/core/offlineModel.js'
import { truncateTitle } from '../../scripts/core/textUtils.js'
import { CAPTURE_LOCKED_LINE } from '../../scripts/core/captureRules.js'
import { authModel } from '../../scripts/core/authModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import Btn from "../../components/Btn.vue";
import CaptureBar from '../../components/CaptureBar.vue'
import ItemList from '../../components/ItemList.vue'
import Item from '../../components/Item.vue'
import Badge from '../../components/Badge.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import InboxIcon from '../../assets/InboxIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import Celebration from '../../components/Celebration.vue'
import ClarifyPanel from '../../components/clarify/ClarifyPanel.vue'
import BottomSheet from '../../components/BottomSheet.vue'
import PullToRefresh from '../../components/PullToRefresh.vue'
import { hapticFeedback } from '../../scripts/core/haptics.js'

// model
const {
  items,
  loading,
  error,
  hasMore,
  loadStuff,
  updateStuff,
  trashStuff,
  moveStuff,
  totalItems,
} = stuffModel()

const router = useRouter()
const route = useRoute()
const toaster = errorModel()
const undo = undoModel()
const clarify = clarifyModel()
const queue = captureQueue()
const { entries, sendingKey } = queue
const { isOffline } = offlineModel()
const auth = authModel()
const confirm = confirmModel()

// local UI state
const add_input = ref(null)
const updatingId = ref(null)
const deletingId = ref(null)
const movingId = ref(null)
const completingIds = ref([])

const loadingIds = computed(() => {
  const ids = []
  if (updatingId.value) ids.push(updatingId.value)
  if (deletingId.value) ids.push(deletingId.value)
  if (movingId.value) ids.push(movingId.value)
  return ids
})

// Device-queued captures sit above the server rows, newest first; a queued entry already created on the
// server hides that server row so each capture shows once
const queuedRows = computed(() => [...entries.value].sort((a, b) => b.captured_at.localeCompare(a.captured_at)))
const hiddenIds = computed(() => new Set(entries.value.map(e => e.server_id).filter(Boolean)))
// A synced capture's server row takes its queued row's place (top, newest first) until the Inbox reloads.
// The server keeps its own order meanwhile, so a reorder first brings it to the order on screen
const pinnedRows = ref([])
let serverOrder = null
const serverRows = computed({
  get: () => {
    const rows = items.value.filter(i => !hiddenIds.value.has(i.id))
    if (pinnedRows.value.length === 0) return rows
    const rank = new Map(pinnedRows.value.map((p, i) => [p.id, i]))
    const pinned = rows.filter(i => rank.has(i.id)).sort((a, b) => rank.get(a.id) - rank.get(b.id))
    return [...pinned, ...rows.filter(i => !rank.has(i.id))]
  },
  set: (rows) => {
    if (pinnedRows.value.length > 0) serverOrder = items.value.filter(i => !hiddenIds.value.has(i.id)).map(i => i.id)
    items.value = [...rows, ...items.value.filter(i => hiddenIds.value.has(i.id))]
  },
})

watch(entries, (now, before) => {
  const kept = new Set(now.map(e => e.client_key))
  const gone = (before || []).filter(e => e.server_id && !kept.has(e.client_key))
  if (gone.length === 0) return
  const goneIds = new Set(gone.map(e => e.server_id))
  pinnedRows.value = [...pinnedRows.value.filter(p => !goneIds.has(p.id)), ...gone.map(e => ({ id: e.server_id, at: e.captured_at }))]
      .sort((a, b) => b.at.localeCompare(a.at))
})

// Inbox Zero celebration state
const hadItems = ref(false)
const celebrating = ref(false)

// Clarify mode state
const clarifyMode = ref(false)
const singleClarify = ref(false)
const currentClarifyIndex = ref(0)
const isMobile = ref(false)

const currentClarifyItem = computed(() => {
  if (!clarifyMode.value) return null
  return serverRows.value[currentClarifyIndex.value] || null
})

// Trigger celebration when items list empties (covers all removal paths including drag-to-sidebar)
watch(() => items.value.length, (newLen, oldLen) => {
  if (newLen === 0 && oldLen > 0 && hadItems.value) {
    startCelebration()
  }
})

// show errors in toaster
watch(error, (err) => {
  if (!err) return
  if (err.status === null && isOffline.value) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

// lifecycle
onMounted(async () => {
  // Offline the rows already loaded this session stay
  if (!isOffline.value) {
    items.value = []
    await loadStuff({ reset: true }).catch(() => {})
  }
  if (items.value.length > 0) hadItems.value = true
  if (route.query.celebrate && items.value.length === 0) {
    hadItems.value = true
    startCelebration()
    router.replace({ name: 'inbox' })
  } else if (route.query.clarify && items.value.length > 0) {
    onClarify()
    router.replace({ name: 'inbox' })
  } else {
    focusAddInput()
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

// helpers
function focusAddInput() {
  nextTick(() => {
    add_input.value?.focus()
  })
}

watch(loading, async (v) => {
  const typingElsewhere = document.activeElement?.matches('input, textarea') && !document.activeElement.closest('.inbox-input')
  if (!v && !clarifyMode.value && !typingElsewhere) {
    await nextTick()
    add_input.value?.focus()
  }
})

// celebration
function startCelebration() {
  celebrating.value = true
}

// Desktop drop: files become chips in the Inbox capture bar, never added on their own.
// Only drags carrying files count, so row reorder and drag-to-sidebar are unaffected.
const dropActive = ref(false)
const isProOrTeam = computed(() => ['pro', 'team'].includes(auth.currentUser.value?.subscription_tier))
let dropDepth = 0

function carriesFiles(e) {
  return !clarifyMode.value && !!e.dataTransfer?.types?.includes('Files')
}

function onPanelDragEnter(e) {
  if (!carriesFiles(e)) return
  e.preventDefault()
  dropDepth++
  dropActive.value = true
}

function onPanelDragOver(e) {
  if (carriesFiles(e)) e.preventDefault()
}

function onPanelDragLeave(e) {
  if (!carriesFiles(e)) return
  dropDepth = Math.max(0, dropDepth - 1)
  if (dropDepth === 0) dropActive.value = false
}

function onPanelDrop(e) {
  if (!carriesFiles(e)) return
  e.preventDefault()
  dropDepth = 0
  dropActive.value = false
  add_input.value?.addFiles(e.dataTransfer.files)
}

async function loadMore() {
  if (isOffline.value) return
  await loadStuff()
}

watch(isOffline, (offline) => {
  if (!offline) loadStuff({ reset: true }).catch(() => {})
})

function failureCopy(error) {
  const file = truncateTitle(error?.file)
  switch (error?.code) {
    case 'too_large':
      return `${file} is over your plan's file size limit — discard to keep the item without it`
    case 'drive_too_large':
      return `${file} is too large to upload — discard to keep the item without it`
    case 'storage':
      return auth.currentUser.value?.subscription_tier === 'team'
          ? 'Not enough storage — delete files you no longer need, then retry'
          : 'Not enough storage — upgrade for more space, then retry'
    case 'count':
      return 'Over the files-per-item limit — discard to keep the item with the files that fit'
    case 'drive_reconnect':
      return 'Google Drive is disconnected — reconnect it in Settings, then retry'
    default:
      return 'This item couldn\'t be saved — retry, or discard it'
  }
}

async function onDiscard(entry) {
  const title = truncateTitle(entry.title)
  const confirmed = await confirm.show({
    title: 'Discard item',
    message: entry.server_id
        ? `"${title}" is already in your Inbox. Discarding keeps it with the files saved so far and deletes the rest from this device.`
        : `"${title}" hasn't synced yet. Discarding deletes it from this device for good.`,
    confirmText: 'Discard',
    cancelText: 'Cancel',
  })
  if (confirmed) await queue.discard(entry.client_key)
}

function onRefresh() {
  pinnedRows.value = []
  serverOrder = null
  return loadStuff({ reset: true })
}
undo.registerRefresh(onRefresh)

function onItemClick(item, index) {
  if (clarifyMode.value) {
    currentClarifyIndex.value = index
    return
  }
  if (isOffline.value) return

  router.push({ name: 'stuff-detail', params: { id: item.id }, query: { total: totalItems.value, position: item.position, from: 'inbox' } })
}

async function onItemUpdate(id, { title }) {
  // Optimistic update
  const item = items.value.find(i => i.id === id)
  const oldTitle = item?.title
  if (item) item.title = title

  updatingId.value = id
  try {
    await updateStuff(id, { title })
  } catch (e) {
    // Revert on error
    if (item) item.title = oldTitle
  } finally {
    updatingId.value = null
  }
}

const ANIM_MS = 800

async function onItemCheck(id, checked) {
  if (!checked) return

  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  if (item) item.checked = true
  completingIds.value.push(id)
  hapticFeedback('success')

  try {
    await Promise.all([
      apiClient.completeStuff(id),
      new Promise(r => setTimeout(r, ANIM_MS))
    ])
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      items.value.splice(idx, 1)
    }
    undo.record({ op: 'complete', item, title, message: `"${title}" completed` })
    statsModel().refreshStats()
    // Reload list to backfill removed item
    loadStuff({ reset: true }).catch(() => {})
  } catch (err) {
    if (item) item.checked = false
    toaster.push(err.message || 'Failed to complete item')
  } finally {
    completingIds.value = completingIds.value.filter(x => x !== id)
  }
}

async function onTrash(id) {
  if (isOffline.value) return
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  deletingId.value = id
  try {
    await trashStuff(id)
    undo.record({ op: 'trash', item, title, message: `"${title}" moved to trash` })
    // Reload list to backfill removed item
    loadStuff({ reset: true }).catch(() => {})
  } finally {
    deletingId.value = null
  }
}

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    if (serverOrder) await moveToScreenOrder()
    else await moveStuff(id, newIndex)
  } catch (e) {
    await loadStuff({ reset: true })
  } finally {
    movingId.value = null
  }
}

// Moves only the rows whose server position differs from the screen, top to bottom
async function moveToScreenOrder() {
  const known = serverOrder
  serverOrder = null
  pinnedRows.value = []
  const target = serverRows.value.map(i => i.id)
  const order = known.filter(id => target.includes(id))
  order.push(...target.filter(id => !order.includes(id)))
  for (let i = 0; i < target.length; i++) {
    if (order[i] === target[i]) continue
    order.splice(order.indexOf(target[i]), 1)
    order.splice(i, 0, target[i])
    await moveStuff(target[i], i)
  }
}

function onClarify() {
  if (serverRows.value.length === 0) return
  clarifyMode.value = true
  currentClarifyIndex.value = 0
}

function onSwipeClarify(id) {
  const index = serverRows.value.findIndex(i => i.id === id)
  if (index === -1) return
  clarifyMode.value = true
  singleClarify.value = true
  currentClarifyIndex.value = index
}

function exitClarifyMode() {
  clarifyMode.value = false
  singleClarify.value = false
  currentClarifyIndex.value = 0
}

function cancelClarify() {
  clarify.cancel()
  exitClarifyMode()
}

function onClarifyDone(processedItem) {
  const idx = items.value.findIndex(i => i.id === processedItem.id)
  if (idx !== -1) {
    items.value.splice(idx, 1)
  }

  if (serverRows.value.length === 0 || singleClarify.value) {
    exitClarifyMode()
  } else if (currentClarifyIndex.value >= serverRows.value.length) {
    currentClarifyIndex.value = serverRows.value.length - 1
  }
}

</script>

<style scoped>
.inbox-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 1px;
}

.inbox-list-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-width: 0;
}

.inbox-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.inbox-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 0;
}

h1 {
  margin: 0;
  padding: 0;
}

.inbox-input {
  display: flex;
  gap: 10px;
  padding: 0;
  margin-bottom: 5px;
}

.inbox-input > .capture-bar {
  flex: 1;
  min-width: 0;
}

.inbox-drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  border: 2px dashed var(--color-action);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  opacity: 0.95;
  pointer-events: none;
}

/* Matches the border ItemList rows reserve for the active marker */
.queued-row {
  border-left: 3px solid transparent;
}

/* Hidden actions take no width, so the title can use the whole row */
@media (hover: hover) and (pointer: fine) {
  .queued-row:not(:hover):not(:focus-within) :deep(.item__actions) {
    position: absolute;
    right: 16px;
  }
}

.queued-row__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.queued-row__reason {
  margin-top: 4px;
}

.inbox-offline-footer {
  margin: 0;
  padding: 16px;
  text-align: center;
}


/* Clarify Slide-over */
.clarify-slideover-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-light);
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
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
