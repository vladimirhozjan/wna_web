<template>
  <DashboardLayout>
    <div class="overdue-page">
      <div class="overdue-header">
        <h1 class="page-title">Overdue</h1>
      </div>

      <PullToRefresh class="overdue-content" :refresh="onRefresh" :disabled="loading && items.length === 0">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
            :completing-ids="completingIds"
            :reorderable="false"
            swipe-right="complete"
            swipe-left="trash"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onTrash"
            @swipe-right="id => onItemCheck(id, true)"
            @swipe-left="onTrash"
            @load-more="loadMore"
        >
          <template #subtitle="{ item }">
            <MetadataRow :item="item" entity-type="action" />
          </template>
          <template #actions="{ item }">
            <ActionBtn @click="onTrash(item.id)" />
          </template>
          <template #empty>
            <EmptyState :icon="WarningIcon" title="All caught up" text="Nothing has slipped past its due date. If something does, it shows up here." />
          </template>
        </ItemList>
        </div>
      </PullToRefresh>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import PullToRefresh from '../../components/PullToRefresh.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import { overdueModel } from '../../scripts/models/overdueModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { undoModel } from '../../scripts/core/undoModel.js'
import { hapticFeedback } from '../../scripts/core/haptics.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  totalItems,
  loadItems,
  updateAction,
  trashAction,
  completeAction,
  removeItem,
} = overdueModel()

const toaster = errorModel()
const undo = undoModel()

const updatingId = ref(null)
const deletingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (updatingId.value) ids.push(updatingId.value)
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
  loadItems({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadItems()
}

function onRefresh() {
  return loadItems({ reset: true })
}
undo.registerRefresh(onRefresh)

function onItemClick(item) {
  router.push({
    name: 'action-detail',
    params: { id: item.id },
    query: { from: 'overdue' }
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
  return title.slice(0, maxLen).trim() + '\u2026'
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
    undo.record({ op: 'complete', item, title, message: `"${title}" completed`, reorder: false })
    // Reload list to backfill removed item
    loadItems({ reset: true }).catch(() => {})
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
    undo.record({ op: 'trash', item, title, message: `"${title}" moved to trash`, reorder: false })
    // Reload list to backfill removed item
    loadItems({ reset: true }).catch(() => {})
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
.overdue-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.overdue-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.page-title {
  padding: 0;
}

.overdue-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

</style>
