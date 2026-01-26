<template>
  <DashboardLayout>
    <div class="inbox-page">

      <!-- Fixed header -->
      <div class="inbox-header">
        <div class="title">
          <h1 class="text-h1 color-text-primary">Inbox</h1>
          <Btn
              v-if="items.length > 0"
              variant="ghost"
              size="sm"
              @click="onClarify"
          >
            Clarify
          </Btn>
        </div>

        <!-- Add Stuff -->
        <div class="inbox-input">
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

        <!-- Stuff list -->
        <div v-else class="stuff-list">
          <div
              v-for="(item, index) in items"
              :key="item.id"
              class="item-wrapper"
              :class="{ 'item-wrapper--drop-target': dropTargetIndex === index && draggingId !== item.id }"
              @dragover="onDragOver($event, index)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, index)"
          >
            <Item
                :id="item.id"
                :title="item.title"
                :loading="updatingId === item.id || deletingId === item.id"
                @update="onItemUpdate"
                @check="onItemCheck"
                @dragstart="onDragStart(item.id)"
                @dragend="onDragEnd"
            >
              <template #actions>
                <button class="action-btn action-btn--danger" @click="onDelete(item.id)">✕</button>
              </template>
            </Item>
          </div>
        </div>

        <!-- Load more -->
        <div class="load-more">
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
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "../layouts/DashboardLayout.vue";
import {ref, onMounted, nextTick, watch} from 'vue'
import { stuffModel } from '../scripts/stuffModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import Btn from "../components/Btn.vue";
import Inpt from '../components/Inpt.vue'
import Item from '../components/Item.vue'
import InboxIcon from '../assets/InboxIcon.vue'

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

const toaster = errorModel()
const confirm = confirmModel()

// local UI state
const new_stuff_title = ref('')
const add_input = ref(null)
const updatingId = ref(null)
const deletingId = ref(null)
const draggingId = ref(null)
const dropTargetIndex = ref(null)

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
})

// helpers
function focusAddInput() {
  nextTick(() => {
    add_input.value?.focus()
  })
}

watch(loading, async (v) => {
  if (!v) {
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
  // TODO: Handle check action - could mark as done or move to different bucket
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
  // TODO: Navigate to clarify view or open clarify modal for first item
  console.log('Clarify clicked')
}

// Drag and drop
function onDragStart(id) {
  draggingId.value = id
}

function onDragEnd() {
  draggingId.value = null
  dropTargetIndex.value = null
}

function onDragOver(e, index) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dropTargetIndex.value = index
}

function onDragLeave() {
  dropTargetIndex.value = null
}

async function onDrop(e, toIndex) {
  e.preventDefault()
  dropTargetIndex.value = null

  if (!draggingId.value) return

  await moveStuff(draggingId.value, toIndex)
  draggingId.value = null
}

</script>

<style scoped>
.inbox-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.inbox-header {
  flex-shrink: 0;
  background: var(--color-bg-primary);
}

.inbox-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
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

.stuff-list {
  margin-top: 16px;
}

.item-wrapper--drop-target {
  position: relative;
}

.item-wrapper--drop-target::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 2px;
  background: var(--color-action);
  border-radius: 1px;
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
</style>
