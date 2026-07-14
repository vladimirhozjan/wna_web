<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Invoices</h1>
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
    <div v-if="register" class="totals-card card">
      <Stat
          label="Invoiced"
          :value="formatEur(register.totals?.invoiced?.gross_minor)"
          :trend="totalsTrend(register.totals?.invoiced)"
      />
      <Stat
          label="Credited"
          :value="formatEur(register.totals?.credited?.gross_minor)"
          :trend="totalsTrend(register.totals?.credited)"
      />
      <Stat
          label="Net"
          :value="formatEur(register.totals?.net?.gross_minor)"
          :trend="`VAT ${formatEur(register.totals?.net?.vat_minor)}`"
      />
    </div>

    <!-- Type filter + search -->
    <div class="toolbar">
      <div class="tabs">
        <button
            v-for="t in TYPE_TABS"
            :key="t.key"
            type="button"
            class="tab-btn text-body-s"
            :class="{ active: typeFilter === t.key }"
            @click="typeFilter = t.key"
        >
          {{ t.label }}
        </button>
      </div>
      <SearchInput v-model="search" placeholder="Search number or buyer..." />
    </div>

    <DataTable
        :columns="columns"
        :rows="pagedDocuments"
        :loading="loading"
        empty-text="No documents in this period."
        row-clickable
        @row-click="openDocument"
    >
      <template #cell-number="{ value }"><span class="fw-medium">{{ value }}</span></template>
      <template #cell-type="{ row }">
        <Badge v-if="row.type === 'invoice'" type="primary" value="Invoice" />
        <Badge v-else type="pending" value="Credit note" />
      </template>
      <template #cell-issued_at="{ value }">{{ formatDate(value) }}</template>
      <template #cell-buyer_name="{ row }">
        <div class="buyer-cell">
          <span>{{ row.buyer_name || '—' }}</span>
          <RouterLink
              v-if="row.user_id"
              :to="`/users/${row.user_id}`"
              class="text-caption buyer-link"
              @click.stop
          >
            {{ row.user_email }}
          </RouterLink>
          <Badge v-else type="draft" value="account deleted" />
        </div>
      </template>
      <template #cell-amount_minor="{ row, value }">{{ formatSignedEur(row, value) }}</template>
      <template #cell-vat_rate="{ value }">{{ value != null ? value + '%' : '—' }}</template>
      <template #cell-vat_amount_minor="{ row, value }">
        {{ value != null ? formatSignedEur(row, value) : '—' }}
      </template>
      <template #cell-actions="{ row }">
        <Btn
            variant="icon" size="sm"
            :loading="downloadingId === row.id"
            :disabled="downloadingId !== null"
            title="Download PDF"
            @click.stop="downloadDocument(row)"
        >
          <svg class="download-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 3v10m0 0l-4-4m4 4l4-4"/><path d="M3 15v2h14v-2"/></svg>
        </Btn>
      </template>

      <template #pagination>
        <Pagination
            :page="page"
            :page-size="pageSize"
            :total="filteredDocuments.length"
            @update:page="p => page = p"
        />
      </template>
    </DataTable>

    <!-- Document popup -->
    <Modal
        :visible="!!viewedDocument"
        :title="viewedDocument?.number || ''"
        max-width="860px"
        @close="closeDocument"
    >
      <div v-if="htmlLoading" class="html-loading">
        <Spinner />
      </div>
      <div v-else class="html-scroll">
        <iframe
            class="document-frame"
            sandbox="allow-same-origin"
            :srcdoc="viewedHtml"
            title="Document preview"
        ></iframe>
      </div>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeDocument">Close</Btn>
        <Btn
            variant="primary" size="sm"
            :loading="modalDownloading"
            :disabled="htmlLoading || modalDownloading"
            @click="downloadFromModal"
        >
          Download PDF
        </Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Pagination from '../components/Pagination.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Stat from '../components/Stat.vue'
import Spinner from '../components/Spinner.vue'
import Modal from '../components/Modal.vue'
import SearchInput from '../components/SearchInput.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'
import { downloadDocumentPdf } from '../scripts/core/invoicePdf.js'

const toaster = errorModel()

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const FIRST_PAYMENTS_YEAR = 2026

const TYPE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'credit_note', label: 'Credit notes' },
]

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const yearOptions = computed(() => {
  const years = []
  for (let y = now.getFullYear(); y >= FIRST_PAYMENTS_YEAR; y--) years.push(y)
  return years
})

