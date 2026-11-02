<template>
  <div class="page">
    <h1 class="page-title">Analytics</h1>

    <!-- Visitors -->
    <div class="section card">
      <div class="section-header">
        <h3 class="text-label color-text-secondary section-title">Visitors</h3>
        <div class="section-controls">
          <select v-model="visitRange" class="text-body-s filter-select" @change="loadVisitAnalytics">
            <option v-for="r in VISIT_RANGES" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
      </div>

      <div v-if="visitorsLoading" class="loading-state"><Spinner size="sm" /></div>
      <div v-else-if="visitorsError" class="error-state">
        <p class="text-body-s color-text-danger">Couldn't load visitors.</p>
        <Btn variant="secondary" size="sm" @click="loadVisitors">Retry</Btn>
      </div>
      <div v-else-if="visitors?.totals?.visits">
        <div class="chart-container">
          <Line :data="visitorsChartData" :options="lineChartOptions" />
        </div>
        <div class="summary-stats">
          <Stat label="Visits" :value="visitors.totals.visits" />
          <Stat label="Visitors" :value="visitors.totals.visitors" />
          <Stat label="Signup Rate" :value="formatPct(visitors.totals.signup_rate)" />
        </div>
        <p class="text-caption color-text-tertiary footnote">
          Counted per day without cookies — a visitor who returns on another day counts again. Bots are excluded.
        </p>
      </div>
      <p v-else class="text-caption color-text-tertiary">No visits in this period.</p>
    </div>

    <!-- Traffic Sources -->
    <div class="section section--plain">
      <div class="section-header">
        <div class="section-heading">
          <h3 class="text-label color-text-secondary section-title">Traffic Sources</h3>
          <span class="text-caption color-text-tertiary">{{ visitRangeLabel }}</span>
        </div>
        <div class="section-controls">
          <span class="text-body-s color-text-secondary">Group by</span>
          <select v-model="sourceGroup" class="text-body-s filter-select" @change="loadTrafficSources">
            <option v-for="g in SOURCE_GROUPS" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </div>
      </div>

      <div v-if="sourcesError" class="error-state">
        <p class="text-body-s color-text-danger">Couldn't load traffic sources.</p>
        <Btn variant="secondary" size="sm" @click="loadTrafficSources">Retry</Btn>
      </div>
      <template v-else>
        <DataTable
            class="sources-table"
            :columns="sourceColumns"
            :rows="sourceRows"
            :loading="sourcesLoading"
            :show-pagination="false"
            empty-text="No visits in this period."
        >
          <template #cell-label="{ row }">
            <span class="source-name">{{ sourceName(row) }}</span>
            <span v-if="row.sublabel" class="text-caption color-text-tertiary source-name">{{ row.sublabel }}</span>
          </template>
          <template #cell-visits="{ value }">{{ formatInt(value) }}</template>
          <template #cell-visitors="{ value }">{{ formatInt(value) }}</template>
          <template #cell-signups="{ value }">{{ formatInt(value) }}</template>
          <template #cell-signup_rate="{ value }">{{ formatPct(value) }}</template>
          <template #cell-share="{ value }">{{ formatPct(value) }}</template>
        </DataTable>
        <p v-if="!sourcesLoading && sources?.truncated" class="text-caption color-text-tertiary table-note">
          Top {{ sources.shown }} shown.
        </p>
        <DbIpAttribution v-if="!sourcesLoading && sources?.group === 'country' && sourceRows.length" class="attribution" />
      </template>
    </div>

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

    <!-- Email to Inbox — support+ only (endpoint is support-gated) -->
    <div v-if="hasMinRole(role, 'support')" class="section card">
      <h3 class="text-label color-text-secondary section-title">Email to Inbox</h3>
      <div v-if="inboxStatsLoading" class="loading-state"><Spinner size="sm" /></div>
      <div v-else-if="inboxStats" class="stats-grid">
        <Stat label="Active Addresses" :value="inboxStats.active_addresses ?? 0" />
        <Stat label="Processed Today" :value="inboxStats.processed_today ?? 0" />
        <Stat label="Failed Today" :value="inboxStats.failed_today ?? 0" />
        <Stat label="Rejected Today" :value="inboxStats.rejected_today ?? 0" />
      </div>
      <p v-else class="text-caption color-text-tertiary">No inbox email stats available.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO, subDays } from 'date-fns'
