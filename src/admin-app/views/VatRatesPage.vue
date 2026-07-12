<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">VAT Rates</h1>
      <Btn variant="primary" size="sm" :loading="refreshing" :disabled="refreshing" @click="onRefresh">
        Refresh now
      </Btn>
    </div>

    <p class="text-body-s color-text-secondary intro">
      Effective-dated EU VAT rates used to price invoices. Rates refresh nightly from ibericode;
      countries without a fetched row fall back to the compiled EU-27 baseline.
    </p>

    <div class="toolbar">
      <SearchInput v-model="search" placeholder="Search by country code or name..." />

      <label class="text-body-s history-check">
        <input type="checkbox" v-model="showHistory" />
        <span>Show history</span>
      </label>
    </div>

    <DataTable
        :columns="columns"
        :rows="filteredRows"
        :loading="loading"
        :show-pagination="false"
        empty-text="No VAT rates found."
    >
      <template #cell-country="{ row }">
        <span class="fw-medium">{{ row.country_code }}</span>
        <span class="color-text-secondary country-name">{{ countryName(row.country_code) }}</span>
      </template>
      <template #cell-standard_rate="{ value }">
        {{ formatRate(value) }}
      </template>
      <template #cell-effective_from="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-source="{ value }">
        <Badge :type="value === 'ibericode' ? 'active' : 'pending'" :value="value" />
      </template>
      <template #cell-fetched_at="{ value }">
        {{ formatDateTime(value) }}
      </template>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import SearchInput from '../components/SearchInput.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

const columns = [
  { key: 'country', label: 'Country' },
  { key: 'standard_rate', label: 'Rate', width: '100px' },
  { key: 'effective_from', label: 'Effective From', width: '150px' },
  { key: 'source', label: 'Source', width: '130px' },
  { key: 'fetched_at', label: 'Fetched At', width: '180px' },
]

const rates = ref([])
const loading = ref(false)
const refreshing = ref(false)
const search = ref('')
const showHistory = ref(false)

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

const filteredRows = computed(() => {
  let rows = rates.value
  if (!showHistory.value) rows = rows.filter(r => r.current)
  const q = search.value.trim().toLowerCase()
  if (q) {
    rows = rows.filter(r =>
        r.country_code.toLowerCase().includes(q) ||
        countryName(r.country_code).toLowerCase().includes(q)
    )
  }
  return rows.map(r => ({ ...r, id: `${r.country_code}-${r.effective_from}` }))
})

function countryName(code) {
  try { return regionNames.of(code) || '' } catch { return '' }
}

function formatRate(val) {
  return val == null ? '—' : `${Number(val)}%`
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy') } catch { return val }
}

function formatDateTime(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

async function load() {
  loading.value = true
  try {
    const data = await apiClient.listVatRates()
    rates.value = data.items || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load VAT rates')
  } finally {
    loading.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  try {
    const res = await apiClient.refreshVatRates()
    toaster.success(`VAT rates refreshed (${res.source}, ${res.upserted} upserted)`)
    await load()
  } catch (err) {
    toaster.push(err.message || 'Failed to refresh VAT rates')
  } finally {
    refreshing.value = false
  }
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

.intro {
  margin: 0 0 16px;
  max-width: 720px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.history-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.country-name {
  margin-left: 8px;
}
</style>
