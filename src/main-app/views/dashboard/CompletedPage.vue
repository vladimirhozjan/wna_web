<template>
  <DashboardLayout>
    <div class="completed-page">
      <div class="completed-header">
        <h1 class="page-title">Completed</h1>
      </div>

      <div class="completed-content">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :disabled="false"
            :editable="false"
            :loading-ids="loadingIds"
            :completing-ids="completingIds"
            :no-initial-animation="true"
            source-type="completed"
            @load-more="loadMore"
            @click="onItemClick"
            @check="onItemCheck"
        >
          <template #prefix="{ item }">
            <ItemTypeIcon :type="item.type" />
          </template>
          <template #actions><span></span></template>
          <template #empty>
            <EmptyState :icon="CompletedIcon" title="No completed items" text="Items you complete will appear here. You can restore them or move them to trash." />
          </template>
        </ItemList>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { watch, onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import CompletedIcon from '../../assets/CompletedIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import ItemTypeIcon from '../../components/ItemTypeIcon.vue'
import { completedModel } from '../../scripts/models/completedModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { hapticFeedback } from '../../scripts/core/haptics.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  loadCompleted,
  uncompleteItem,
  removeItem,
} = completedModel()

const toaster = errorModel()

const undoingId = ref(null)

const loadingIds = computed(() => {
  const ids = []
  if (undoingId.value) ids.push(undoingId.value)
  return ids
})

watch(error, (err) => {
  if (!err) return
  // Skip 409 errors — handled directly in onItemCheck with a specific message
  if (err.status === 409) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  loadCompleted({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadCompleted()
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

function onItemClick(item) {
  const idx = items.value.findIndex(i => i.id === item.id)
  const query = {
    position: idx >= 0 ? idx : 0,
    total: items.value.length,
    from: 'completed'
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

const completingIds = ref([])
const ANIM_MS = 800

async function onItemCheck(id, checked) {
  if (checked) return // Already completed, ignore checking

  // Unchecking = uncomplete
  const item = items.value.find(i => i.id === id)
  if (!item) return

  const title = truncateTitle(item.title)
  item.checked = false
  completingIds.value.push(id)
  hapticFeedback('success')
  undoingId.value = id

  try {
    await Promise.all([
      uncompleteItem(item),
      new Promise(r => setTimeout(r, ANIM_MS))
    ])
    removeItem(id)
    toaster.success(`"${title}" restored`)
    // Reload list to backfill removed item
    loadCompleted({ reset: true }).catch(() => {})
  } catch (err) {
    item.checked = true
    completingIds.value = completingIds.value.filter(x => x !== id)
    const msg = (err.status === 409 && item.type === 'ACTION')
      ? 'Cannot restore this action — its parent project is completed or trashed. Restore the project first.'
      : (err.message || 'Failed to restore item')
    toaster.push(msg)
  } finally {
    undoingId.value = null
  }
}

</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.completed-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.completed-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.completed-header h1 {
  margin: 0;
  padding: 0;
}

.completed-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}


</style>
