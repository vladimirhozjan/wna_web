<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User Detail</RouterLink>
    </div>

    <!-- Data stats summary -->
    <div v-if="statsLoading" class="loading-state">
      <Spinner />
    </div>
    <div v-else-if="stats" class="summary-bar card">
      <Stat label="Stuff" :value="stats.stuff_count" />
      <Stat label="Actions" :value="totalActions" />
      <Stat label="Projects" :value="totalProjects" />
      <Stat label="Tags" :value="stats.tag_count" />
      <Stat label="Attachments" :value="stats.attachment_count" />
      <Stat label="Storage" :value="formatBytes(stats.attachment_bytes + stats.reference_bytes)" />
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="tab-btn text-body-s"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Items tab -->
    <div v-if="activeTab === 'items'">
      <div class="tab-toolbar">
        <select v-model="itemTypeFilter" class="text-body-s filter-select" @change="resetItemsAndLoad">
          <option :value="null">All Types</option>
          <option :value="1">Stuff</option>
          <option :value="2">Actions</option>
          <option :value="3">Projects</option>
        </select>
        <select v-model="itemStateFilter" class="text-body-s filter-select" @change="resetItemsAndLoad">
          <option :value="null">All States</option>
          <option v-for="s in stateOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>
      <DataTable
          :columns="itemColumns"
          :rows="items"
          :loading="itemsLoading"
          empty-text="No items found."
      >
        <template #cell-type="{ value }">
          <Badge type="role" :value="typeLabel(value)" />
        </template>
        <template #cell-state="{ value }">
          <span class="text-caption">{{ stateLabel(value) }}</span>
        </template>
        <template #cell-tags="{ value }">
          <span class="text-caption">{{ value?.join(', ') || '—' }}</span>
        </template>
        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #pagination>
          <Pagination
              :page="itemsPage"
              :page-size="pageSize"
              :total="itemsTotal"
              @update:page="p => { itemsPage = p; loadItems() }"
          />
        </template>
      </DataTable>
    </div>

    <!-- Tags tab -->
    <div v-if="activeTab === 'tags'">
      <div v-if="tagsLoading" class="loading-state"><Spinner /></div>
      <div v-else-if="tags.length" class="tags-list card">
        <div v-for="tag in tags" :key="tag.tag" class="tag-row">
          <span class="text-body-s fw-medium">{{ tag.tag }}</span>
          <span class="text-caption color-text-tertiary">{{ tag.usage_count }} items</span>
        </div>
      </div>
      <p v-else class="text-body-s color-text-tertiary empty-text">No tags found.</p>
    </div>

    <!-- Attachments tab -->
    <div v-if="activeTab === 'attachments'">
      <div class="file-toolbar">
        <input
            v-model="attachmentSearch"
            type="text"
            class="text-body-s file-search"
            placeholder="Search files..."
            @input="filterAttachments"
        />
        <div class="file-toolbar-right">
          <span class="text-caption color-text-tertiary">{{ formatBytes(stats?.attachment_bytes ?? 0) }}</span>
        </div>
      </div>
      <DataTable
          :columns="attachmentColumns"
          :rows="filteredAttachments"
          :loading="attachmentsLoading"
          empty-text="No attachments found."
      >
        <template #cell-size_bytes="{ value }">
          {{ formatBytes(value) }}
        </template>
        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #pagination>
          <Pagination
              :page="attachmentsPage"
              :page-size="pageSize"
              :total="attachmentsTotal"
              @update:page="p => { attachmentsPage = p; loadAttachments() }"
          />
        </template>
      </DataTable>
    </div>

    <!-- Reference Files tab -->
    <div v-if="activeTab === 'references'">
      <div class="file-toolbar">
        <input
            v-model="referenceSearch"
            type="text"
            class="text-body-s file-search"
            placeholder="Search files..."
            @input="filterReferences"
        />
        <div class="file-toolbar-right">
          <span class="text-caption color-text-tertiary">{{ formatBytes(stats?.reference_bytes ?? 0) }}</span>
        </div>
      </div>
      <DataTable
          :columns="referenceColumns"
          :rows="filteredReferences"
          :loading="referencesLoading"
          empty-text="No reference files found."
      >
        <template #cell-size_bytes="{ value }">
          {{ formatBytes(value) }}
        </template>
        <template #cell-created_at="{ value }">
          {{ formatDate(value) }}
        </template>
        <template #pagination>
          <Pagination
              :page="referencesPage"
              :page-size="pageSize"
              :total="referencesTotal"
              @update:page="p => { referencesPage = p; loadReferences() }"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const route = useRoute()
