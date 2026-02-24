<template>
  <DashboardLayout>
    <div class="next-page">
      <div class="next-header">
        <div class="header-row">
          <h1 class="text-h1 color-text-primary">Next</h1>
          <div class="header-actions">
            <TagFilter v-model="filterTags" />
            <Btn variant="ghost" size="sm" @click="showAdd = !showAdd">{{ showAdd ? '−' : '+' }}</Btn>
          </div>
        </div>
        <div class="add-input" v-if="showAdd">
          <Inpt
              ref="add_input"
              v-model="newTitle"
              type="text"
              placeholder="Add new action"
              @keyup.enter="onAdd"
              :disabled="loading"
          />
          <Btn @click="onAdd"
               :disabled="loading || !newTitle.trim()"
               :loading="loading"
               class="add-button"
               variant="primary"
               size="sm">
            Add
          </Btn>
        </div>
      </div>

      <div class="next-content">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
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
              <h2 class="empty-state__title">No matching actions</h2>
              <p class="empty-state__text">No actions match the selected tags.</p>
            </template>
            <template v-else>
              <ActionIcon class="empty-state__icon" />
              <h2 class="empty-state__title">No next actions</h2>
              <p class="empty-state__text">
                Clarify inbox items or create actions from projects to see them here.
              </p>
            </template>
          </template>
        </ItemList>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ItemList from '../components/ItemList.vue'
import ActionBtn from '../components/ActionBtn.vue'
import TagFilter from '../components/TagFilter.vue'
import Btn from '../components/Btn.vue'
import Inpt from '../components/Inpt.vue'
import ActionIcon from '../assets/ActionIcon.vue'
import MetadataRow from '../components/MetadataRow.vue'
import { nextActionModel } from '../scripts/nextActionModel.js'
import { contextModel } from '../scripts/contextModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'

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
} = nextActionModel()

const toaster = errorModel()
const confirm = confirmModel()

const showAdd = ref(false)
const newTitle = ref('')
const add_input = ref(null)
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

// Clear stale items immediately on mount to prevent showing old data
onMounted(() => {
  items.value = []
  loadActions({ reset: true, tags: effectiveTags.value }).catch(() => {})
})

async function loadMore() {
  await loadActions()
}

async function onAdd() {
  const t = newTitle.value.trim()
  if (!t) return
  await addAction(t)
  newTitle.value = ''
  nextTick(() => add_input.value?.focus())
}

watch(showAdd, (v) => {
  if (v) nextTick(() => add_input.value?.focus())
})

function onItemClick(item, index) {
  router.push({
    name: 'action-detail',
    params: { id: item.id },
    query: { position: index, total: totalItems.value }
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

async function onItemCheck(id, checked) {
  if (!checked) return

  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  try {
    await completeAction(id)
    toaster.success(`"${title}" completed`)
  } catch (err) {
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
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

h1 {
  padding: 10px;
}

.add-input {
  display: flex;
  gap: 10px;
  padding: 0 10px;
  margin-bottom: 5px;
}

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
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
