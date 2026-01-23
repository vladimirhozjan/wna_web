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
    <ul class="stuff-list">
      <li v-for="item in items" :key="item.id" class="stuff-item">
        <span class="title">{{ item.title }}</span>

        <div class="actions">
          <button @click="onEdit(item)">Edit</button>
          <button @click="onDelete(item.id)">✕</button>
        </div>
      </li>
    </ul>

    <!-- Load more -->
    <div class="load-more">
      <button v-if="hasMore && !loading" @click="loadMore">
        Load more
      </button>
      <span v-if="loading">Loading…</span>
    </div>

    <!-- Simple edit box (inline, minimal) -->
    <div v-if="editing" class="edit-box">
      <h4>Edit stuff</h4>

      <input
          v-model="edit_title"
          @keyup.enter="onSaveEdit"
      />

      <div class="edit-actions">
        <button @click="onSaveEdit">Save</button>
        <button @click="onCancelEdit">Cancel</button>
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

const editing = ref(false)
const edit_id = ref(null)
const edit_title = ref('')

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

function onEdit(item) {
  editing.value = true
  edit_id.value = item.id
  edit_title.value = item.title
}

async function onSaveEdit() {
  const t = (edit_title.value ?? '').toString().trim()
  if (!t) return

  await updateStuff(edit_id.value, { title: t })

  editing.value = false
  edit_id.value = null
  edit_title.value = ''
}

function onCancelEdit() {
  editing.value = false
  edit_id.value = null
  edit_title.value = ''
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
  list-style: none;
  padding: 0;
}

.stuff-item {
  display: flex;
  justify-content: space-between;
  padding: 20px 10px;
  border-bottom: 1px solid #ddd;
}

.actions button {
  margin-left: 6px;
}

.edit-box {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #ccc;
}

.load-more  {
  margin: 10px;
}
</style>
