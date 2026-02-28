<template>
  <div class="recurring-view">
    <div class="recurring-view__header">
      <div class="recurring-view__header-actions">
        <Btn variant="ghost" size="sm" @click="showAdd = !showAdd">{{ showAdd ? '−' : '+' }}</Btn>
      </div>
    </div>
    <div class="recurring-view__add" v-if="showAdd">
      <Inpt
          ref="add_input"
          v-model="newTitle"
          type="text"
          placeholder="New recurring template"
          @keyup.enter="onAdd"
          :disabled="adding"
      />
      <Btn @click="onAdd"
           :disabled="adding || !newTitle.trim()"
           :loading="adding"
           class="recurring-view__add-btn"
           variant="primary"
           size="sm">
        Add
      </Btn>
    </div>

    <div class="recurring-view__content">
      <ItemList
          v-model="items"
          :loading="loading"
          :has-more="false"
          :loading-ids="loadingIds"
          no-checkbox
          :disabled="true"
          @click="onItemClick"
          @delete="onDelete"
      >
        <template #subtitle="{ item }">
          <MetadataRow :item="item" entity-type="recurring" />
        </template>
        <template #actions="{ item }">
          <ActionBtn @click="onDelete(item.id)" />
        </template>
        <template #empty>
          <svg class="recurring-view__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>
          </svg>
          <h2 class="text-h3 empty-state__title">No recurring templates</h2>
          <p class="text-body-m empty-state__text">
            Create recurring templates to automatically schedule actions on a repeating basis.
          </p>
        </template>
      </ItemList>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ItemList from '../ItemList.vue'
import ActionBtn from '../ActionBtn.vue'
import Btn from '../Btn.vue'
import Inpt from '../Inpt.vue'
import MetadataRow from '../MetadataRow.vue'
import { recurringModel } from '../../scripts/models/recurringModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'

const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()

const {
  items,
  loading,
  error,
  loadRecurring,
  createRecurring,
  deleteRecurring,
} = recurringModel()

const showAdd = ref(false)
const newTitle = ref('')
const add_input = ref(null)
const adding = ref(false)
const deletingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (deletingId.value) ids.push(deletingId.value)
  return ids
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  items.value = []
  loadRecurring().catch(() => {})
})

watch(showAdd, (v) => {
  if (v) nextTick(() => add_input.value?.focus())
})

async function onAdd() {
  const t = newTitle.value.trim()
  if (!t || adding.value) return

  adding.value = true
  try {
    const created = await createRecurring({ title: t, recurrence_rule: 'FREQ=WEEKLY' })
    newTitle.value = ''
    nextTick(() => add_input.value?.focus())
    router.push({ name: 'recurring-detail', params: { id: created.id } })
  } catch (err) {
    toaster.push(err.message || 'Failed to create template')
  } finally {
    adding.value = false
  }
}

function onItemClick(item) {
  router.push({ name: 'recurring-detail', params: { id: item.id } })
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onDelete(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  const confirmed = await confirm.show({
    title: 'Delete Template',
    message: `Are you sure you want to delete "${item?.title || 'this template'}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (!confirmed) return

  deletingId.value = id
  try {
    await deleteRecurring(id)
    toaster.success(`"${title}" deleted`)
  } catch (err) {
    toaster.push(err.message || 'Failed to delete template')
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.recurring-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recurring-view__header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 10px;
}

.recurring-view__header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.recurring-view__add {
  display: flex;
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 5px;
}

.recurring-view__add-btn {
  margin-top: 8px;
  margin-bottom: 4px;
}

.recurring-view__content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.recurring-view__empty-icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state__title {
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}
</style>