import { Bar, Line } from 'vue-chartjs'
import Btn from '../components/Btn.vue'
import DataTable from '../components/DataTable.vue'
import DbIpAttribution from '../components/DbIpAttribution.vue'
import Spinner from '../components/Spinner.vue'
import Stat from '../components/Stat.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import { authModel, hasMinRole } from '../scripts/core/authModel.js'
import apiClient from '../scripts/core/apiClient.js'
import { chartColors, baseOptions } from '../scripts/core/chartTheme.js'

const toaster = errorModel()
const auth = authModel()
const role = computed(() => auth.currentAdmin.value?.role)

// --- Visitors + Traffic Sources (one range for both) ---
const VISIT_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '12m', label: 'Last 12 months' },
]

const SOURCE_GROUPS = [
  { value: 'source', label: 'Source' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'ad', label: 'Ad' },
  { value: 'page', label: 'Page' },
  { value: 'referrer', label: 'Referrer' },
  { value: 'country', label: 'Country' },
  { value: 'device', label: 'Device' },
  { value: 'browser', label: 'Browser' },
]

const NONE_LABELS = { source: 'No campaign', campaign: 'No campaign', ad: 'No campaign', referrer: 'Direct' }

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const visitRange = ref('30d')
const visitRangeLabel = computed(() => VISIT_RANGES.find(r => r.value === visitRange.value)?.label)

const visitors = ref(null)
const visitorsLoading = ref(false)
const visitorsError = ref(false)
let visitorsSeq = 0

const visitorsChartData = computed(() => {
  const c = chartColors.value
  const items = visitors.value?.items || []
  const bucket = visitors.value?.bucket
  return {
    labels: items.map(i => bucket === 'month' ? formatMonth(i.date) : formatChartDate(i.date)),
    datasets: [
      { label: 'Visits', data: items.map(i => i.visits || 0), borderColor: c.action, backgroundColor: c.action + '20', fill: true, tension: 0.3 },
      { label: 'Visitors', data: items.map(i => i.visitors || 0), borderColor: c.success, backgroundColor: 'transparent', tension: 0.3 },
    ],
  }
})

async function loadVisitors() {
  const seq = ++visitorsSeq
  visitorsLoading.value = true
  visitorsError.value = false
  try {
    const data = await apiClient.getVisitorStats(visitRange.value)
    if (seq !== visitorsSeq) return
    visitors.value = data
  } catch {
    if (seq !== visitorsSeq) return
    visitorsError.value = true
  } finally {
    if (seq === visitorsSeq) visitorsLoading.value = false
  }
}

const sourceGroup = ref('campaign')
const sources = ref(null)
const sourcesLoading = ref(false)
const sourcesError = ref(false)
let sourcesSeq = 0

// Columns follow the rows on screen; the select may already show a newer group while it loads
const sourceColumns = computed(() => {
  const group = sources.value?.group || sourceGroup.value
  const name = { key: 'label', label: SOURCE_GROUPS.find(g => g.value === group)?.label }
  const counts = [{ key: 'visits', label: 'Visits' }, { key: 'visitors', label: 'Visitors' }]
  if (sources.value?.utm) return [name, ...counts, { key: 'signups', label: 'Signups' }, { key: 'signup_rate', label: 'Signup Rate' }]
  return [name, ...counts, { key: 'share', label: 'Share' }]
})

const sourceRows = computed(() => (sources.value?.rows || []).map((r, i) => ({ ...r, id: i + 1 })))

function sourceName(row) {
  if (row.none) return NONE_LABELS[sources.value.group] || 'Unknown'
  if (sources.value.group !== 'country') return row.label
  try { return regionNames.of(row.label) || row.label } catch { return row.label }
}