const toaster = errorModel()

const userId = computed(() => route.params.userId)
const pageSize = 20

const tabs = [
  { key: 'items', label: 'Items' },
  { key: 'tags', label: 'Tags' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'references', label: 'Reference Files' },
]
const activeTab = ref('items')

// --- Type/State mappings ---
const TYPE_LABELS = { 1: 'stuff', 2: 'action', 3: 'project' }
const STATE_LABELS = {
  1: 'Inbox',
  10: 'Next',
  11: 'Today',
  12: 'Calendar',
  13: 'Waiting',
  14: 'Backlog',
  20: 'Active',
  1000: 'Completed',
  1001: 'Someday',
  1002: 'Archived',
  1003: 'Trash',
}

const stateOptions = Object.entries(STATE_LABELS).map(([value, label]) => ({ value: Number(value), label }))

function typeLabel(t) { return TYPE_LABELS[t] || String(t) }
function stateLabel(s) { return STATE_LABELS[s] || String(s) }

// --- Data stats ---
const stats = ref(null)
const statsLoading = ref(false)

const totalActions = computed(() => {
  if (!stats.value) return 0
  return (stats.value.action_next || 0) + (stats.value.action_today || 0) + (stats.value.action_calendar || 0) +
      (stats.value.action_waiting || 0) + (stats.value.action_backlog || 0) + (stats.value.action_completed || 0) +
      (stats.value.action_someday || 0)
})

const totalProjects = computed(() => {
  if (!stats.value) return 0
  return (stats.value.project_active || 0) + (stats.value.project_completed || 0) + (stats.value.project_someday || 0)
})

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await apiClient.getUserDataStats(userId.value)
  } catch {
    stats.value = null
  } finally {
    statsLoading.value = false
  }
}

// --- Items ---
const itemColumns = [
  { key: 'title', label: 'Title', sortable: false },
  { key: 'type', label: 'Type', sortable: false, width: '90px' },
  { key: 'state', label: 'State', sortable: false, width: '100px' },
  { key: 'tags', label: 'Tags', sortable: false, width: '150px' },
  { key: 'created_at', label: 'Created', sortable: false, width: '150px' },
]
const items = ref([])
const itemsLoading = ref(false)
const itemsTotal = ref(0)
const itemsPage = ref(1)
const itemTypeFilter = ref(null)
const itemStateFilter = ref(null)

async function loadItems() {
  itemsLoading.value = true
  try {
    const params = { offset: (itemsPage.value - 1) * pageSize, limit: pageSize }
    if (itemTypeFilter.value != null) params.type = itemTypeFilter.value
    if (itemStateFilter.value != null) params.state = itemStateFilter.value
    const data = await apiClient.getUserItems(userId.value, params)
    items.value = data.items || []
    itemsTotal.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load items')
  } finally {
    itemsLoading.value = false
  }
}

function resetItemsAndLoad() {
  itemsPage.value = 1
  loadItems()
}

// --- Tags ---
const tags = ref([])
const tagsLoading = ref(false)
const tagsLoaded = ref(false)

async function loadTags() {
  tagsLoading.value = true
  try {
    const data = await apiClient.getUserTags(userId.value)
    tags.value = data.tags || data.items || []
    tagsLoaded.value = true
  } catch (err) {
    toaster.push(err.message || 'Failed to load tags')
  } finally {
    tagsLoading.value = false
  }
}

