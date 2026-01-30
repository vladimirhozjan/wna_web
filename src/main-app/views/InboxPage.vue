<template>
  <DashboardLayout>
    <div class="inbox-page" :class="{ 'inbox-page--clarify-mode': clarifyMode }">

      <!-- List Panel -->
      <div class="inbox-list-panel">
        <!-- Fixed header -->
        <div class="inbox-header">
          <div class="title">
            <h1 class="text-h1 color-text-primary">Inbox</h1>
            <Btn
                v-if="items.length > 0 && !clarifyMode"
                variant="ghost"
                size="sm"
                @click="onClarify"
            >
              Clarify
            </Btn>
            <Btn
                v-if="clarifyMode"
                variant="ghost"
                size="sm"
                @click="exitClarifyMode"
            >
              Exit
            </Btn>
          </div>

          <!-- Add Stuff -->
          <div class="inbox-input" v-if="!clarifyMode">
            <Inpt
                ref="add_input"
                v-model="new_stuff_title"
                type="text"
                placeholder="Add new stuff"
                @keyup.enter="onAdd"
                :disabled="loading"
            />
            <Btn @click="onAdd"
                 :disabled="loading || !new_stuff_title.trim()"
                 :loading="loading"
                 class="add-button"
                 variant="primary"
                 size="sm">
              Add
            </Btn>
          </div>
        </div>

        <!-- Scrollable content -->
        <div class="inbox-content">
          <!-- Empty state -->
          <div v-if="!loading && items.length === 0" class="empty-state">
            <InboxIcon class="empty-state__icon" />
            <h2 class="empty-state__title">Your inbox is empty</h2>
            <p class="empty-state__text">
              Capture everything on your mind. Add new stuff above to get started.
            </p>
          </div>

          <!-- Stuff list with drag and drop -->
          <VueDraggable
              v-else
              v-model="items"
              :delay="100"
              :animation="100"
              :chosen-class="'item-wrapper-chosen'"
              :ghost-class="'item-wrapper-ghost'"
              :disabled="clarifyMode"
              @start="onDragStart"
              @end="onDragEnd"
          >
            <div
                v-for="(item, index) in items"
                :key="item.id"
                class="item-wrapper"
                :class="{ 'item-wrapper--active': clarifyMode && currentClarifyIndex === index }"
            >
              <Item
                  :id="item.id"
                  :title="item.title"
                  :loading="updatingId === item.id || deletingId === item.id || movingId === item.id"
                  :checked="item.checked"
                  :editable="!clarifyMode"
                  @update="onItemUpdate"
                  @check="onItemCheck"
                  @click="onItemClick(item, index)"
              >
                <template #actions v-if="!clarifyMode">
                  <button class="action-btn action-btn--danger" @click="onDelete(item.id)">✕</button>
                </template>
              </Item>
            </div>
          </VueDraggable>

          <!-- Load more -->
          <div class="load-more" v-if="!clarifyMode">
            <Btn
                v-if="hasMore && items.length > 0"
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

      <!-- Clarify Panel (Desktop) -->
      <div class="inbox-clarify-panel" v-if="clarifyMode && currentClarifyItem && !isMobile">
        <ClarifyPanel
            :key="currentClarifyItem.id"
            :stuff-item="currentClarifyItem"
            mode="inline"
            @done="onClarifyDone"
            @cancel="exitClarifyMode"
        />
      </div>

      <!-- Clarify Panel (Mobile - Fullscreen) -->
      <Teleport to="body" v-if="clarifyMode && currentClarifyItem && isMobile">
        <ClarifyPanel
            :key="currentClarifyItem.id"
            :stuff-item="currentClarifyItem"
            mode="fullscreen"
            @done="onClarifyDone"
            @cancel="exitClarifyMode"
        />
      </Teleport>

    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "../layouts/DashboardLayout.vue";
