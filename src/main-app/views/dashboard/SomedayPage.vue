<template>
  <DashboardLayout>
    <div class="someday-page">
      <div class="someday-header">
        <div class="header-row">
          <h1 class="text-h1 color-text-primary">Someday / Maybe</h1>
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
              placeholder="Add new item"
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

      <div class="someday-content">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
            :editable="true"
            :no-checkbox="true"
            source-type="someday"
            @update="onItemUpdate"
            @click="onItemClick"
            @delete="onTrash"
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
              <FilterEmptyState title="No items for this context" :tags="effectiveTags" />
            </template>
            <template v-else>
              <SomedayIcon class="empty-state__icon" />
              <h2 class="text-h3 empty-state__title">No someday items</h2>
              <p class="text-body-m empty-state__text">
                Items you're not ready to act on yet will appear here. Clarify inbox items to someday or defer actions.
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
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import TagFilter from '../../components/TagFilter.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import SomedayIcon from '../../assets/SomedayIcon.vue'
import ItemTypeIcon from '../../components/ItemTypeIcon.vue'
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import { somedayModel } from '../../scripts/models/somedayModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'

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

async function onAdd() {
  const t = newTitle.value.trim()
  if (!t) return
  await addSomeday(t)
  newTitle.value = ''
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

  activatingId.value = id
  try {
    await activateItem(item)
    toaster.success(`"${title}" moved to ${typeLabels[item.type]}`)
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

  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: 'Are you sure you want to move this item to trash?',
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    deletingId.value = id
    try {
      await trashItem(item)
      toaster.success(`"${title}" moved to trash`)
    } catch (err) {
      toaster.push(err.message || 'Failed to trash item')
    } finally {
      deletingId.value = null
    }
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

.someday-header h1 {
  margin: 0;
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

.someday-content {
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
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}

</style>
