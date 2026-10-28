<template>
    <div class="someday-page">
      <div class="someday-header">
        <div class="header-row">
          <h1 class="page-title">Someday / Maybe</h1>
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
              placeholder="Add new item"
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

      <PullToRefresh class="someday-content" :refresh="onRefresh" :disabled="loading && items.length === 0">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading && !adding"
            :has-more="adding ? hasMoreSnapshot : hasMore"
            :loading-ids="loadingIds"
            :disabled="adding"
            :editable="true"
            :no-checkbox="true"
            source-type="someday"
            swipe-left="trash"
            @update="onItemUpdate"
            @click="onItemClick"
            @delete="onTrash"
            @swipe-left="onTrash"
            @move="onMove"
            @load-more="loadMore"
        >
          <template #subtitle="{ item }">
            <MetadataRow
                v-if="item.type !== 'STUFF'"
                :item="item"
                :entity-type="item.type === 'PROJECT' ? 'project' : 'action'"
            />
          </template>
          <template #prefix="{ item }">
            <ItemTypeIcon :type="item.type" />
          </template>
          <template #actions="{ item }">
            <Btn variant="link" size="sm" @click.stop="onActivate(item.id)">Activate</Btn>
            <ActionBtn @click.stop="onTrash(item.id)" />
          </template>
          <template #empty>
            <template v-if="filterTags.length || activeTag">
              <FilterEmptyState title="No someday ideas in this context" :tags="effectiveTags" />
            </template>
            <template v-else>
              <EmptyState :icon="SomedayIcon" title="Someday is wide open" text="Park the ideas you're not ready to commit to — clarify them here from your inbox, or defer an action. They'll wait for your weekly review." buttonText="Add Item" @action="openAdd" />
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
import SomedayIcon from '../../assets/SomedayIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import ItemTypeIcon from '../../components/ItemTypeIcon.vue'
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import { somedayModel } from '../../scripts/models/somedayModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { undoModel } from '../../scripts/core/undoModel.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  loadSomeday,
  addSomeday,
  activateItem,
  trashItem,
  updateItem,
  moveItem,
} = somedayModel()

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
  loadSomeday({ reset: true, tags })
})

const updatingId = ref(null)
const deletingId = ref(null)
const activatingId = ref(null)
const movingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (updatingId.value) ids.push(updatingId.value)
  if (deletingId.value) ids.push(deletingId.value)
  if (activatingId.value) ids.push(activatingId.value)
  if (movingId.value) ids.push(movingId.value)
  return ids
})

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  loadSomeday({ reset: true, tags: effectiveTags.value }).catch(() => {})
})

async function loadMore() {
  await loadSomeday()
}

function onRefresh() {
  return loadSomeday({ reset: true, tags: effectiveTags.value })
}
undo.registerRefresh(onRefresh)
onAssistantChange(onRefresh)

async function onAdd() {
  const t = newTitle.value.trim()
  if (!t) return
  hasMoreSnapshot.value = hasMore.value
  adding.value = true
  try { await addSomeday(t) } catch { /* error watcher handles it */ }
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

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    await moveItem(id, newIndex)
  } catch (e) {
    await loadSomeday({ reset: true })
  } finally {
    movingId.value = null
  }
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '...'
}

function onItemClick(item) {
  const idx = items.value.findIndex(i => i.id === item.id)
  const query = {
    position: idx >= 0 ? idx : 0,
    total: items.value.length,
    from: 'someday'
  }

  switch (item.type) {
    case 'STUFF':
      router.push({ name: 'stuff-detail', params: { id: item.id }, query })
      break
    case 'ACTION':
      router.push({ name: 'action-detail', params: { id: item.id }, query })
      break
    case 'PROJECT':
      router.push({ name: 'project-detail', params: { id: item.id }, query })
      break
  }
}

async function onItemUpdate(id, { title }) {
  const item = items.value.find(i => i.id === id)
  if (!item) return

  const oldTitle = item.title
  item.title = title

  updatingId.value = id
  try {
    await updateItem(item, { title })
  } catch (e) {
    item.title = oldTitle
  } finally {
    updatingId.value = null
  }
}

async function onActivate(id) {
  const item = items.value.find(i => i.id === id)
  if (!item) return

  const title = truncateTitle(item.title)
  const typeLabels = {
    STUFF: 'Inbox',
    ACTION: 'Next Actions',
    PROJECT: 'Projects'
  }
  const targetStates = { STUFF: 'INBOX', ACTION: 'NEXT', PROJECT: 'ACTIVE' }

  activatingId.value = id
  try {
    await activateItem(item)
    undo.record({ op: 'move', item, title, to: targetStates[item.type], message: `"${title}" moved to ${typeLabels[item.type]}` })
    // Reload list to backfill removed item
    loadSomeday({ reset: true, tags: effectiveTags.value }).catch(() => {})
  } catch (err) {
    toaster.push(err.message || 'Failed to activate item')
  } finally {
    activatingId.value = null
  }
}

async function onTrash(id) {
  const item = items.value.find(i => i.id === id)
  if (!item) return

  const title = truncateTitle(item.title)

  deletingId.value = id
  try {
    const result = await trashItem(item)
    const message = result?.trashed_actions > 0 ? `"${title}" and its actions moved to trash` : `"${title}" moved to trash`
    undo.record({ op: 'trash', item, title, message })
    // Reload list to backfill removed item
    loadSomeday({ reset: true, tags: effectiveTags.value }).catch(() => {})
  } catch (err) {
    toaster.push(err.message || 'Failed to trash item')
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.someday-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.someday-header {
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

.someday-header h1 {
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

.someday-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}


</style>
