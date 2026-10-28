<template>
    <div class="projects-page">
      <div class="projects-header">
        <div class="header-row">
          <h1 class="page-title">Projects</h1>
          <div class="header-actions">
            <Btn variant="ghost" size="sm" data-testid="projects-templates-btn" @click="router.push({ name: 'project-templates' })">Templates</Btn>
            <template v-if="items.length > 0">
              <TagFilter v-model="filterTags" />
              <Btn variant="secondary" size="sm" @click="showAdd = !showAdd">{{ showAdd ? '−' : '+' }}</Btn>
            </template>
          </div>
        </div>
        <div class="add-input" v-if="showAdd">
          <Inpt
              ref="add_input"
              v-model="newTitle"
              type="text"
              placeholder="Add new project"
              @keyup.enter="onAdd"
              :disabled="adding"
          />
          <Btn @click="onAdd"
               :disabled="adding || !newTitle.trim() || !newOutcome.trim()"
               :loading="adding"
               class="add-button"
               variant="primary"
               size="sm">
            Add
          </Btn>
          <Inpt
              v-model="newOutcome"
              type="text"
              placeholder="Outcome"
              :footer="OUTCOME_HELPER"
              class="add-outcome"
              @keyup.enter="onAdd"
              :disabled="adding"
          />
          <div v-if="showAreaPicker || showGoalPicker" class="add-horizons">
            <Select v-if="showAreaPicker" v-model="newArea" :options="horizon.options('area')" title="Area of focus" :disabled="adding" block data-testid="project-add-area" />
            <Select v-if="showGoalPicker" v-model="newGoal" :options="horizon.options('goal')" title="Goal" :disabled="adding" block data-testid="project-add-goal" />
          </div>
        </div>
      </div>

      <PullToRefresh class="projects-content" :refresh="onRefresh" :disabled="loading && items.length === 0">
        <div class="card">
        <ItemList
            v-model="items"
            :loading="loading && !adding"
            :has-more="adding ? hasMoreSnapshot : hasMore"
            :loading-ids="loadingIds"
            :disabled="adding"
            :no-checkbox="true"
            source-type="project"
            swipe-left="trash"
            :swipe-filter="canTrash"
            @update="onItemUpdate"
            @check="onItemCheck"
            @click="onItemClick"
            @delete="onTrash"
            @swipe-left="onTrash"
            @move="onMove"
            @load-more="loadMore"
        >
          <template #subtitle="{ item }">
            <MetadataRow :item="item" entity-type="project" />
          </template>
          <template #actions="{ item }">
            <ActionBtn v-if="canTrash(item)" @click="onTrash(item.id)" />
          </template>
          <template #empty>
            <template v-if="filterTags.length || activeTag">
              <FilterEmptyState title="No projects in this context" :tags="effectiveTags" />
            </template>
            <template v-else>
              <EmptyState :icon="ProjectsIcon" title="No projects in motion" text="Anything that takes more than one action is a project. Clarify an inbox item into one, or add it here." buttonText="Add Project" @action="openAdd" />
            </template>
          </template>
        </ItemList>
        </div>
      </PullToRefresh>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ItemList from '../../components/ItemList.vue'
import PullToRefresh from '../../components/PullToRefresh.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import TagFilter from '../../components/TagFilter.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import Select from '../../components/Select.vue'
import ProjectsIcon from '../../assets/ProjectsIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import { projectModel } from '../../scripts/models/projectModel.js'
import { horizonModel } from '../../scripts/models/horizonModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { undoModel } from '../../scripts/core/undoModel.js'
import { authModel } from '../../scripts/core/authModel.js'
import { OUTCOME_HELPER } from '../../scripts/core/textUtils.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

const router = useRouter()
const route = useRoute()
const auth = authModel()
const horizon = horizonModel()
const settings = settingsModel()

function canTrash(item) {
  if (!item?.shared) return true
  return item.owner_id ? item.owner_id === auth.currentUser.value?.id : item.my_role === 'owner'
}

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
const undo = undoModel()

