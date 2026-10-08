<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User</RouterLink>
      <h1 class="page-title">Invoices</h1>
    </div>

    <div class="filters">
      <Select
          :model-value="filters.type"
          :options="TYPE_OPTIONS"
          title="Type"
          @update:model-value="v => setFilter('type', v)"
      />
      <Select
          :model-value="filters.fiscal_status"
          :options="FISCAL_OPTIONS"
          title="Fiscal status"
          @update:model-value="v => setFilter('fiscal_status', v)"
      />
    </div>

    <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        empty-text="No invoices issued."
    >
      <template #cell-number="{ row }">
        <div class="number-cell">
          <span class="fw-medium">{{ row.number }}</span>
          <span v-if="row.original_invoice_number" class="text-caption color-text-tertiary">for {{ row.original_invoice_number }}</span>
        </div>
      </template>
      <template #cell-type="{ value }">{{ value === 'credit_note' ? 'Credit note' : 'Invoice' }}</template>
      <template #cell-issued_at="{ value }">{{ formatDate(value) }}</template>
      <template #cell-amount_minor="{ row }">{{ row.type === 'credit_note' ? '−' : '' }}{{ formatEur(row.amount_minor) }}</template>
      <template #cell-fiscal_status="{ value }"><Badge type="fiscal" :value="value" /></template>
      <template #cell-payment="{ value }">
        <span v-if="value" class="payment-kind">{{ formatDate(value.created_at) }} · {{ value.kind }}</span>
        <span v-else>—</span>
      </template>
      <template #cell-actions="{ row }">
        <div class="row-actions">
          <Btn
              v-if="row.type !== 'credit_note'"
              variant="secondary" size="sm"
              @click="handleIssueCreditNote(row)"
          >
            Credit note
          </Btn>
          <Btn
              variant="secondary" size="sm"
              :loading="downloadingId === row.id"
              :disabled="downloadingId !== null"
              @click="download(row)"
          >
            Download
          </Btn>
        </div>
      </template>

      <template #pagination>
        <Pagination :page="page" :page-size="pageSize" :total="total" @update:page="setPage" />
      </template>
    </DataTable>

    <!-- Issue Credit Note Modal -->
    <Modal :visible="!!creditNoteTarget" title="Issue Credit Note" @close="creditNoteTarget = null">
      <p class="text-body-s">
        Issue a credit note against invoice {{ creditNoteTarget?.number }} — a legal
        correction document. It moves no money; refunds are separate.
      </p>
      <Inpt
          v-model="creditNoteAmountInput"
          v-model:error="creditNoteError"
          type="number"
          title="Amount (EUR)"
          placeholder="0.00"
          :disabled="creditNoteSaving"
      />

      <template #actions>
        <Btn variant="secondary" size="sm" @click="creditNoteTarget = null" :disabled="creditNoteSaving">Cancel</Btn>
        <Btn
            variant="primary" size="sm"
            :loading="creditNoteSaving"
            :disabled="creditNoteSaving"
            @click="confirmIssueCreditNote"
        >
          Issue
        </Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import DataTable from '../components/DataTable.vue'
import Inpt from '../components/Inpt.vue'
import Modal from '../components/Modal.vue'
import Pagination from '../components/Pagination.vue'
import Select from '../components/Select.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'
import { usePagedList } from '../scripts/core/usePagedList.js'
import { downloadDocumentPdf } from '../../shared/invoicePdf.js'

const route = useRoute()
const toaster = errorModel()
const userId = route.params.id

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'credit_note', label: 'Credit notes' },
]

const FISCAL_OPTIONS = [
  { value: '', label: 'All fiscal statuses' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'zoi_only_retrying', label: 'ZOI retrying' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'not_required', label: 'Not required' },
]

const columns = [
  { key: 'number', label: 'Number', width: '180px' },
  { key: 'type', label: 'Type', width: '110px' },
  { key: 'issued_at', label: 'Issued', width: '160px' },
  { key: 'amount_minor', label: 'Amount', width: '100px' },
  { key: 'fiscal_status', label: 'Fiscal status', width: '130px' },
  { key: 'payment', label: 'Linked payment' },
  { key: 'actions', label: '', width: '220px' },
]

const { items, total, loading, page, pageSize, filters, setPage, setFilter, reload } = usePagedList(
    params => apiClient.listPlatformUserInvoices(userId, params),
    { type: '', fiscal_status: '' },
    'Failed to load invoices',
)

const downloadingId = ref(null)
const creditNoteTarget = ref(null)
const creditNoteAmountInput = ref('')
const creditNoteError = ref('')
const creditNoteSaving = ref(false)

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

function parseEurInput(value) {
  const eur = Number(value)
  if (!Number.isFinite(eur) || eur <= 0) return null
  return Math.round(eur * 100)
}

function handleIssueCreditNote(inv) {
  creditNoteTarget.value = inv
  creditNoteError.value = ''
  creditNoteAmountInput.value = (inv.amount_minor / 100).toFixed(2)
}

async function confirmIssueCreditNote() {
  const inv = creditNoteTarget.value
  const amountMinor = parseEurInput(creditNoteAmountInput.value)
  if (amountMinor === null) {
    creditNoteError.value = 'Enter a valid amount'
    return
  }

  creditNoteSaving.value = true
  try {
    await apiClient.issueCreditNote(userId, inv.id, amountMinor === inv.amount_minor ? 0 : amountMinor)
    toaster.success('Credit note issued')
    creditNoteTarget.value = null
    await reload()
  } catch (err) {
    toaster.push(err.message || 'Failed to issue credit note')
  } finally {
    creditNoteSaving.value = false
  }
}

async function download(doc) {
  if (downloadingId.value) return
  const isCreditNote = doc.type === 'credit_note'
  downloadingId.value = doc.id
  try {
    const html = isCreditNote
        ? await apiClient.getPlatformUserCreditNoteHtml(userId, doc.id)
        : await apiClient.getPlatformUserInvoiceHtml(userId, doc.id)
    await downloadDocumentPdf(html, `${isCreditNote ? 'credit-note' : 'invoice'}-${doc.number}.pdf`)
  } catch (err) {
    toaster.push(err.message || `Failed to download ${isCreditNote ? 'credit note' : 'invoice'}`)
  } finally {
    downloadingId.value = null
  }
}
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.back-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-link-hover);
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.number-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.payment-kind {
  text-transform: capitalize;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  white-space: nowrap;
}
</style>
