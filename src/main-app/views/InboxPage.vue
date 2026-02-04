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
          <ItemList
              v-model="items"
              :loading="loading"
              :has-more="hasMore && !clarifyMode"
              :loading-ids="loadingIds"
              :disabled="clarifyMode"
              :active-id="currentClarifyItem?.id ?? null"
              :editable="!clarifyMode"
              :source-type="clarifyMode ? null : 'stuff'"
              @update="onItemUpdate"
              @check="onItemCheck"
              @click="onItemClick"
              @delete="onTrash"
              @move="onMove"
              @load-more="loadMore"
          >
            <template #actions="{ item }">
              <button v-if="!clarifyMode" class="action-btn action-btn--danger" @click="onTrash(item.id)">✕</button>
            </template>
            <template #empty>
              <InboxIcon class="empty-state__icon" />
              <h2 class="empty-state__title">Your inbox is empty</h2>
              <p class="empty-state__text">
                Capture everything on your mind. Add new stuff above to get started.
              </p>
            </template>
          </ItemList>
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
import { stuffModel } from '../scripts/stuffModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import apiClient from '../scripts/apiClient.js'
import Btn from "../components/Btn.vue";
import Inpt from '../components/Inpt.vue'
import ItemList from '../components/ItemList.vue'
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
  trashStuff,
  moveStuff,
  totalItems,
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
const completingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (updatingId.value) ids.push(updatingId.value)
  if (deletingId.value) ids.push(deletingId.value)
  if (movingId.value) ids.push(movingId.value)
  if (completingId.value) ids.push(completingId.value)
  return ids
})

// Clarify mode state
const clarifyMode = ref(false)
const currentClarifyIndex = ref(0)
const isMobile = ref(false)

const currentClarifyItem = computed(() => {
  if (!clarifyMode.value) return null
  return items.value[currentClarifyIndex.value] || null
})

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
  if (clarifyMode.value) {
    currentClarifyIndex.value = index
    return
  }

  router.push({ name: 'stuff-detail', params: { id: item.id }, query: { total: totalItems.value, position: item.position } })
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

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onItemCheck(id, checked) {
  if (!checked) return // Can't uncheck - completed items aren't shown here

  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  completingId.value = id
  try {
    await apiClient.completeStuff(id)
    // Remove item from list
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      items.value.splice(idx, 1)
    }
    toaster.success(`"${title}" completed`)
  } catch (err) {
    toaster.push(err.message || 'Failed to complete item')
  } finally {
    completingId.value = null
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
      await trashStuff(id)
      toaster.success(`"${title}" moved to trash`)
    } finally {
      deletingId.value = null
    }
  }
}

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    await moveStuff(id, newIndex)
  } catch (e) {
    await loadStuff({ reset: true })
  } finally {
    movingId.value = null
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
  const idx = items.value.findIndex(i => i.id === processedItem.id)
  if (idx !== -1) {
    items.value.splice(idx, 1)
  }

  if (items.value.length === 0) {
    exitClarifyMode()
  } else if (currentClarifyIndex.value >= items.value.length) {
    currentClarifyIndex.value = items.value.length - 1
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
