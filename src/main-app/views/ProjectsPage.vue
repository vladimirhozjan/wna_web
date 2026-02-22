<template>
  <DashboardLayout>
    <div class="projects-page">
      <div class="projects-header">
        <div class="header-row">
          <h1 class="text-h1 color-text-primary">Projects</h1>
          <Btn variant="ghost" size="sm" @click="showAdd = !showAdd">{{ showAdd ? '−' : '+' }}</Btn>
        </div>
        <div class="add-input" v-if="showAdd">
          <div class="add-fields">
            <Inpt
                ref="add_input"
                v-model="newTitle"
                type="text"
                placeholder="Add new project"
                @keyup.enter="onAdd"
                :disabled="loading"
            />
            <Inpt
                v-model="newOutcome"
                type="text"
                placeholder="Outcome"
                @keyup.enter="onAdd"
                :disabled="loading"
            />
          </div>
          <Btn @click="onAdd"
               :disabled="loading || !newTitle.trim() || !newOutcome.trim()"
               :loading="loading"
               class="add-button"
               variant="primary"
               size="sm">
            Add
          </Btn>
        </div>
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
          <template #subtitle="{ item }">
            <MetadataRow :item="item" entity-type="project" />
          </template>
          <template #actions="{ item }">
            <ActionBtn @click="onTrash(item.id)" />
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
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import ItemList from '../components/ItemList.vue'
import ActionBtn from '../components/ActionBtn.vue'
import Btn from '../components/Btn.vue'
import Inpt from '../components/Inpt.vue'
import ProjectsIcon from '../assets/ProjectsIcon.vue'
import MetadataRow from '../components/MetadataRow.vue'
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
  addProject,
  updateProject,
  trashProject,
  moveProject,
} = projectModel()

const toaster = errorModel()
const confirm = confirmModel()

const showAdd = ref(false)
const newTitle = ref('')
const newOutcome = ref('')
const add_input = ref(null)

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

async function onAdd() {
  const t = newTitle.value.trim()
  const o = newOutcome.value.trim()
  if (!t || !o) return
  await addProject(t, '', o)
  newTitle.value = ''
  newOutcome.value = ''
  nextTick(() => add_input.value?.focus())
}

watch(showAdd, (v) => {
  if (v) nextTick(() => add_input.value?.focus())
})

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
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
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

.add-fields {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px;
}

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
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
</style>
