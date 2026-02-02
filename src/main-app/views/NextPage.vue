<template>
  <DashboardLayout>
    <div class="next-page">
      <div class="next-header">
        <h1 class="text-h1 color-text-primary">Next</h1>
      </div>

      <div class="next-content">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onDelete"
            @move="onMove"
            @load-more="loadMore"
        >
          <template #empty>
            <ActionIcon class="empty-state__icon" />
            <h2 class="empty-state__title">No next actions</h2>
            <p class="empty-state__text">
              Clarify inbox items or create actions from projects to see them here.
            </p>
          </template>
        </ItemList>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ItemList from '../components/ItemList.vue'
import ActionIcon from '../assets/ActionIcon.vue'
import { nextActionModel } from '../scripts/nextActionModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'

const {
  items,
  loading,
  error,
  hasMore,
  loadActions,
  updateAction,
  deleteAction,
  moveAction,
  completeAction,
} = nextActionModel()

const toaster = errorModel()
const confirm = confirmModel()

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
  loadActions({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadActions()
}

function onItemClick(item) {
  // TODO: navigate to action detail page
  console.log('Action clicked:', item.id)
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

function onItemCheck(id, checked) {
  const item = items.value.find(i => i.id === id)
  if (item) item.checked = checked
  if (checked) {
    completeAction(id)
  }
}

async function onDelete(id) {
  const confirmed = await confirm.show({
    title: 'Delete action',
    message: 'Are you sure you want to delete this action?',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    deletingId.value = id
    try {
      await deleteAction(id)
    } finally {
      deletingId.value = null
    }
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
.next-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.next-header {
  flex-shrink: 0;
  background: var(--color-bg-primary);
  margin-bottom: 10px;
}

h1 {
  padding: 10px;
}

.next-content {
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
</style>
