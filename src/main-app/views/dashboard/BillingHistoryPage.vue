<template>
  <DashboardLayout>
    <div class="billing-page">

      <div class="billing-header">
        <h1 class="page-title">Billing History</h1>
      </div>

      <div class="billing-body">
        <div v-if="loading" class="billing-state">
          <Spinner :size="16" />
          <span>Loading payments...</span>
        </div>

        <div v-else-if="error" class="billing-state billing-state--error">
          <span>{{ error }}</span>
          <Btn variant="secondary" size="sm" @click="load">Retry</Btn>
        </div>

        <div v-else-if="payments.length === 0" class="billing-state">
          No payments yet.
        </div>

        <div v-else class="card billing-list">
          <template v-for="p in payments" :key="p.id">
            <div
                class="billing-row"
                :class="{ 'billing-row--clickable': p.invoice }"
                @click="p.invoice && openPreview('invoice', p.invoice)"
            >
              <div class="billing-row-info">
                <span class="billing-row-title">{{ rowTitle(p) }}</span>
                <span class="text-body-s billing-row-meta">
                  {{ formatDate(p.created_at) }}<template v-if="p.invoice"> · Invoice {{ p.invoice.invoice_number }}</template>
                </span>
              </div>
              <span class="billing-row-amount" :class="{ 'billing-row-amount--refund': p.kind === 'refund' }">{{ formatAmount(p) }}</span>
              <Btn
                  v-if="p.invoice"
                  variant="secondary" size="sm"
                  :loading="downloadingId === p.invoice.id"
                  :disabled="downloadingId !== null"
                  @click.stop="download('invoice', p.invoice)"
              >Download</Btn>
            </div>

            <div
                v-for="cn in p.invoice?.credit_notes || []"
                :key="cn.id"
                class="billing-row billing-row--nested billing-row--clickable"
                @click="openPreview('credit-note', cn)"
            >
              <div class="billing-row-info">
                <span class="billing-row-title">Credit note {{ cn.credit_note_number }}</span>
                <span class="text-body-s billing-row-meta">{{ formatDate(cn.issued_at) }}</span>
              </div>
              <span class="billing-row-amount billing-row-amount--refund">−€{{ (cn.amount_minor / 100).toFixed(2) }}</span>
              <Btn
                  variant="secondary" size="sm"
                  :loading="downloadingId === cn.id"
                  :disabled="downloadingId !== null"
                  @click.stop="download('credit-note', cn)"
              >Download</Btn>
            </div>
          </template>
        </div>
      </div>

      <Modal :visible="preview.visible" :title="preview.title" maxWidth="860px" @close="closePreview">
        <div v-if="!preview.html" class="billing-state">
          <Spinner :size="16" />
          <span>Loading...</span>
        </div>
        <iframe v-else class="billing-preview-frame" sandbox="" :srcdoc="preview.html"></iframe>
        <template #actions>
          <Btn variant="secondary" size="md" @click="closePreview">Close</Btn>
          <Btn
              variant="primary" size="md"
              :loading="downloadingId === preview.doc?.id"
              :disabled="!preview.html || downloadingId !== null"
              @click="download(preview.type, preview.doc)"
          >Download</Btn>
        </template>
      </Modal>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import Modal from '../../components/Modal.vue'
import Spinner from '../../components/Spinner.vue'
import { errorModel } from '../../scripts/core/errorModel.js'
import { getPaymentHistory, getInvoiceHtml, getCreditNoteHtml } from '../../scripts/core/apiClient.js'
import { downloadDocumentPdf } from '../../scripts/core/invoicePdf.js'

const toaster = errorModel()

const payments = ref([])
const loading = ref(false)
const error = ref(null)
const downloadingId = ref(null)

const preview = reactive({
  visible: false,
  type: null,
  doc: null,
  title: '',
  html: null,
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const data = await getPaymentHistory()
    payments.value = data.payments || []
  } catch (err) {
    error.value = err.message || 'Failed to load billing history'
  } finally {
    loading.value = false
  }
}

function rowTitle(p) {
  const kind = p.kind.charAt(0).toUpperCase() + p.kind.slice(1)
  return `${kind} · ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`
}

function formatAmount(p) {
  const value = `€${(p.amount_minor / 100).toFixed(2)}`
  return p.kind === 'refund' ? `−${value}` : value
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy') } catch { return val }
}

function docHtml(type, doc) {
  return type === 'invoice' ? getInvoiceHtml(doc.id) : getCreditNoteHtml(doc.id)
}

function docFilename(type, doc) {
  return type === 'invoice' ? `invoice-${doc.invoice_number}.pdf` : `credit-note-${doc.credit_note_number}.pdf`
}

async function openPreview(type, doc) {
  preview.visible = true
  preview.type = type
  preview.doc = doc
  preview.title = type === 'invoice' ? `Invoice ${doc.invoice_number}` : `Credit note ${doc.credit_note_number}`
  preview.html = null
  try {
    preview.html = await docHtml(type, doc)
  } catch (err) {
    preview.visible = false
    toaster.push(err.message || 'Failed to load document')
  }
}

function closePreview() {
  preview.visible = false
  preview.html = null
  preview.doc = null
}

async function download(type, doc) {
  if (downloadingId.value) return
  downloadingId.value = doc.id
  try {
    const html = preview.doc?.id === doc.id && preview.html ? preview.html : await docHtml(type, doc)
    await downloadDocumentPdf(html, docFilename(type, doc))
  } catch (err) {
    toaster.push(err.message || 'Failed to download document')
  } finally {
    downloadingId.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.billing-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.billing-header {
  flex-shrink: 0;
  padding: 0 16px;
  margin-bottom: 15px;
}

.billing-header h1 {
  margin: 0;
}

.billing-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 20px;
}

.billing-list {
  padding: 4px 20px;
}

.billing-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-border-subtle);
}

.billing-row:last-child {
  border-bottom: none;
}

.billing-row--clickable {
  cursor: pointer;
}

.billing-row--clickable:hover {
  background: var(--color-bg-secondary);
}

.billing-row--nested {
  padding-left: 24px;
}

.billing-row-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.billing-row-title {
  font-size: 14px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}

.billing-row-meta {
  color: var(--color-text-tertiary);
}

.billing-row-amount {
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.billing-row-amount--refund {
  color: var(--color-text-danger);
}

.billing-preview-frame {
  width: 100%;
  height: 60vh;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  background: white;
}

.billing-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--color-text-secondary);
}

.billing-state--error {
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .billing-body {
    padding: 0 12px 20px;
  }

  .billing-row {
    flex-wrap: wrap;
  }
}
</style>