// --- Attachments ---
const attachmentColumns = [
  { key: 'file_name', label: 'File Name', sortable: false },
  { key: 'mime_type', label: 'Type', sortable: false, width: '150px' },
  { key: 'size_bytes', label: 'Size', sortable: false, width: '100px' },
  { key: 'item_title', label: 'Item', sortable: false },
  { key: 'created_at', label: 'Created', sortable: false, width: '150px' },
]
const attachments = ref([])
const attachmentsLoading = ref(false)
const attachmentsTotal = ref(0)
const attachmentsPage = ref(1)
const attachmentsLoaded = ref(false)
const attachmentSearch = ref('')

const filteredAttachments = computed(() => {
  const q = attachmentSearch.value.toLowerCase().trim()
  if (!q) return attachments.value
  return attachments.value.filter(a => a.file_name?.toLowerCase().includes(q))
})

function filterAttachments() { /* reactive via v-model */ }

async function loadAttachments() {
  attachmentsLoading.value = true
  try {
    const data = await apiClient.getUserAttachments(userId.value, {
      offset: (attachmentsPage.value - 1) * pageSize,
      limit: pageSize,
    })
    attachments.value = data.attachments || data.items || []
    attachmentsTotal.value = data.total_count || 0
    attachmentsLoaded.value = true
  } catch (err) {
    toaster.push(err.message || 'Failed to load attachments')
  } finally {
    attachmentsLoading.value = false
  }
}

// --- Reference Files ---
const referenceColumns = [
  { key: 'original_name', label: 'Name', sortable: false },
  { key: 'mime_type', label: 'Type', sortable: false, width: '150px' },
  { key: 'size_bytes', label: 'Size', sortable: false, width: '100px' },
  { key: 'created_at', label: 'Created', sortable: false, width: '150px' },
]
const references = ref([])
const referencesLoading = ref(false)
const referencesTotal = ref(0)
const referencesPage = ref(1)
const referencesLoaded = ref(false)
const referenceSearch = ref('')

const filteredReferences = computed(() => {
  const q = referenceSearch.value.toLowerCase().trim()
  if (!q) return references.value
  return references.value.filter(r => (r.original_name || r.name || '').toLowerCase().includes(q))
})

function filterReferences() { /* reactive via v-model */ }

async function loadReferences() {
  referencesLoading.value = true
  try {
    const data = await apiClient.getUserReferenceFiles(userId.value, {
      offset: (referencesPage.value - 1) * pageSize,
      limit: pageSize,
    })
    references.value = data.files || data.items || []
    referencesTotal.value = data.total_count || 0
    referencesLoaded.value = true
  } catch (err) {
    toaster.push(err.message || 'Failed to load reference files')
  } finally {
    referencesLoading.value = false
  }
}

// --- Tab switching ---
function switchTab(key) {
  activeTab.value = key
  if (key === 'tags' && !tagsLoaded.value && !tagsLoading.value) loadTags()
  if (key === 'attachments' && !attachmentsLoaded.value && !attachmentsLoading.value) loadAttachments()
  if (key === 'references' && !referencesLoaded.value && !referencesLoading.value) loadReferences()
}

// --- Helpers ---
function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

onMounted(() => {
  loadStats()
  loadItems()
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  margin-bottom: 20px;
}

.back-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

/* Summary bar */
.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  padding: 16px 20px;
  margin-bottom: 20px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border-light);
  margin-bottom: 16px;
}

.tab-btn {
  padding: 10px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  color: var(--color-action);
  border-bottom-color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}

.tab-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
  min-width: 140px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

/* Tags list */
.tags-list {
  padding: 16px 20px;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.tag-row:last-child {
  border-bottom: none;
}

/* File toolbar */
.file-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.file-search {
  width: 200px;
  padding: 7px 12px;
  border-radius: 20px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.file-search:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.file-search::placeholder {
  color: var(--color-text-prefill);
}

.file-toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-text {
  text-align: center;
  padding: 32px 0;
}

@media (max-width: 768px) {
  .summary-bar {
    gap: 16px;
  }

  .tabs {
    overflow-x: auto;
  }
}
</style>
