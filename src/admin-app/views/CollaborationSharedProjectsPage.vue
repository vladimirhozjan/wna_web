<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Shared Projects</h1>
    </div>

    <div class="toolbar">
      <SearchInput v-model="memberUserId" placeholder="Filter by member user ID..." @update:model-value="resetAndLoad" />
    </div>

    <DataTable
        :columns="columns"
        :rows="projects"
        :loading="loading"
        :row-clickable="true"
        empty-text="No shared projects found."
        @row-click="goToDetail"
    >
      <template #cell-title="{ value }">
        <span class="fw-medium">{{ value || '(untitled)' }}</span>
      </template>
      <template #cell-owner_id="{ value }">
        <span class="text-caption color-text-tertiary mono">{{ value || '—' }}</span>
      </template>
      <template #cell-state="{ value }">
        <Badge type="primary" :value="value || 'ACTIVE'" />
      </template>

      <template #pagination>
        <Pagination
            :page="page"
            :page-size="pageSize"
            :total="totalCount"
            @update:page="p => { page = p; load() }"
        />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import SearchInput from '../components/SearchInput.vue'
import Badge from '../components/Badge.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const router = useRouter()
const toaster = errorModel()

const columns = [
  { key: 'title', label: 'Title', sortable: false },
  { key: 'owner_id', label: 'Owner ID', sortable: false },
  { key: 'state', label: 'State', sortable: false, width: '110px' },
]

const projects = ref([])
const loading = ref(false)
const totalCount = ref(0)
const page = ref(1)
const pageSize = 20
const memberUserId = ref('')

async function load() {
  loading.value = true
  try {
    const params = {
      offset: (page.value - 1) * pageSize,
      limit: pageSize,
    }
    if (memberUserId.value.trim()) params.member_user_id = memberUserId.value.trim()

    const data = await apiClient.listSharedProjects(params)
    projects.value = data.items || []
    totalCount.value = data.total_count || 0
  } catch (err) {
    toaster.push(err.message || 'Failed to load shared projects')
  } finally {
    loading.value = false
  }
}

function resetAndLoad() {
  page.value = 1
  load()
}

function goToDetail(row) {
  router.push({ name: 'shared-project-detail', params: { id: row.id } })
}

onMounted(load)
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.mono {
  font-family: var(--font-mono, monospace);
}
</style>
