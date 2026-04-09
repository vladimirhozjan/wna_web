<template>
  <DashboardLayout>
    <div class="overdue-page">
      <div class="overdue-header">
        <h1 class="page-title">Overdue</h1>
      </div>

      <div class="overdue-content">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
            :completing-ids="completingIds"
            source-type="action"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onTrash"
            @load-more="loadMore"
        >
          <template #subtitle="{ item }">
            <MetadataRow :item="item" entity-type="action" />
          </template>
          <template #actions="{ item }">
            <ActionBtn @click="onTrash(item.id)" />
          </template>
          <template #empty>
            <WarningIcon class="empty-state__icon" />
            <h2 class="text-h3 empty-state__title">No overdue items</h2>
            <p class="text-body-m empty-state__text">
              You're all caught up. Overdue actions will appear here when they pass their due date.
            </p>
          </template>
        </ItemList>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
import { overdueModel } from '../../scripts/models/overdueModel.js'
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
  loadItems,
  updateAction,
  trashAction,
  completeAction,
  removeItem,
} = overdueModel()

const toaster = errorModel()
const confirm = confirmModel()

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

function onItemClick(item, index) {
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
    toaster.success(`"${title}" completed`)
    // Reload list to backfill removed item
    loadItems({ reset: true }).catch(() => {})
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
      await trashAction(id)
      toaster.success(`"${title}" moved to trash`)
      // Reload list to backfill removed item
      loadItems({ reset: true }).catch(() => {})
    } finally {
      deletingId.value = null
    }
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

.empty-state__icon {
  width: 40px;
  height: 40px;
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
