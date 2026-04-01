<template>
  <div class="page">
    <h1 class="page-title">Analytics</h1>

    <!-- Signup & Growth -->
    <div class="section card">
      <div class="section-header">
        <h3 class="text-label color-text-secondary section-title">Signup &amp; Growth</h3>
        <div class="section-controls">
          <select v-model="signupPeriod" class="text-body-s filter-select" @change="loadSignups">
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      <div v-if="signupsLoading" class="loading-state"><Spinner size="sm" /></div>
      <div v-else-if="signups.length">
        <div class="chart-container">
          <Bar :data="signupChartData" :options="signupChartOptions" />
        </div>
        <div class="summary-stats">
          <Stat label="Total (period)" :value="signupsTotalPeriod" />
          <Stat label="Cumulative (latest)" :value="signups[signups.length - 1]?.cumulative || 0" />
        </div>
      </div>
      <p v-else class="text-caption color-text-tertiary">No signup data available.</p>
    </div>

    <!-- Active Users -->
    <div class="section card">
      <div class="section-header">
        <h3 class="text-label color-text-secondary section-title">Active Users</h3>
        <div class="section-controls">
          <select v-model="activeUsersPeriod" class="text-body-s filter-select" @change="loadActiveUsers">
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </div>
      </div>

      <div v-if="activeUsersLoading" class="loading-state"><Spinner size="sm" /></div>
      <div v-else-if="activeUsers.length">
        <div class="chart-container">
          <Line :data="activeUsersChartData" :options="lineChartOptions" />
        </div>
        <div class="summary-stats">
          <Stat label="Latest DAU" :value="activeUsers[activeUsers.length - 1]?.dau || 0" />
          <Stat label="Latest WAU" :value="activeUsers[activeUsers.length - 1]?.wau || 0" />
          <Stat label="Latest MAU" :value="activeUsers[activeUsers.length - 1]?.mau || 0" />
        </div>
      </div>
      <p v-else class="text-caption color-text-tertiary">No active user data available.</p>
    </div>

    <!-- Feature Usage -->
    <div class="section card">
      <h3 class="text-label color-text-secondary section-title">Feature Usage</h3>
      <div v-if="featureUsageLoading" class="loading-state"><Spinner size="sm" /></div>
      <div v-else-if="featureUsage">
        <div class="chart-container chart-container--short">
          <Bar :data="featureUsageChartData" :options="horizontalBarOptions" />
        </div>
      </div>
      <p v-else class="text-caption color-text-tertiary">No feature usage data available.</p>
    </div>

    <!-- Platform Health -->
    <div class="section card">
      <h3 class="text-label color-text-secondary section-title">Platform Health</h3>
      <div v-if="platformHealthLoading" class="loading-state"><Spinner size="sm" /></div>
      <div v-else-if="platformHealth" class="stats-grid">
        <Stat v-for="(val, key) in platformHealth" :key="key" :label="formatKey(key)" :value="val" />
      </div>
      <p v-else class="text-caption color-text-tertiary">No platform health data available.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO, subDays } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement, BarElement,
    Title, Tooltip, Legend, Filler,
)

const toaster = errorModel()

// Chart theme colors (read from CSS vars at runtime)
function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function chartColors() {
  return {
    action: getCssVar('--color-action') || '#6366f1',
    success: getCssVar('--color-success') || '#10b981',
    warning: getCssVar('--color-warning') || '#f59e0b',
    border: getCssVar('--color-border-subtle') || '#e5e7eb',
    text: getCssVar('--color-text-tertiary') || '#9ca3af',
  }
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 16 } },
  },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: () => chartColors().border } },
  },
}

// --- Signups ---
const signupPeriod = ref('day')
const signups = ref([])
const signupsLoading = ref(false)

const signupsTotalPeriod = computed(() => signups.value.reduce((sum, i) => sum + (i.signups || 0), 0))

