<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Payments</h1>
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
    </div>

    <!-- Totals -->
    <div v-if="report" class="totals-card card">
      <Stat label="Payments" :value="report.totals?.count ?? 0" />
      <Stat label="Gross (EUR)" :value="formatEur(report.totals?.amount_minor)" />
      <Stat label="VAT (EUR)" :value="formatEur(report.totals?.vat_amount_minor)" />
    </div>

    <!-- VAT by country (OSS reporting) -->
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
import Stat from '../components/Stat.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const FIRST_PAYMENTS_YEAR = 2026

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

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

async function load() {
  loading.value = true
  page.value = 1
  try {
    report.value = await apiClient.getPaymentsReport({ year: year.value, month: month.value })
  } catch (err) {
    toaster.push(err.message || 'Failed to load payments report')
    report.value = null
  } finally {
    loading.value = false
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
