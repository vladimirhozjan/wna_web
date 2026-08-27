<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Payments</h1>
      <Btn variant="secondary" size="sm" :loading="exporting" @click="handleExport">Export CSV</Btn>
    </div>

    <!-- Period filter -->
    <div class="filters">
      <select v-model.number="year" class="text-body-s filter-select" @change="load">
        <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
      </select>
      <select v-model.number="month" class="text-body-s filter-select" @change="load">
        <option :value="0">Whole year</option>
        <option v-for="(m, i) in MONTHS" :key="m" :value="i + 1">{{ m }}</option>
      </select>
      <select v-model="status" class="text-body-s filter-select" @change="load">
        <option value="">All statuses</option>
        <option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="kind" class="text-body-s filter-select" @change="load">
        <option value="">All kinds</option>
        <option value="initial">Initial</option>
        <option value="renewal">Renewal</option>
        <option value="refund">Refund</option>
      </select>
      <select v-model="sort" class="text-body-s filter-select" @change="load">
        <option v-for="s in SORT_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
    </div>

    <!-- Totals (always whole-month, independent of filters) -->
    <div v-if="report" class="totals-card card">
      <Stat label="Payments" :value="report.totals?.count ?? 0" />
      <Stat label="Gross (EUR)" :value="formatEur(report.totals?.amount_minor)" />
      <Stat label="VAT (EUR)" :value="formatEur(report.totals?.vat_amount_minor)" />
      <Stat label="Refunded (EUR)" :value="formatEur(report.totals?.refunded?.amount_minor)" />
      <Stat label="Net (EUR)" :value="formatEur(report.totals?.net?.amount_minor)" />
    </div>

    <!-- VAT by country -->
    <h2 class="text-label color-text-secondary table-title">VAT by Country</h2>
    <DataTable
        :columns="vatColumns"
        :rows="report?.vat_by_country ?? []"
        :loading="loading"
        empty-text="No payments in this period."
        :show-pagination="false"
    >
      <template #cell-amount_minor="{ value }">{{ formatEur(value) }}</template>
      <template #cell-vat_amount_minor="{ value }">{{ formatEur(value) }}</template>
    </DataTable>

    <!-- Individual payments -->
    <h2 class="text-label color-text-secondary table-title">Payments</h2>
    <DataTable
        :columns="paymentColumns"
        :rows="pagedPayments"
        :loading="loading"
        empty-text="No payments in this period."
    >
      <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
      <template #cell-kind="{ value }"><span class="fw-medium">{{ value }}</span></template>
      <template #cell-status="{ value }"><Badge type="status" :value="value" /></template>
      <template #cell-evidence="{ row }"><PaymentEvidence :payment="row" /></template>
      <template #cell-amount_minor="{ value }">{{ formatEur(value) }}</template>
      <template #cell-vat_rate="{ value }">{{ value != null ? value + '%' : '—' }}</template>
      <template #cell-vat_amount_minor="{ value }">{{ value != null ? formatEur(value) : '—' }}</template>

      <template #pagination>
        <Pagination
            :page="page"
            :page-size="pageSize"
            :total="payments.length"
            @update:page="p => page = p"
        />
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import PaymentEvidence from '../components/PaymentEvidence.vue'
import Stat from '../components/Stat.vue'
import Btn from '../components/Btn.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'
import { downloadBlob } from '../scripts/core/downloadUtils.js'

const toaster = errorModel()

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const FIRST_PAYMENTS_YEAR = 2026

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'country_asc', label: 'Country A–Z' },
  { value: 'country_desc', label: 'Country Z–A' },
  { value: 'status_asc', label: 'Status A–Z' },
  { value: 'status_desc', label: 'Status Z–A' },
]

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const status = ref('')
const kind = ref('')
const sort = ref('date_desc')

const yearOptions = computed(() => {
  const years = []
  for (let y = now.getFullYear(); y >= FIRST_PAYMENTS_YEAR; y--) years.push(y)
  return years
})

const vatColumns = [
  { key: 'country', label: 'Country', width: '120px' },
  { key: 'count', label: 'Payments', width: '120px' },
  { key: 'amount_minor', label: 'Gross (EUR)' },
  { key: 'vat_amount_minor', label: 'VAT (EUR)' },
]

const paymentColumns = [
  { key: 'created_at', label: 'Date', width: '160px' },
  { key: 'kind', label: 'Kind', width: '90px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'billing_country', label: 'Country', width: '90px' },
  { key: 'evidence', label: 'Evidence', width: '200px' },
  { key: 'amount_minor', label: 'Amount (EUR)' },
  { key: 'vat_rate', label: 'VAT Rate', width: '100px' },
  { key: 'vat_amount_minor', label: 'VAT (EUR)' },
]

const report = ref(null)
const loading = ref(false)
const page = ref(1)
const pageSize = 20

const payments = computed(() => report.value?.payments ?? [])
const pagedPayments = computed(() =>
    payments.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const statusOptions = computed(() => {
  const facets = report.value?.status_facets ?? []
  return status.value && !facets.includes(status.value) ? [status.value, ...facets] : facets
})

async function load() {
  loading.value = true
  page.value = 1
  try {
    report.value = await apiClient.getPaymentsReport({
      year: year.value, month: month.value,
      status: status.value, kind: kind.value, sort: sort.value,
    })
  } catch (err) {
    toaster.push(err.message || 'Failed to load payments report')
    report.value = null
  } finally {
    loading.value = false
  }
}

const exporting = ref(false)

async function handleExport() {
  exporting.value = true
  try {
    const blob = await apiClient.exportPaymentsReport({
      year: year.value, month: month.value,
      status: status.value, kind: kind.value, sort: sort.value,
    })
    const suffix = month.value ? `-${String(month.value).padStart(2, '0')}` : ''
    downloadBlob(blob, `payments-${year.value}${suffix}.csv`)
    toaster.success('Export downloaded')
  } catch (err) {
    toaster.push(err.message || 'Failed to export payments report')
  } finally {
    exporting.value = false
  }
}

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
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

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
  min-width: 160px;
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
}

.totals-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.table-title {
  margin: 0 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table-title + .data-table-wrapper {
  margin-bottom: 20px;
}
</style>
