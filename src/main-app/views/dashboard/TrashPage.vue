<template>
  <DashboardLayout>
    <div class="trash-page">
      <div class="trash-header">
        <h1 class="text-h1 color-text-primary">Trash</h1>
        <div class="trash-actions">
          <Btn variant="ghost" size="sm" @click="onEmptyTrash" :disabled="items.length === 0">
            Empty Trash
          </Btn>
        </div>
      </div>

      <div class="trash-content">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :disabled="true"
            :editable="false"
            :no-checkbox="true"
            @load-more="loadMore"
        >
          <template #prefix="{ item }">
            <ItemTypeIcon :type="item.type" />
          </template>
          <template #actions="{ item }">
            <Btn variant="link" size="sm" @click="onRestoreOne(item)">Restore</Btn>
          </template>
          <template #empty>
            <TrashIcon class="empty-state__icon" />
            <h2 class="empty-state__title">Trash is empty</h2>
            <p class="empty-state__text">
              Items you delete will appear here. You can restore them or empty the trash permanently.
            </p>
          </template>
        </ItemList>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import Btn from '../../components/Btn.vue'
import TrashIcon from '../../assets/TrashIcon.vue'
import ItemTypeIcon from '../../components/ItemTypeIcon.vue'
import { trashModel } from '../../scripts/models/trashModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'

const {
  items,
  loading,
  error,
  hasMore,
  loadTrash,
  restoreItem,
  emptyTrash,
} = trashModel()

const toaster = errorModel()
const confirm = confirmModel()

watch(error, (err) => {
  if (!err) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  loadTrash({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadTrash()
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onRestoreOne(item) {
  const title = truncateTitle(item.title)
  try {
    await restoreItem(item)
    toaster.success(`"${title}" restored`)
  } catch (err) {
    toaster.push(err.message || 'Failed to restore item')
  }
}

async function onEmptyTrash() {
  const confirmed = await confirm.show({
    title: 'Empty Trash',
    message: 'Are you sure you want to permanently delete all items in trash? This cannot be undone.',
    confirmText: 'Empty Trash',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    try {
      await emptyTrash()
      toaster.success('Trash emptied')
    } catch (err) {
      toaster.push(err.message || 'Failed to empty trash')
    }
  }
}
</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.trash-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.trash-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-primary);
  margin-bottom: 15px;
}

.trash-header h1 {
  margin: 0;
  padding: 10px;
}

.trash-actions {
  display: flex;
  gap: 8px;
  padding-right: 10px;
}

.trash-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
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

/* Remove action color on click/active */
.trash-content :deep(.item:not(.item--no-hover):active) {
  background: var(--color-bg-hover) !important;
}
</style>