const signupChartData = computed(() => {
  const c = chartColors()
  return {
    labels: signups.value.map(i => formatChartDate(i.date)),
    datasets: [
      { label: 'Email', data: signups.value.map(i => i.email_signups || 0), backgroundColor: c.action, stack: 'signups' },
      { label: 'Google', data: signups.value.map(i => i.google_signups || 0), backgroundColor: c.success, stack: 'signups' },
    ],
  }
})

const signupChartOptions = { ...baseOptions, scales: { ...baseOptions.scales, x: { ...baseOptions.scales.x, stacked: true }, y: { ...baseOptions.scales.y, stacked: true } } }

async function loadSignups() {
  signupsLoading.value = true
  try {
    const end = format(new Date(), 'yyyy-MM-dd')
    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const data = await apiClient.getSignupStats({ period: signupPeriod.value, start, end })
    signups.value = data.items || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load signup data')
  } finally {
    signupsLoading.value = false
  }
}

// --- Active Users ---
const activeUsersPeriod = ref('day')
const activeUsers = ref([])
const activeUsersLoading = ref(false)

const activeUsersChartData = computed(() => {
  const c = chartColors()
  return {
    labels: activeUsers.value.map(i => formatChartDate(i.date)),
    datasets: [
      { label: 'DAU', data: activeUsers.value.map(i => i.dau || 0), borderColor: c.action, backgroundColor: c.action + '20', fill: true, tension: 0.3 },
      { label: 'WAU', data: activeUsers.value.map(i => i.wau || 0), borderColor: c.success, backgroundColor: 'transparent', tension: 0.3 },
      { label: 'MAU', data: activeUsers.value.map(i => i.mau || 0), borderColor: c.warning, backgroundColor: 'transparent', tension: 0.3 },
    ],
  }
})

const lineChartOptions = baseOptions

async function loadActiveUsers() {
  activeUsersLoading.value = true
  try {
    const end = format(new Date(), 'yyyy-MM-dd')
    const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const data = await apiClient.getActiveUserStats({ period: activeUsersPeriod.value, start, end })
    activeUsers.value = data.items || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load active user data')
  } finally {
    activeUsersLoading.value = false
  }
}

// --- Feature Usage ---
const featureUsage = ref(null)
const featureUsageLoading = ref(false)

const featureUsageChartData = computed(() => {
  if (!featureUsage.value) return { labels: [], datasets: [] }
  const c = chartColors()
  const entries = Object.entries(featureUsage.value)
  return {
    labels: entries.map(([k]) => formatKey(k)),
    datasets: [{
      label: 'Count',
      data: entries.map(([, v]) => v),
      backgroundColor: c.action,
      borderRadius: 4,
    }],
  }
})

const horizontalBarOptions = {
  ...baseOptions,
  indexAxis: 'y',
  plugins: { ...baseOptions.plugins, legend: { display: false } },
}

async function loadFeatureUsage() {
  featureUsageLoading.value = true
  try {
    featureUsage.value = await apiClient.getFeatureUsageStats()
  } catch {
    featureUsage.value = null
  } finally {
    featureUsageLoading.value = false
  }
}

// --- Platform Health ---
const platformHealth = ref(null)
const platformHealthLoading = ref(false)

async function loadPlatformHealth() {
  platformHealthLoading.value = true
  try {
    platformHealth.value = await apiClient.getPlatformHealthStats()
  } catch {
    platformHealth.value = null
  } finally {
    platformHealthLoading.value = false
  }
}

// --- Helpers ---
function formatKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatChartDate(dateStr) {
  if (!dateStr) return ''
  try { return format(parseISO(dateStr), 'M/d') } catch { return dateStr }
}

onMounted(() => {
  loadSignups()
  loadActiveUsers()
  loadFeatureUsage()
  loadPlatformHealth()
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-title {
  margin-bottom: 24px;
}

.section {
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-controls {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.chart-container {
  position: relative;
  height: 260px;
}

.chart-container--short {
  height: 200px;
}

.summary-stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .chart-container {
    height: 200px;
  }
}
</style>
