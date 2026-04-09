<template>
  <DashboardLayout>
    <div class="waiting-page">
      <div class="waiting-header">
        <div class="header-row">
          <h1 class="page-title">Waiting For</h1>
          <div class="header-actions" v-if="items.length > 0">
            <TagFilter v-model="filterTags" />
            <Btn variant="secondary" size="sm" @click="showAdd = !showAdd">{{ showAdd ? '−' : '+' }}</Btn>
          </div>
        </div>
        <div class="add-input" v-if="showAdd">
          <div class="add-fields">
            <Inpt
                ref="add_input"
                v-model="newTitle"
                type="text"
                placeholder="Add new action"
                @keyup.enter="onAdd"
                :disabled="adding"
            />
            <Inpt
                v-model="newWaitingFor"
                type="text"
                placeholder="Waiting for..."
                @keyup.enter="onAdd"
                :disabled="adding"
            />
          </div>
          <Btn @click="onAdd"
               :disabled="adding || !newTitle.trim() || !newWaitingFor.trim()"
               :loading="adding"
               class="add-button"
               variant="primary"
               size="sm">
            Add
          </Btn>
        </div>
      </div>

      <div class="waiting-content">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading && !adding"
            :has-more="adding ? hasMoreSnapshot : hasMore"
            :loading-ids="loadingIds"
            :completing-ids="completingIds"
            :disabled="adding"
            source-type="action"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onTrash"
            @move="onMove"
            @load-more="loadMore"
        >
          <template #subtitle="{ item }">
            <MetadataRow :item="item" entity-type="action" />
          </template>
          <template #actions="{ item }">
            <ActionBtn @click="onTrash(item.id)" />
          </template>
          <template #empty>
            <template v-if="filterTags.length || activeTag">
              <FilterEmptyState title="No actions for this context" :tags="effectiveTags" />
            </template>
            <template v-else>
              <EmptyState :icon="WaitingIcon" title="Nothing waiting" text="Move actions here when you're waiting on someone or something." buttonText="Add Action" @action="openAdd" />
            </template>
          </template>
        </ItemList>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import TagFilter from '../../components/TagFilter.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import WaitingIcon from '../../assets/WaitingIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import { waitingModel } from '../../scripts/models/waitingModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { hapticFeedback } from '../../scripts/core/haptics.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  totalItems,
  loadWaiting,
  addWaiting,
  updateWaiting,
  trashWaiting,
  moveWaiting,
  completeWaiting,
  removeItem,
} = waitingModel()

const toaster = errorModel()
const confirm = confirmModel()

const showAdd = ref(false)
const newTitle = ref('')
const newWaitingFor = ref('')
const add_input = ref(null)
const adding = ref(false)
const hasMoreSnapshot = ref(false)
const filterTags = ref([])
const { activeTag } = contextModel()

const effectiveTags = computed(() => {
  const tags = [...filterTags.value]
  if (activeTag.value && !tags.includes(activeTag.value)) {
    tags.push(activeTag.value)
  }
  return tags
})

watch(effectiveTags, (tags) => {
  loadWaiting({ reset: true, tags })
})

const updatingId = ref(null)
const deletingId = ref(null)
const movingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (updatingId.value) ids.push(updatingId.value)
  if (deletingId.value) ids.push(deletingId.value)
  if (movingId.value) ids.push(movingId.value)
  return ids
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  loadWaiting({ reset: true, tags: effectiveTags.value }).catch(() => {})
})

async function loadMore() {
  await loadWaiting()
}

async function onAdd() {
  const t = newTitle.value.trim()
  const w = newWaitingFor.value.trim()
  if (!t || !w) return
  hasMoreSnapshot.value = hasMore.value
  adding.value = true
  try { await addWaiting(t, w) } catch { /* error watcher handles it */ }
  finally { adding.value = false }
  newTitle.value = ''
  newWaitingFor.value = ''
  nextTick(() => add_input.value?.focus())
}

function openAdd() {
  showAdd.value = true
  nextTick(() => add_input.value?.focus())
}

watch(showAdd, (v) => {
  if (v) nextTick(() => add_input.value?.focus())
})

function onItemClick(item, index) {
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
  return title.slice(0, maxLen).trim() + '…'
}

const completingIds = ref([])
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
      completeWaiting(id),
      new Promise(r => setTimeout(r, ANIM_MS))
    ])
    removeItem(id)
    toaster.success(`"${title}" completed`)
    // Reload list to backfill removed item
    loadWaiting({ reset: true, tags: effectiveTags.value }).catch(() => {})
  } catch (err) {
    if (item) item.checked = false
    completingIds.value = completingIds.value.filter(x => x !== id)
    toaster.push(err.message || 'Failed to complete action')
  }
}

async function onTrash(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: 'Are you sure you want to move this action to trash?',
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    deletingId.value = id
    try {
      await trashWaiting(id)
      toaster.success(`"${title}" moved to trash`)
      // Reload list to backfill removed item
      loadWaiting({ reset: true, tags: effectiveTags.value }).catch(() => {})
    } finally {
      deletingId.value = null
    }
  }
}

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    await moveWaiting(id, newIndex)
  } catch (e) {
    await loadWaiting({ reset: true })
  } finally {
    movingId.value = null
  }
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
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 {
  margin: 0;
  padding: 0;
}

.add-input {
  display: flex;
  gap: 10px;
  padding: 0;
  margin-bottom: 5px;
}

.add-fields {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
}

.waiting-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

</style>
