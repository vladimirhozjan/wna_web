<template>
  <DashboardLayout>
    <div class="projects-page">
      <div class="projects-header">
        <h1 class="text-h1 color-text-primary">Projects</h1>
      </div>

      <div class="projects-content">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
            :no-checkbox="true"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onTrash"
            @move="onMove"
            @load-more="loadMore"
        >
          <template #actions="{ item }">
            <button class="action-btn action-btn--danger" @click="onTrash(item.id)">✕</button>
          </template>
          <template #empty>
            <ProjectsIcon class="empty-state__icon" />
            <h2 class="empty-state__title">No projects</h2>
            <p class="empty-state__text">
              Projects are created when you clarify inbox items that require multiple actions.
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
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import { projectModel } from '../scripts/projectModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  totalItems,
  loadProjects,
  updateProject,
  trashProject,
  moveProject,
} = projectModel()

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
  loadProjects({ reset: true }).catch(() => {})
})

async function loadMore() {
  await loadProjects()
}

function onItemClick(item, index) {
  router.push({
    name: 'project-detail',
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
    await updateProject(id, { title })
  } catch (e) {
    if (item) item.title = oldTitle
  } finally {
    updatingId.value = null
  }
}

function onItemCheck(id, checked) {
  // Projects don't have a check/complete action
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onTrash(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  const confirmed = await confirm.show({
    title: 'Move to Trash',
    message: 'Are you sure you want to move this project to trash?',
    confirmText: 'Move to Trash',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    deletingId.value = id
    try {
      await trashProject(id)
      toaster.success(`"${title}" moved to trash`)
    } finally {
      deletingId.value = null
    }
  }
}

async function onMove(id, newIndex) {
  movingId.value = id
  try {
    await moveProject(id, newIndex)
  } catch (e) {
    await loadProjects({ reset: true })
  } finally {
    movingId.value = null
  }
}
</script>

<style scoped>
.projects-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.projects-header {
  flex-shrink: 0;
  background: var(--color-bg-primary);
  margin-bottom: 10px;
}

h1 {
  padding: 10px;
}

.projects-content {
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

.action-btn {
  padding: 4px 8px;
  border: none;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  background: var(--color-bg-hover);
}

.action-btn--danger {
  color: var(--color-danger);
}

.action-btn--danger:hover {
  background: var(--color-danger-light);
}
</style>
