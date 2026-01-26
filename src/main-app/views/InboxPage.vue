<template>
  <DashboardLayout>

    <div class="title">
      <h1 class="text-h1 color-text-primary">Inbox</h1>
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

    <!-- Stuff list -->
    <div class="stuff-list">
      <Item
          v-for="item in items"
          :key="item.id"
          :id="item.id"
          :title="item.title"
          :loading="updatingId === item.id"
          @update="onItemUpdate"
          @check="onItemCheck"
      >
        <template #actions>
          <button class="action-btn action-btn--danger" @click="onDelete(item.id)">✕</button>
        </template>
      </Item>
    </div>

    <!-- Load more -->
    <div class="load-more">
      <Btn
          v-if="hasMore"
          variant="ghost"
          size="sm"
          :loading="loading"
          @click="loadMore"
      >
        Load more
      </Btn>
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
} = stuffModel()

const toaster = errorModel()
const confirm = confirmModel()

// local UI state
const new_stuff_title = ref('')
const add_input = ref(null)
const updatingId = ref(null)

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
    await deleteStuff(id)
  }
}

</script>

<style scoped>
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

.action-btn {
  padding: 4px 8px;
  border: none;
  background: var(--color-bg-secondary, #f0f0f0);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  background: var(--color-bg-hover, #e0e0e0);
}

.action-btn--danger {
  color: var(--color-danger, #dc3545);
}

.action-btn--danger:hover {
  background: var(--color-danger-light, #f8d7da);
}

.load-more {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}
</style>
