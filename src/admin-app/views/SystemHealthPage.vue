<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">System Health</h1>
      <div class="header-controls">
        <span v-if="lastRefreshed" class="text-caption color-text-tertiary">
          Updated: {{ formatTime(lastRefreshed) }}
        </span>
        <Btn variant="secondary" size="sm" :loading="loading" :disabled="loading" @click="load">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import Btn from '../components/Btn.vue'
import Spinner from '../components/Spinner.vue'
import StatusDot from '../components/StatusDot.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

const healthData = ref(null)
const loading = ref(false)
const lastRefreshed = ref(null)
let refreshTimer = null

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

function formatTime(iso) {
  if (!iso) return ''
  try { return format(new Date(iso), 'HH:mm:ss') } catch { return iso }
}

function formatBuildTime(iso) {
  if (!iso) return ''
  try { return format(new Date(iso), 'yyyy-MM-dd HH:mm') } catch { return iso }
}

onMounted(() => {
  load()
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>