<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">System Health</h1>
      <div class="header-controls">
        <span v-if="lastRefreshed" class="text-caption color-text-tertiary">
          Updated: {{ formatTime(lastRefreshed) }}
        </span>
        <Btn variant="secondary" size="sm" :loading="loading" :disabled="loading" @click="refreshAll">
          Refresh
        </Btn>
      </div>
    </div>

    <div v-if="loading && !healthData" class="loading-state">
      <Spinner />
    </div>

    <div v-else-if="!healthData" class="empty-state">
      <p class="text-body-m color-text-secondary">Unable to reach admin service.</p>
    </div>

    <div v-else>
      <!-- Overall status -->
      <div class="overall-status card">
        <StatusDot :color="overallColor" />
        <span class="text-body-l fw-semibold overall-label">{{ healthData.overall_status }}</span>
      </div>

      <!-- Service cards -->
      <div class="services-grid">
        <div class="service-card card">
          <div class="service-header">
            <StatusDot color="green" />
            <span class="text-body-m fw-semibold">web</span>
          </div>
          <div class="service-details">
            <div class="service-meta">
              <div class="meta-row">
                <span class="text-caption color-text-secondary">Version</span>
                <span class="text-body-s">{{ appVersion || '—' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-for="svc in healthData.services" :key="svc.name" class="service-card card">
          <div class="service-header">
            <StatusDot :color="svc.status === 'up' ? 'green' : 'red'" />
            <span class="text-body-m fw-semibold">{{ svc.name }}</span>
          </div>
          <div class="service-details">
            <div v-if="svc.status === 'up'" class="service-meta">
              <div class="meta-row">
                <span class="text-caption color-text-secondary">Version</span>
                <span class="text-body-s">{{ svc.version || '—' }}</span>
              </div>
              <div v-if="svc.git_commit" class="meta-row">
                <span class="text-caption color-text-secondary">Commit</span>
                <span class="text-body-s font-mono">{{ svc.git_commit.slice(0, 12) }}</span>
              </div>
              <div v-if="svc.git_branch" class="meta-row">
                <span class="text-caption color-text-secondary">Branch</span>
                <span class="text-body-s font-mono">{{ svc.git_branch }}</span>
              </div>
              <div v-if="svc.build_time" class="meta-row">
                <span class="text-caption color-text-secondary">Build time</span>
                <span class="text-body-s">{{ formatBuildTime(svc.build_time) }}</span>
              </div>
              <div v-if="svc.build_type" class="meta-row">
                <span class="text-caption color-text-secondary">Build type</span>
                <span class="text-body-s">{{ svc.build_type }}</span>
              </div>
              <div v-if="svc.compiler" class="meta-row">
                <span class="text-caption color-text-secondary">Compiler</span>
                <span class="text-body-s">{{ svc.compiler }}</span>
              </div>
            </div>
            <div v-else class="service-error">
              <span class="text-body-s color-text-danger">{{ svc.error || 'Service unreachable' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Server Load -->
    <div class="section card">
      <div class="section-header">
        <div class="section-heading">
          <h3 class="text-label color-text-secondary section-title">Server Load</h3>
          <span v-if="environmentsCaption" class="text-caption color-text-tertiary">{{ environmentsCaption }}</span>
        </div>
        <Select v-model="serverLoadRange" :options="LOAD_RANGES" title="Range" class="range-select" />
      </div>

      <div v-if="serverLoadLoading" class="section-loading"><Spinner size="sm" /></div>
      <div v-else-if="serverLoadError" class="error-state">
        <p class="text-body-s color-text-danger">Couldn't load server load.</p>
        <Btn variant="secondary" size="sm" @click="loadServerLoad">Retry</Btn>
      </div>
      <p v-else-if="!serverLoad?.current" class="text-caption color-text-tertiary">
        No samples yet. The first one arrives within minutes.
      </p>
      <template v-else>
        <Alert
            v-if="serverLoad.disk_level === 'critical'"
            type="error"
            title="Disk almost full"
            message="Increase the server disk now — the services stop writing when it is full."
            class="disk-alert"
        />
        <Alert
            v-else-if="serverLoad.disk_level === 'warning'"
            type="warning"
            title="Disk is filling up"
            message="Increase the server disk soon."
            class="disk-alert"
        />
        <div class="stats-grid">
          <Stat label="CPU" :value="formatPct(serverLoad.current.cpu_pct)" />
          <Stat
              label="RAM"
              :value="formatPct(serverLoad.current.ram_pct)"
              :trend="usedOfTotal(serverLoad.current.ram_used_bytes, serverLoad.current.ram_total_bytes)"
          />
          <Stat
              label="Disk"
              :value="formatPct(serverLoad.current.disk_pct)"
              :trend="usedOfTotal(serverLoad.current.disk_used_bytes, serverLoad.current.disk_total_bytes)"
          />
          <Stat label="Disk Full In" :value="diskFullIn" />
        </div>
        <p class="text-caption color-text-tertiary last-sample">Last sample {{ formatHourMinute(serverLoad.current.sampled_at) }}</p>
      </template>
    </div>

    <!-- Databases -->
    <div class="section card">
      <div class="section-header">
        <h3 class="text-label color-text-secondary section-title">Databases</h3>
      </div>

      <div v-if="databasesLoading" class="section-loading"><Spinner size="sm" /></div>
      <div v-else-if="databasesError" class="error-state">
        <p class="text-body-s color-text-danger">Couldn't load database sizes.</p>
        <Btn variant="secondary" size="sm" @click="loadDatabases">Retry</Btn>
      </div>
      <template v-else-if="databases">
        <Stat label="All Databases" :value="formatBytes(databases.total_bytes)" size="lg" class="databases-total" />
        <DataTable
            class="databases-table"
            :columns="DATABASE_COLUMNS"
            :rows="databaseRows"
            :show-pagination="false"
        >
          <template #cell-name="{ value }"><span class="database-name">{{ value }}</span></template>
          <template #cell-bytes="{ value }">{{ formatBytes(value) }}</template>
          <template #cell-share="{ value }">{{ formatShare(value) }}</template>
        </DataTable>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import Alert from '../components/Alert.vue'
import Btn from '../components/Btn.vue'
import DataTable from '../components/DataTable.vue'
import Select from '../components/Select.vue'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import StatusDot from '../components/StatusDot.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import { formatBytes } from '../scripts/core/formatBytes.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

// App version from Vite define
const appVersion = __APP_VERSION__

const LOAD_RANGES = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '12m', label: 'Last 12 months' },
]

const DATABASE_COLUMNS = [
  { key: 'name', label: 'Database' },
  { key: 'bytes', label: 'Size' },
  { key: 'share', label: 'Share' },
]

const healthData = ref(null)
const loading = ref(false)
const lastRefreshed = ref(null)
let refreshTimer = null

const serverLoadRange = ref('24h')
const serverLoad = ref(null)
const serverLoadLoading = ref(false)
const serverLoadError = ref(false)
let serverLoadSeq = 0

const databases = ref(null)
const databasesLoading = ref(false)
const databasesError = ref(false)

const overallColor = computed(() => {
  const status = healthData.value?.overall_status
  if (status === 'healthy') return 'green'
  if (status === 'degraded') return 'yellow'
  return 'red'
})

async function load() {
  loading.value = true
  try {
    healthData.value = await apiClient.getSystemHealth()
    lastRefreshed.value = new Date().toISOString()
  } catch (err) {
    toaster.push(err.message || 'Failed to load system health')
  } finally {
    loading.value = false
  }
}

const environmentsCaption = computed(() => {
  const envs = serverLoad.value?.environments || []
  if (envs.length < 2) return ''
  return `Shared by ${envs.slice(0, -1).join(', ')} and ${envs[envs.length - 1]}`
})

const diskFullIn = computed(() => {
  const estimate = serverLoad.value?.disk_full_in
  if (!estimate) return '—'
  if (estimate.reason === 'not_growing') return 'Not growing'
  if (estimate.reason === 'insufficient_data') return 'Not enough data yet'
  const unit = estimate.unit === 'months' ? 'month' : 'day'
  return `~${estimate.value} ${unit}${estimate.value === 1 ? '' : 's'}`
})

const databaseRows = computed(() => (databases.value?.items || []).map(d => ({ ...d, id: d.name })))

async function loadServerLoad() {
  const seq = ++serverLoadSeq
  serverLoadLoading.value = true
  serverLoadError.value = false
  try {
    const data = await apiClient.getSystemLoad(serverLoadRange.value)
    if (seq !== serverLoadSeq) return
    serverLoad.value = data
  } catch {
    if (seq !== serverLoadSeq) return
    serverLoadError.value = true
  } finally {
    if (seq === serverLoadSeq) serverLoadLoading.value = false
  }
}

async function loadDatabases() {
  databasesLoading.value = true
  databasesError.value = false
  try {
    databases.value = await apiClient.getDatabaseSizes()
  } catch {
    databasesError.value = true
  } finally {
    databasesLoading.value = false
  }
}

// Server Load and Databases load on open and Refresh only; the 30 s timer refreshes the services
function refreshAll() {
  load()
  loadServerLoad()
  loadDatabases()
}

function formatPct(val) {
  return val == null ? '—' : `${Math.round(val)} %`
}

function formatShare(val) {
  return val == null ? '—' : `${Number(val).toFixed(1)} %`
}

function usedOfTotal(used, total) {
  return `${formatBytes(used)} / ${formatBytes(total)}`
}

function formatHourMinute(iso) {
  try { return format(new Date(iso), 'HH:mm') } catch { return iso }
}

function formatTime(iso) {
  if (!iso) return ''
  try { return format(new Date(iso), 'HH:mm:ss') } catch { return iso }
}

function formatBuildTime(iso) {
  if (!iso) return ''
  try { return format(new Date(iso), 'yyyy-MM-dd HH:mm') } catch { return iso }
}

watch(serverLoadRange, loadServerLoad)

onMounted(() => {
  refreshAll()
  refreshTimer = setInterval(load, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.empty-state {
  text-align: center;
  padding: 48px 0;
}

/* Overall status */
.overall-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  margin-bottom: 20px;
  text-transform: capitalize;
}

/* Services grid */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.service-card {
  padding: 20px;
}

.service-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.service-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.font-mono {
  font-family: var(--font-family-mono);
}

.service-error {
  padding: 8px 0;
}

/* Server Load + Databases */
.section {
  padding: 20px;
  margin-top: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.section-heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.section-title {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-loading {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.error-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
}

.error-state p {
  margin: 0;
}

.disk-alert {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

.last-sample {
  margin: 12px 0 0;
}

.databases-total {
  margin-bottom: 16px;
}

.databases-table :deep(th:not(:first-child)),
.databases-table :deep(td:not(:first-child)) {
  text-align: right;
  white-space: nowrap;
}

.database-name {
  overflow-wrap: anywhere;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .range-select,
  .range-select :deep(.select-trigger) {
    width: 100%;
  }
}
</style>