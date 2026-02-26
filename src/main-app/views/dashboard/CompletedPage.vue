<template>
  <DashboardLayout>
    <div class="completed-page">
      <div class="completed-header">
        <h1 class="text-h1 color-text-primary">Completed</h1>
      </div>

      <div class="completed-content">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :disabled="false"
            :editable="false"
            :loading-ids="loadingIds"
            @load-more="loadMore"
            @click="onItemClick"
            @check="onItemCheck"
        >
          <template #prefix="{ item }">
            <span class="type-icon" :class="typeIconClass(item.type)">
              <InboxIcon v-if="item.type === 'STUFF'" />
              <NextIcon v-else-if="item.type === 'ACTION'" />
              <ProjectsIcon v-else-if="item.type === 'PROJECT'" />
            </span>
          </template>
          <template #actions><span></span></template>
          <template #empty>
            <CompletedIcon class="empty-state__icon" />
            <h2 class="empty-state__title">No completed items</h2>
            <p class="empty-state__text">
              Items you complete will appear here. You can restore them or move them to trash.
            </p>
          </template>
        </ItemList>
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
import InboxIcon from '../../assets/InboxIcon.vue'
import NextIcon from '../../assets/NextIcon.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import { completedModel } from '../../scripts/models/completedModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  loadCompleted,
  uncompleteItem,
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
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  loadCompleted({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadCompleted()
}

function typeIconClass(type) {
  switch (type) {
    case 'STUFF': return 'type-icon--stuff'
    case 'ACTION': return 'type-icon--action'
    case 'PROJECT': return 'type-icon--project'
    default: return ''
  }
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

async function onItemCheck(id, checked) {
  if (checked) return // Already completed, ignore checking

  // Unchecking = uncomplete
  const item = items.value.find(i => i.id === id)
  if (!item) return

  const title = truncateTitle(item.title)
  undoingId.value = id
  try {
    await uncompleteItem(item)
    toaster.success(`"${title}" restored`)
  } catch (err) {
    toaster.push(err.message || 'Failed to restore item')
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
  background: var(--color-bg-primary);
  margin-bottom: 15px;
}

.completed-header h1 {
  margin: 0;
  padding: 10px;
}

.completed-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
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

.type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.type-icon :deep(svg) {
  width: 32px;
  height: 32px;
}

.type-icon--stuff {
  color: var(--color-text-secondary);
}

.type-icon--action {
  color: var(--color-action);
}

.type-icon--project {
  color: #b45309;
}

</style>