const showAdd = ref(false)
const newTitle = ref('')
const newOutcome = ref('')
const newArea = ref('')
const newGoal = ref('')
const add_input = ref(null)
const adding = ref(false)
const hasMoreSnapshot = ref(false)
const filterTags = ref([])
const { activeTag } = contextModel()

const showAreaPicker = computed(() => settings.state.horizonsEnabled && horizon.hasAreas.value)
const showGoalPicker = computed(() => settings.state.horizonsEnabled && horizon.hasGoals.value)

const effectiveTags = computed(() => {
  const tags = [...filterTags.value]
  if (activeTag.value && !tags.includes(activeTag.value)) {
    tags.push(activeTag.value)
  }
  return tags
})

watch(effectiveTags, (tags) => {
  loadProjects({ reset: true, tags })
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

onMounted(() => {
  loadProjects({ reset: true, tags: effectiveTags.value }).catch(() => {})
  if (settings.state.horizonsEnabled) loadHorizons()
  if (route.query.add) openAdd()
})

// From /horizons "Add project": preselect that area / goal once the options are in
async function loadHorizons() {
  try { await horizon.load() } catch { return }
  const { area, goal } = route.query
  if (area && horizon.state.levels.area.some(i => i.id === area)) newArea.value = area
  if (goal && horizon.state.levels.goal.some(i => i.id === goal)) newGoal.value = goal
}

async function loadMore() {
  await loadProjects()
}

function onRefresh() {
  return loadProjects({ reset: true, tags: effectiveTags.value })
}
undo.registerRefresh(onRefresh)
onAssistantChange(onRefresh)

async function onAdd() {
  const t = newTitle.value.trim()
  const o = newOutcome.value.trim()
  if (!t || !o) return
  hasMoreSnapshot.value = hasMore.value
  adding.value = true
  const links = {}
  if (showAreaPicker.value && newArea.value) links.area_id = newArea.value
  if (showGoalPicker.value && newGoal.value) links.goal_id = newGoal.value
  try { await addProject(t, '', o, links) } catch (err) {
    // error watcher shows the toast
    if (err.code === 'invalid_area_id' || err.code === 'invalid_goal_id') horizon.refresh()
  }
  finally { adding.value = false }
  newTitle.value = ''
  newOutcome.value = ''
  newArea.value = ''
  newGoal.value = ''
  nextTick(() => add_input.value?.focus())
}

function openAdd() {
  showAdd.value = true
  nextTick(() => add_input.value?.focus())
}

watch(showAdd, (v) => {
  if (v) nextTick(() => add_input.value?.focus())
})

function onItemClick(item, index) {
  router.push({
    name: 'project-detail',
    params: { id: item.id },
    query: { position: index, total: totalItems.value, from: 'projects' }
  })
}

async function onItemUpdate(id, { title }) {
  const item = items.value.find(i => i.id === id)
  const oldTitle = item?.title
  if (item) item.title = title

  updatingId.value = id
  try {
    await updateProject(id, { title, outcome: item.outcome || '' })
  } catch (e) {
    if (item) item.title = oldTitle
  } finally {
    updatingId.value = null
  }
}

function onItemCheck() {
  // Projects don't have a check/complete action
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function onTrash(id) {
  const item = items.value.find(i => i.id === id)
  const title = truncateTitle(item?.title)

  deletingId.value = id
  try {
    const result = await trashProject(id)
    const message = result?.trashed_actions > 0 ? `"${title}" and its actions moved to trash` : `"${title}" moved to trash`
    undo.record({ op: 'trash', item, title, message })
    // Reload list to backfill removed item
    loadProjects({ reset: true, tags: effectiveTags.value }).catch(() => {})
  } finally {
    deletingId.value = null
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
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

h1 {
  margin: 0;
  padding: 0;
}

.add-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 10px;
  row-gap: 4px;
  padding: 0;
  margin-bottom: 5px;
}

.add-outcome {
  grid-column: 1;
}

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
}

/* Each picker takes half the fields column; a single one stays on the left */
.add-horizons {
  grid-column: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  margin: 8px 0 4px;
}

.projects-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

</style>
