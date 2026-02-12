<template>
  <DashboardLayout>
    <div class="someday-page">
      <div class="someday-header">
        <h1 class="text-h1 color-text-primary">Someday / Maybe</h1>
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
          <template #prefix="{ item }">
            <span class="type-icon" :class="typeIconClass(item.type)">
              <InboxIcon v-if="item.type === 'STUFF'" />
              <NextIcon v-else-if="item.type === 'ACTION'" />
              <ProjectsIcon v-else-if="item.type === 'PROJECT'" />
            </span>
          </template>
          <template #actions="{ item }">
            <Btn variant="link" size="sm" @click.stop="onActivate(item.id)">Activate</Btn>
            <ActionBtn @click.stop="onTrash(item.id)" />
          </template>
          <template #empty>
            <SomedayIcon class="empty-state__icon" />
            <h2 class="empty-state__title">No someday items</h2>
            <p class="empty-state__text">
              Items you're not ready to act on yet will appear here. Clarify inbox items to someday or defer actions.
            </p>
          </template>
        </ItemList>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ItemList from '../components/ItemList.vue'
import ActionBtn from '../components/ActionBtn.vue'
import Btn from '../components/Btn.vue'
import SomedayIcon from '../assets/SomedayIcon.vue'
import InboxIcon from '../assets/InboxIcon.vue'
import NextIcon from '../assets/NextIcon.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import { somedayModel } from '../scripts/somedayModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  loadSomeday,
  activateItem,
  trashItem,
  updateItem,
  moveItem,
} = somedayModel()

const toaster = errorModel()
const confirm = confirmModel()

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
  loadSomeday({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadSomeday()
}

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
  return title.slice(0, maxLen).trim() + '...'
}

function onItemClick(item) {
  switch (item.type) {
    case 'STUFF':
      router.push({ name: 'stuff-detail', params: { id: item.id } })
      break
    case 'ACTION':
      router.push({ name: 'action-detail', params: { id: item.id } })
      break
    case 'PROJECT':
      router.push({ name: 'project-detail', params: { id: item.id } })
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
  margin-bottom: 10px;
}

.someday-header h1 {
  margin: 0;
  padding: 10px;
}

.someday-content {
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