async function loadTrafficSources() {
  const seq = ++sourcesSeq
  sourcesLoading.value = true
  sourcesError.value = false
  try {
    const data = await apiClient.getTrafficSources(visitRange.value, sourceGroup.value)
    if (seq !== sourcesSeq) return
    sources.value = data
  } catch {
    if (seq !== sourcesSeq) return
    sourcesError.value = true
  } finally {
    if (seq === sourcesSeq) sourcesLoading.value = false
  }
}

function loadVisitAnalytics() {
  loadVisitors()
  loadTrafficSources()
}

// --- Signups ---
const signupPeriod = ref('day')
const signups = ref([])
const signupsLoading = ref(false)

const signupsTotalPeriod = computed(() => signups.value.reduce((sum, i) => sum + (i.signups || 0), 0))

const signupChartData = computed(() => {
  const c = chartColors.value
  return {
    labels: signups.value.map(i => formatChartDate(i.date)),
    datasets: [
      { label: 'Email', data: signups.value.map(i => i.email_signups || 0), backgroundColor: c.action, stack: 'signups' },
      { label: 'Google', data: signups.value.map(i => i.google_signups || 0), backgroundColor: c.success, stack: 'signups' },
      { label: 'Apple', data: signups.value.map(i => i.apple_signups || 0), backgroundColor: c.warning, stack: 'signups' },
    ],
  }
})

const signupChartOptions = computed(() => {
  const b = baseOptions.value
  return { ...b, scales: { ...b.scales, x: { ...b.scales.x, stacked: true }, y: { ...b.scales.y, stacked: true } } }
})

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
  const c = chartColors.value
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
  const c = chartColors.value
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

const horizontalBarOptions = computed(() => ({
  ...baseOptions.value,
  indexAxis: 'y',
  plugins: { ...baseOptions.value.plugins, legend: { display: false } },
}))

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

// --- Email to Inbox stats ---
// Stats body is owned by email_service and not yet finalized; missing keys render as 0.
const inboxStats = ref(null)
const inboxStatsLoading = ref(false)

async function loadInboxEmailStats() {
  inboxStatsLoading.value = true
  try {
    inboxStats.value = await apiClient.getInboxEmailStats()
  } catch {
    inboxStats.value = null
  } finally {
    inboxStatsLoading.value = false
  }
}

// --- Helpers ---
function formatInt(val) {
  return val == null ? '—' : Number(val).toLocaleString()
}

function formatPct(val) {
  return val == null ? '—' : `${Number(val).toFixed(1)} %`
}

function formatMonth(dateStr) {
  try { return format(parseISO(dateStr), 'MMM yyyy') } catch { return dateStr }
}

function formatKey(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatChartDate(dateStr) {
  if (!dateStr) return ''
  try { return format(parseISO(dateStr), 'M/d') } catch { return dateStr }
}

onMounted(() => {
  loadVisitAnalytics()
  loadSignups()
  loadActiveUsers()
  loadFeatureUsage()
  loadPlatformHealth()
  // Endpoint is support-gated; skip the call for viewers so they don't get a 403.
  if (hasMinRole(role.value, 'support')) loadInboxEmailStats()
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

.section--plain {
  padding: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.section-controls {
  display: flex;
  align-items: center;
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
  flex-wrap: wrap;
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

.footnote {
  margin: 12px 0 0;
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

.sources-table :deep(th:not(:first-child)),
.sources-table :deep(td:not(:first-child)) {
  text-align: right;
  white-space: nowrap;
}

.source-name {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.table-note {
  margin: 8px 0 0;
}

.attribution {
  display: block;
  margin-top: 8px;
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

  .section--plain .section-controls {
    width: 100%;
  }

  .section--plain .filter-select {
    flex: 1;
  }

  /* Visitors carries the count on narrow screens */
  .sources-table :deep(th:nth-child(2)),
  .sources-table :deep(td:nth-child(2)) {
    display: none;
  }
}
</style>
