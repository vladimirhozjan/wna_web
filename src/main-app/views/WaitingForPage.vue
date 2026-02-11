<template>
  <DashboardLayout>
    <div class="waiting-page">
      <div class="waiting-header">
        <h1 class="text-h1 color-text-primary">Waiting For</h1>
      </div>

      <div class="waiting-content">
        <!-- Loading state -->
        <div v-if="loading && items.length === 0" class="loading-state">
          <span class="loading-spinner"></span>
        </div>

        <!-- Empty state -->
        <div v-else-if="!loading && items.length === 0" class="empty-state">
          <WaitingIcon class="empty-state__icon" />
          <h2 class="empty-state__title">Nothing waiting</h2>
          <p class="empty-state__text">
            Track things you're waiting on from others. Move actions here from Next or Today.
          </p>
        </div>

        <!-- List -->
        <VueDraggable
            v-else
            v-model="items"
            :delay="100"
            :animation="150"
            :chosen-class="'waiting-item-wrapper-chosen'"
            :ghost-class="'waiting-item-wrapper-ghost'"
            @start="onDragStart"
            @end="onDragEnd"
        >
          <div
              v-for="(item, index) in items"
              :key="item.id"
              class="waiting-item-wrapper"
              @click="onItemClick(item, index)"
          >
            <WaitingItem
                :id="item.id"
                :title="item.title"
                :waiting-for="item.waiting_for"
                :waiting-since="item.waiting_since"
                :loading="loadingIdSet.has(item.id)"
                :editable="true"
                :no-hover="isDragging"
                @update="onItemUpdate"
                @check="onItemCheck"
            >
              <template #actions>
                <Btn variant="link" size="sm" @click.stop="onGotIt(item.id)">Got it</Btn>
                <ActionBtn @click.stop="onTrash(item.id)" />
              </template>
            </WaitingItem>
          </div>
        </VueDraggable>

        <!-- Load more -->
        <div class="load-more" v-if="hasMore && items.length > 0">
          <Btn
              variant="ghost"
              size="sm"
              :loading="loading"
              @click="loadMore"
          >
            Load more
          </Btn>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import WaitingItem from '../components/WaitingItem.vue'
import Btn from '../components/Btn.vue'
import ActionBtn from '../components/ActionBtn.vue'
import WaitingIcon from '../assets/WaitingIcon.vue'
import { waitingModel } from '../scripts/waitingModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  totalItems,
  loadWaiting,
  updateWaiting,
  trashWaiting,
  moveWaiting,
  completeWaiting,
  unwaitAction,
} = waitingModel()

const toaster = errorModel()
const confirm = confirmModel()

// Loading states
const updatingId = ref(null)
const deletingId = ref(null)
const movingId = ref(null)
const unwaitingId = ref(null)

const loadingIdSet = computed(() => {
  const ids = new Set()
  if (updatingId.value) ids.add(updatingId.value)
  if (deletingId.value) ids.add(deletingId.value)
  if (movingId.value) ids.add(movingId.value)
  if (unwaitingId.value) ids.add(unwaitingId.value)
  return ids
})

// Drag state
const isDragging = ref(false)
let draggedItemId = null
let originalIndex = null

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  loadWaiting({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadWaiting()
}

function onItemClick(item, index) {
  if (isDragging.value) return
  router.push({
    name: 'action-detail',
    params: { id: item.id },
    query: { position: index, total: totalItems.value, from: 'waiting' }
  })
}

async function onItemUpdate(id, { title }) {
  const item = items.value.find(i => i.id === id)
  const oldTitle = item?.title
  if (item) item.title = title

  updatingId.value = id
  try {
    await updateWaiting(id, { title })
  } catch (e) {
    if (item) item.title = oldTitle
  } finally {
    updatingId.value = null
  }
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '...'
}

async function onItemCheck(id, checked) {
  if (!checked) return

  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  try {
    await completeWaiting(id)
    toaster.success(`"${title}" completed`)
  } catch (err) {
    toaster.push(err.message || 'Failed to complete item')
  }
}

async function onGotIt(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  unwaitingId.value = id
  try {
    const result = await unwaitAction(id)
    // Server returns the new state - check if it went to CALENDAR or NEXT
    const newState = result?.state || 'NEXT'
    const stateLabel = newState === 'CALENDAR' ? 'Calendar' : 'Next Actions'
    toaster.success(`"${title}" moved to ${stateLabel}`)
  } catch (err) {
    toaster.push(err.message || 'Failed to move item')
  } finally {
    unwaitingId.value = null
  }
}

async function onTrash(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: 'Are you sure you want to move this item to trash?',
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    deletingId.value = id
    try {
      await trashWaiting(id)
      toaster.success(`"${title}" moved to trash`)
    } finally {
      deletingId.value = null
    }
  }
}

function onDragStart(evt) {
  originalIndex = evt.oldIndex
  draggedItemId = items.value[evt.oldIndex]?.id
  isDragging.value = true
}

async function onDragEnd(evt) {
  isDragging.value = false
  const newIndex = evt.newIndex

  if (originalIndex !== newIndex && draggedItemId) {
    movingId.value = draggedItemId
    try {
      await moveWaiting(draggedItemId, newIndex)
    } catch (e) {
      await loadWaiting({ reset: true })
    } finally {
      movingId.value = null
    }
  }

  draggedItemId = null
  originalIndex = null
}
</script>

<style scoped>
.waiting-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.waiting-header {
  flex-shrink: 0;
  background: var(--color-bg-primary);
}

h1 {
  padding: 10px;
  margin: 0;
}

.waiting-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.waiting-item-wrapper {
  cursor: pointer;
}

.waiting-item-wrapper-chosen .waiting-item {
  background-color: var(--color-bg-hover);
}

.waiting-item-wrapper-ghost .waiting-item {
  background-color: var(--color-btn-ghost-hover);
}

.waiting-item-wrapper-ghost .waiting-item > * {
  opacity: 0;
}

.load-more {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-state__icon {
  width: 80px;
  height: 80px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