const columns = [
  { key: 'number', label: 'Number', width: '150px' },
  { key: 'type', label: 'Type', width: '110px' },
  { key: 'issued_at', label: 'Date', width: '160px' },
  { key: 'buyer_name', label: 'Buyer' },
  { key: 'billing_country', label: 'Country', width: '90px' },
  { key: 'amount_minor', label: 'Gross (EUR)', width: '110px' },
  { key: 'vat_rate', label: 'VAT Rate', width: '100px' },
  { key: 'vat_amount_minor', label: 'VAT (EUR)', width: '100px' },
  { key: 'actions', label: '', width: '50px' },
]

const register = ref(null)
const loading = ref(false)
const typeFilter = ref('all')
const search = ref('')
const page = ref(1)
const pageSize = 20

const downloadingId = ref(null)
const viewedDocument = ref(null)
const viewedHtml = ref('')
const htmlLoading = ref(false)
const modalDownloading = ref(false)

const documents = computed(() => register.value?.documents ?? [])

const filteredDocuments = computed(() => {
  let docs = documents.value
  if (typeFilter.value !== 'all') {
    docs = docs.filter(d => d.type === typeFilter.value)
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    docs = docs.filter(d =>
        (d.number || '').toLowerCase().includes(q) ||
        (d.buyer_name || '').toLowerCase().includes(q) ||
        (d.user_email || '').toLowerCase().includes(q))
  }
  return docs
})

const pagedDocuments = computed(() =>
    filteredDocuments.value.slice((page.value - 1) * pageSize, page.value * pageSize))

async function load() {
  loading.value = true
  page.value = 1
  try {
    register.value = await apiClient.getBillingDocuments({ year: year.value, month: month.value })
  } catch (err) {
    toaster.push(err.message || 'Failed to load billing documents')
    register.value = null
  } finally {
    loading.value = false
  }
}

function totalsTrend(group) {
  if (!group) return ''
  return `${group.count ?? 0} document${group.count === 1 ? '' : 's'} · VAT ${formatEur(group.vat_minor)}`
}

function formatEur(minor) {
  if (minor == null) return '—'
  const sign = minor < 0 ? '−' : ''
  return `${sign}€${(Math.abs(minor) / 100).toFixed(2)}`
}

function formatSignedEur(row, minor) {
  if (minor == null) return '—'
  return row.type === 'credit_note' ? `−€${(minor / 100).toFixed(2)}` : formatEur(minor)
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function fetchDocumentHtml(doc) {
  return doc.type === 'invoice'
      ? apiClient.getBillingDocumentInvoiceHtml(doc.id)
      : apiClient.getBillingDocumentCreditNoteHtml(doc.id)
}

async function openDocument(doc) {
  viewedDocument.value = doc
  viewedHtml.value = ''
  htmlLoading.value = true
  try {
    viewedHtml.value = await fetchDocumentHtml(doc)
  } catch (err) {
    toaster.push(err.message || 'Failed to load document')
    viewedDocument.value = null
  } finally {
    htmlLoading.value = false
  }
}

function closeDocument() {
  viewedDocument.value = null
  viewedHtml.value = ''
}

async function downloadFromModal() {
  if (!viewedDocument.value || !viewedHtml.value) return
  modalDownloading.value = true
  try {
    await downloadDocumentPdf(viewedHtml.value, `${viewedDocument.value.number}.pdf`)
  } catch (err) {
    toaster.push(err.message || 'Failed to download PDF')
  } finally {
    modalDownloading.value = false
  }
}

async function downloadDocument(doc) {
  if (downloadingId.value) return
  downloadingId.value = doc.id
  try {
    const html = await fetchDocumentHtml(doc)
    await downloadDocumentPdf(html, `${doc.number}.pdf`)
  } catch (err) {
    toaster.push(err.message || 'Failed to download PDF')
  } finally {
    downloadingId.value = null
  }
}

watch([typeFilter, search], () => { page.value = 1 })

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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--color-border-light);
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

.buyer-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
}

.buyer-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.buyer-link:hover {
  color: var(--color-link-hover);
}

.download-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.html-loading {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.html-scroll {
  overflow: auto;
  max-height: 70vh;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  background: var(--color-bg-secondary);
}

.document-frame {
  display: block;
  width: 794px;
  max-width: 100%;
  height: 70vh;
  border: 0;
  background: var(--color-bg-primary);
}
</style>
