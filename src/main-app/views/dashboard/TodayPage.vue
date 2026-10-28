<template>
    <div class="today-page">
      <div class="today-header">
        <div class="header-row">
          <h1 class="page-title">Today</h1>
          <div class="header-actions" v-if="items.length > 0">
            <TagFilter v-model="filterTags" />
            <Btn variant="secondary" size="sm" @click="showAdd = !showAdd">{{ showAdd ? '−' : '+' }}</Btn>
          </div>
        </div>
        <div class="add-input" v-if="showAdd">
          <Inpt
              ref="add_input"
              v-model="newTitle"
              type="text"
              placeholder="Add new action"
              @keyup.enter="onAdd"
              :disabled="adding"
          />
          <Btn @click="onAdd"
               :disabled="adding || !newTitle.trim()"
               :loading="adding"
               class="add-button"
               variant="primary"
               size="sm">
            Add
          </Btn>
        </div>
      </div>

      <PullToRefresh class="today-content" :refresh="onRefresh" :disabled="loading && items.length === 0">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading && !adding"
            :has-more="adding ? hasMoreSnapshot : hasMore"
            :loading-ids="loadingIds"
            :completing-ids="completingIds"
            :disabled="adding"
            source-type="action"
            swipe-right="complete"
            swipe-left="trash"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onTrash"
            @swipe-right="id => onItemCheck(id, true)"
            @swipe-left="onTrash"
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
              <FilterEmptyState title="This context is clear" :tags="effectiveTags" />
            </template>
            <template v-else>
              <EmptyState :icon="TodayIcon" title="A clear day ahead" text="Pick the few actions that matter most today and move them here." buttonText="Add Action" @action="openAdd" />
            </template>
          </template>
        </ItemList>
        </div>
      </PullToRefresh>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ItemList from '../../components/ItemList.vue'
import PullToRefresh from '../../components/PullToRefresh.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import TagFilter from '../../components/TagFilter.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import TodayIcon from '../../assets/TodayIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import { todayModel } from '../../scripts/models/todayModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { undoModel } from '../../scripts/core/undoModel.js'
import { hapticFeedback } from '../../scripts/core/haptics.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  totalItems,
  loadActions,
  addAction,
  updateAction,
  trashAction,
  moveAction,
  completeAction,
  removeItem,
} = todayModel()

const toaster = errorModel()
const undo = undoModel()

const showAdd = ref(false)
const newTitle = ref('')
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
  loadActions({ reset: true, tags })
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
  items.value = []
  loadActions({ reset: true, tags: effectiveTags.value }).catch(() => {})
})

async function loadMore() {
  await loadActions()
}

function onRefresh() {
  return loadActions({ reset: true, tags: effectiveTags.value })
}
undo.registerRefresh(onRefresh)
onAssistantChange(onRefresh)

async function onAdd() {
  const t = newTitle.value.trim()
  if (!t) return
  hasMoreSnapshot.value = hasMore.value
  adding.value = true
  try { await addAction(t) } catch { /* error watcher handles it */ }
  finally { adding.value = false }
  newTitle.value = ''
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
    query: { position: index, total: totalItems.value, from: 'today' }
  })
}

async function onItemUpdate(id, { title }) {
  const item = items.value.find(i => i.id === id)
  const oldTitle = item?.title
  if (item) item.title = title

  updatingId.value = id
  try {
    await updateAction(id, { title })
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
      completeAction(id),
      new Promise(r => setTimeout(r, ANIM_MS))
    ])
    removeItem(id)
    undo.record({ op: 'complete', item, title, message: `"${title}" completed` })
    // Reload list to backfill removed item
    loadActions({ reset: true, tags: effectiveTags.value }).catch(() => {})
  } catch (err) {
    if (item) item.checked = false
    toaster.push(err.message || 'Failed to complete action')
  } finally {
    completingIds.value = completingIds.value.filter(x => x !== id)
  }
}

async function onTrash(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  deletingId.value = id
  try {
    await trashAction(id)
    undo.record({ op: 'trash', item, title, message: `"${title}" moved to trash` })
    // Reload list to backfill removed item
    loadActions({ reset: true, tags: effectiveTags.value }).catch(() => {})
  } finally {
    deletingId.value = null
  }
}

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    await moveAction(id, newIndex)
  } catch (e) {
    await loadActions({ reset: true })
  } finally {
    movingId.value = null
  }
}

</script>

<style scoped>
.today-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.today-header {
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

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
}

.today-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

</style>