import {ref, onMounted, nextTick, watch, computed, onUnmounted} from 'vue'
import { useRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { stuffModel } from '../scripts/stuffModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import Btn from "../components/Btn.vue";
import Inpt from '../components/Inpt.vue'
import Item from '../components/Item.vue'
import InboxIcon from '../assets/InboxIcon.vue'
import ClarifyPanel from '../components/ClarifyPanel.vue'

// model
const {
  items,
  loading,
  error,
  hasMore,
  loadStuff,
  addStuff,
  updateStuff,
  deleteStuff,
  moveStuff,
} = stuffModel()

const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()

// local UI state
const new_stuff_title = ref('')
const add_input = ref(null)
const updatingId = ref(null)
const deletingId = ref(null)
const movingId = ref(null)

// Clarify mode state
const clarifyMode = ref(false)
const currentClarifyIndex = ref(0)
const isMobile = ref(false)

const currentClarifyItem = computed(() => {
  if (!clarifyMode.value) return null
  return items.value[currentClarifyIndex.value] || null
})

// Drag state for API sync
let draggedItemId = null
let originalIndex = null
const isDragging = ref(false)

// show errors in toaster
watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

// lifecycle
onMounted(async () => {
  await loadStuff({ reset: true })
  focusAddInput()
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
  if (!v && !clarifyMode.value) {
    await nextTick()
    add_input.value?.focus()
  }
})

// actions
async function onAdd() {
  const t = (new_stuff_title.value ?? '').toString().trim()
  if (!t) return

  await addStuff(t)
  new_stuff_title.value = ''
  focusAddInput()
}

async function loadMore() {
  await loadStuff()
}

function onItemClick(item, index) {
  if (isDragging.value) {
    return
  }

  if (clarifyMode.value) {
    // In clarify mode, select the item for clarification
    currentClarifyIndex.value = index
    return
  }

  router.push({ name: 'stuff-detail', params: { id: item.id } })
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

function onItemCheck(id, checked) {
  console.log('Item checked:', id, checked)
}

async function onDelete(id) {
  const confirmed = await confirm.show({
    title: 'Delete stuff',
    message: 'Are you sure you want to delete this item?',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    deletingId.value = id
    try {
      await deleteStuff(id)
    } finally {
      deletingId.value = null
    }
  }
}

function onClarify() {
  if (items.value.length === 0) return
  clarifyMode.value = true
  currentClarifyIndex.value = 0
}

function exitClarifyMode() {
  clarifyMode.value = false
  currentClarifyIndex.value = 0
}

function onClarifyDone(processedItem) {
  // Remove the processed item from the list (simulated - API will handle this in production)
  const idx = items.value.findIndex(i => i.id === processedItem.id)
  if (idx !== -1) {
    items.value.splice(idx, 1)
  }

  // Auto-advance to next item or exit if done
  if (items.value.length === 0) {
    exitClarifyMode()
  } else if (currentClarifyIndex.value >= items.value.length) {
    currentClarifyIndex.value = items.value.length - 1
  }
  // If currentClarifyIndex is still valid, it will auto-show the next item
}

// Drag and drop handlers
function onDragStart(evt) {
  console.log('Drag start:', evt)
  originalIndex = evt.oldIndex
  draggedItemId = items.value[evt.oldIndex]?.id
  isDragging.value = true
}

async function onDragEnd(evt) {
  console.log('Drag end:', evt)
  isDragging.value = false
  const newIndex = evt.newIndex

  // Only sync with API if position changed
  if (originalIndex !== newIndex && draggedItemId) {
    movingId.value = draggedItemId
    try {
      await moveStuff(draggedItemId, newIndex)
    } catch (e) {
      // Revert on error - reload the list
      await loadStuff({ reset: true })
    } finally {
      movingId.value = null
    }
  }

  draggedItemId = null
  originalIndex = null
}
</script>

<style scoped>
.inbox-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-right: 1px;
}

.inbox-page--clarify-mode {
  flex-direction: row;
}

.inbox-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-width: 0;
}

.inbox-page--clarify-mode .inbox-list-panel {
  flex: 0 0 320px;
  border-right: 1px solid var(--color-border-light);
}

.item-wrapper {
  border-right: 1px solid var(--color-border-light);
}

.inbox-clarify-panel {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.inbox-header {
  flex-shrink: 0;
  background: var(--color-bg-primary);
  margin-bottom: 10px;
  border-right: 1px solid var(--color-border-light);
}

.inbox-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
}

h1 {
  padding: 10px;
}

.inbox-input {
  display: flex;
  gap: 10px;
  padding: 0 10px;
}

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
}

.item-wrapper .item{
  -webkit-touch-callout: none; /* iOS Safari */
  user-select: none;
}

.item-wrapper--active .item {
  background-color: var(--color-bg-secondary);
  border-left: 3px solid var(--color-action);
}

.item-wrapper-chosen .item{
  background-color: var(--color-bg-hover);
}

.item-wrapper-ghost .item{
  background-color: var(--color-bg-primary);
}

.item-wrapper-ghost .item>* {
  opacity: 0;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn--danger {
  color: var(--color-danger);
}

.action-btn--danger:hover {
  background: var(--color-danger-light);
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

/* Responsive */
@media (max-width: 768px) {
  .inbox-page--clarify-mode .inbox-list-panel {
    flex: 1;
    border-right: none;
  }

  .inbox-clarify-panel {
    display: none;
  }
}
</style>
