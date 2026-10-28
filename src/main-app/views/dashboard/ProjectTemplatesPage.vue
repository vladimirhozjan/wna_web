<template>
    <div class="templates-page">
      <div class="templates-header">
        <div class="templates-back">
          <a class="text-body-m templates-back-link" @click="goToProjects">&lt;</a>
          <span class="text-body-s templates-back-label" @click="goToProjects">Projects</span>
        </div>
        <h1 class="page-title">Project templates</h1>
      </div>

      <div class="templates-content">
        <div class="card" data-testid="templates-list">
        <ItemList
            v-model="items"
            :loading="loading"
            :has-more="hasMore"
            :loading-ids="loadingIds"
            :no-checkbox="true"
            :reorderable="false"
            row-testid="template-row"
            @update="onRename"
            @click="onOpen"
            @load-more="loadTemplates().catch(() => {})"
        >
          <template #subtitle="{ item }">
            <span class="text-body-s color-text-secondary">{{ actionCountLabel(item.action_count) }}</span>
          </template>
          <template #actions="{ item }">
            <ActionBtn data-testid="template-row-delete" @click="onDelete(item)" />
          </template>
          <template #empty>
            <div class="templates-empty" data-testid="templates-empty">
              <EmptyState
                  :icon="TextFileIcon"
                  title="No templates yet"
                  text="Open a project you repeat, like a trip or a month-end close, and choose Save as template from its More menu."
                  buttonText="Go to Projects"
                  button-testid="templates-empty-cta"
                  @action="goToProjects"
              />
            </div>
          </template>
        </ItemList>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ItemList from '../../components/ItemList.vue'
import ActionBtn from '../../components/ActionBtn.vue'
import EmptyState from '../../components/EmptyState.vue'
import TextFileIcon from '../../assets/TextFileIcon.vue'
import { projectTemplateModel } from '../../scripts/models/projectTemplateModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { confirmModel } from '../../scripts/core/confirmModel.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()

const { items, loading, error, hasMore, loadTemplates, renameTemplate, deleteTemplate } = projectTemplateModel()

const busyId = ref(null)
const loadingIds = computed(() => busyId.value ? [busyId.value] : [])

function actionCountLabel(n) {
  return n === 1 ? '1 action' : `${n} actions`
}

function goToProjects() {
  router.push({ name: 'projects' })
}

function onOpen(item) {
  router.push({ name: 'project-template-detail', params: { id: item.id } })
}

async function onRename(id, { title }) {
  const item = items.value.find(i => i.id === id)
  const oldName = item?.name
  if (item) item.title = title
  busyId.value = id
  try {
    await renameTemplate(id, title)
  } catch (err) {
    if (item) item.title = oldName
    toaster.push(err.message)
  } finally {
    busyId.value = null
  }
}

async function onDelete(item) {
  const ok = await confirm.show({
    title: 'Delete template?',
    message: `"${item.name}" will be deleted for good. Projects made from it stay as they are.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (!ok) return
  busyId.value = item.id
  try {
    await deleteTemplate(item.id, item.name)
  } catch (err) {
    toaster.push(err.message)
  } finally {
    busyId.value = null
  }
}

watch(error, (err) => {
  if (err) toaster.push(err.message ?? 'Unknown error')
})

onAssistantChange(() => loadTemplates({ reset: true }).catch(() => {}))

onMounted(() => {
  loadTemplates({ reset: true }).catch(() => {})
})
</script>

<style scoped>
.templates-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.templates-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.templates-back {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: -4px 0 4px -8px;
}

.templates-back-link {
  color: var(--color-link-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.templates-back-link:hover {
  background: var(--color-bg-secondary);
  color: var(--color-link-hover);
}

.templates-back-label {
  color: var(--color-link-text);
  cursor: pointer;
}

.templates-back-label:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

/* Same centring as ItemList's own empty state, which this wrapper sits inside */
.templates-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
}

h1 {
  margin: 0;
  padding: 0;
}

.templates-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
</style>
