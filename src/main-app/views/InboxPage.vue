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
        <div v-else class="stuff-list" :class="{ 'stuff-list--dragging': draggingId || isDropping }"
             @dragover="onListDragOver"
        >
          <div
              v-for="(item, index) in items"
              :key="item.id"
              class="item-wrapper"
              :class="{
                'item-wrapper--drop-target': dropTargetIndex === index && draggingId !== item.id,
                'item-wrapper--dragging': draggingId === item.id,
                'item-wrapper--appearing': appearingId === item.id
              }"
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
          <!-- Drop zone at end of list -->
          <div
              v-if="draggingId"
              class="item-wrapper item-wrapper--end"
              :class="{ 'item-wrapper--drop-target': dropTargetIndex === items.length }"
              @dragover="onDragOver($event, items.length)"
              @dragleave="onDragLeave"
              @drop="onDrop($event, items.length)"
          ></div>
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
const appearingId = ref(null)

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
const isDropping = ref(false)

function onDragStart(id) {
  draggingId.value = id
  isDropping.value = false
  // Show placeholder on next item (visually in place of collapsed dragged item)
  const index = items.value.findIndex(i => i.id === id)
  dropTargetIndex.value = index + 1
}

function onDragEnd() {
  // Only reset if not handled by onDrop
  if (!isDropping.value) {
    draggingId.value = null
    dropTargetIndex.value = null
  }
}

function onDragOver(e, index) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'

  const item = items.value[index]
  const draggingIndex = items.value.findIndex(i => i.id === draggingId.value)

  // Skip the dragged item's own wrapper (it's collapsed, so midpoint calc is wrong)
  if (item && item.id === draggingId.value) {
    return
  }

  // Get the actual Item element's rect (not the wrapper with padding)
  const itemElement = e.currentTarget.querySelector('.item')
  const rect = itemElement ? itemElement.getBoundingClientRect() : e.currentTarget.getBoundingClientRect()
  const midpoint = rect.top + rect.height / 2
  const isTopHalf = e.clientY < midpoint

  // Helper to set dropTargetIndex, skipping the dragged item's index
  // (placeholder can't show on dragged item due to template condition)
  function setDropTarget(newIndex) {
    if (newIndex === draggingIndex) {
      // Skip dragged item's index - use index+1 instead (visually same position)
      dropTargetIndex.value = draggingIndex + 1
    } else {
      dropTargetIndex.value = newIndex
    }
  }

  // Check if dragged item is between current hover position and placeholder
  const placeholderIdx = dropTargetIndex.value
  const isDraggedItemBetween = draggingIndex !== -1 && placeholderIdx !== null && (
    (index < draggingIndex && placeholderIdx > draggingIndex) ||
    (index > draggingIndex && placeholderIdx <= draggingIndex)
  )

  if (dropTargetIndex.value === null) {
    // First hover - set initial position
    setDropTarget(isTopHalf ? index : index + 1)
  } else if (isDraggedItemBetween) {
    // Dragged item is between us and placeholder - allow free movement past it
    setDropTarget(isTopHalf ? index : index + 1)
  } else if (isTopHalf && dropTargetIndex.value === index + 1) {
    // Top half of item immediately above placeholder -> move up
    setDropTarget(index)
  } else if (!isTopHalf && dropTargetIndex.value === index) {
    // Bottom half of item immediately below placeholder -> move down
    setDropTarget(index + 1)
  }
}

function onDragLeave() {
  // Don't clear - keep placeholder visible while dragging
}

function onListDragOver(e) {
  // Handle dragover on the list container (gaps between items, collapsed item area)
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  // Keep current dropTargetIndex - don't change it
}

async function onDrop(e, toIndex) {
  e.preventDefault()
  isDropping.value = true

  if (!draggingId.value) return

  const id = draggingId.value

  // 1. Reorder the list (item moves to new position in DOM)
  await moveStuff(id, toIndex)

  // 2. Show the item instantly (no max-height animation)
  appearingId.value = id
  draggingId.value = null

  // 3. Wait a frame for the item to render
  await nextTick()

  // 4. Close the gap around the item
  dropTargetIndex.value = null

  // 5. Clear appearing state after gap animation
  setTimeout(() => {
    appearingId.value = null
  }, 250)

  // 6. Re-enable hover only after mouse moves
  const onMouseMove = () => {
    isDropping.value = false
    document.removeEventListener('mousemove', onMouseMove)
  }
  document.addEventListener('mousemove', onMouseMove, { once: true })
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
  user-select: none;
}

.stuff-list--dragging .item-wrapper {
  pointer-events: auto;
}

.stuff-list--dragging :deep(.item:hover) {
  background: var(--color-bg-primary);
}

.item-wrapper {
  max-height: 200px;
  overflow: hidden;
  transition: padding 0.2s ease, max-height 0.2s ease, opacity 0.2s ease;
}

.item-wrapper--dragging {
  max-height: 1px;
  opacity: 0;
  padding: 0;
}

.item-wrapper--appearing {
  transition: padding 0.2s ease;
}

.item-wrapper--drop-target {
  padding-top: 52px;
  position: relative;
}

.item-wrapper--drop-target::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 16px;
  right: 16px;
  height: 36px;
  background: var(--color-action);
  opacity: 0.15;
  border-radius: 6px;
  border: 2px dashed var(--color-action);
  pointer-events: none;
}

.item-wrapper--end {
  min-height: 60px;
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
