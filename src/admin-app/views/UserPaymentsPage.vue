<template>
  <div class="page">
    <div class="page-header">
      <RouterLink :to="`/users/${userId}`" class="text-body-s back-link">&larr; User</RouterLink>
      <h1 class="page-title">Payments</h1>
    </div>

    <div class="filters">
      <Select
          :model-value="filters.status"
          :options="STATUS_OPTIONS"
          title="Status"
          @update:model-value="v => setFilter('status', v)"
      />
      <Select
          :model-value="filters.kind"
          :options="KIND_OPTIONS"
          title="Kind"
          @update:model-value="v => setFilter('kind', v)"
      />
    </div>

    <DataTable
        :columns="columns"
        :rows="items"
        :loading="loading"
        :row-clickable="true"
        :expanded-key="expandedId"
        empty-text="No payments."
        @row-click="toggleExpanded"
    >
      <template #cell-expand="{ row }">
        <span class="color-text-tertiary">{{ expandedId === row.id ? '▾' : '▸' }}</span>
      </template>
      <template #cell-created_at="{ value }">{{ formatDate(value) }}</template>
      <template #cell-kind="{ value }"><span class="fw-medium payment-kind">{{ value }}</span></template>
      <template #cell-amount_minor="{ value }">{{ formatEur(value) }}</template>
      <template #cell-vat_amount_minor="{ value }">{{ value != null ? formatEur(value) : '—' }}</template>
      <template #cell-billing_country="{ value }">{{ value || '—' }}</template>
      <template #cell-card="{ row }">{{ formatCard(row) }}</template>
      <template #cell-ip_country="{ value }">{{ value || '—' }}</template>
      <template #cell-provider="{ value }">{{ gatewayLabel(value) || '—' }}</template>
      <template #cell-payment_method_type="{ value }">{{ value || '—' }}</template>
      <template #cell-status="{ value }"><Badge type="status" :value="value" /></template>
      <template #cell-actions="{ row }">
        <Btn
            v-if="row.kind !== 'refund' && row.status === 'paid'"
            variant="ghost-danger" size="sm"
            @click.stop="handleRefund(row)"
        >
          Refund
        </Btn>
      </template>

      <template #expanded="{ row }">
        <div class="evidence">
          <span v-if="row.terms_version" class="text-caption color-text-secondary evidence-terms">
            ToS {{ row.terms_version }} accepted {{ formatDate(row.terms_accepted_at) }}<template v-if="row.terms_accepted_ip"> · IP {{ row.terms_accepted_ip }}</template><template v-if="row.terms_accepted_user_agent"> · {{ row.terms_accepted_user_agent }}</template>
          </span>
          <span v-else class="text-caption color-text-tertiary">No ToS acceptance recorded on this row</span>
          <span class="text-caption">
            <PaymentEvidence :payment="row" /><template v-if="row.location_conflict"> · <span class="color-text-secondary">card and IP country both differ from billing country</span></template>
          </span>
        </div>
      </template>

      <template #pagination>
        <Pagination :page="page" :page-size="pageSize" :total="total" @update:page="setPage" />
      </template>
    </DataTable>

    <!-- Refund Modal -->
    <Modal :visible="!!refundTarget" title="Refund Payment" @close="refundTarget = null">
      <p class="text-body-s">
        Refund this payment — full or partial. This returns the money only: the tier and
        expiration are not changed, and no credit note is issued.
      </p>
      <p class="text-body-s color-text-secondary refund-remaining">
        Charged {{ formatEur(refundTarget?.amount_minor) }} · refundable {{ refundLoading ? '…' : formatEur(refundRemainingMinor) }}
      </p>
      <Inpt
          v-model="refundAmountInput"
          v-model:error="refundError"
          type="number"
          title="Amount (EUR)"
          placeholder="0.00"
          :disabled="refundSaving || refundLoading"
      />

      <template #actions>
        <Btn variant="secondary" size="sm" @click="refundTarget = null" :disabled="refundSaving">Cancel</Btn>
        <Btn
            variant="danger" size="sm"
            :loading="refundSaving"
            :disabled="refundSaving || refundLoading"
            @click="confirmRefund"
        >
          Refund
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
import PaymentEvidence from '../components/PaymentEvidence.vue'
import Select from '../components/Select.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient, { gatewayLabel } from '../scripts/core/apiClient.js'
import { usePagedList } from '../scripts/core/usePagedList.js'

const route = useRoute()
const toaster = errorModel()
const userId = route.params.id

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'pending', label: 'Pending' },
  { value: 'created', label: 'Created' },
]

const KIND_OPTIONS = [
  { value: '', label: 'All kinds' },
  { value: 'initial', label: 'Initial' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'refund', label: 'Refund' },
]

const columns = [
  { key: 'expand', label: '', width: '32px' },
  { key: 'created_at', label: 'Date', width: '160px' },
  { key: 'kind', label: 'Kind', width: '90px' },
  { key: 'amount_minor', label: 'Amount', width: '100px' },
  { key: 'vat_amount_minor', label: 'VAT', width: '90px' },
  { key: 'billing_country', label: 'Billing country', width: '110px' },
  { key: 'card', label: 'Card' },
  { key: 'ip_country', label: 'IP country', width: '90px' },
  { key: 'provider', label: 'Gateway', width: '100px' },
  { key: 'payment_method_type', label: 'Method', width: '100px' },
  { key: 'status', label: 'Status', width: '110px' },
  { key: 'actions', label: '', width: '100px' },
]

const { items, total, loading, page, pageSize, filters, setPage, setFilter, reload } = usePagedList(
    params => apiClient.getPlatformUserPayments(userId, params),
    { status: '', kind: '' },
    'Failed to load payments',
)

const expandedId = ref(null)
const refundTarget = ref(null)
const refundAmountInput = ref('')
const refundError = ref('')
const refundSaving = ref(false)
const refundLoading = ref(false)
const refundRemainingMinor = ref(0)

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy HH:mm') } catch { return val }
}

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

function formatCard(p) {
  const brand = p.card_brand ? p.card_brand.charAt(0).toUpperCase() + p.card_brand.slice(1) : ''
  const card = [brand, p.card_last4 ? `•••• ${p.card_last4}` : ''].filter(Boolean).join(' ')
  return [card, p.card_country].filter(Boolean).join(' · ') || '—'
}

function toggleExpanded(row) {
  expandedId.value = expandedId.value === row.id ? null : row.id
}

function parseEurInput(value) {
  const eur = Number(value)
  if (!Number.isFinite(eur) || eur <= 0) return null
  return Math.round(eur * 100)
}

// Charge minus prior refunds of the same charge (refund rows share gateway_charge_id); they may sit on other pages
async function handleRefund(p) {
  refundTarget.value = p
  refundError.value = ''
  refundRemainingMinor.value = p.amount_minor
  refundAmountInput.value = (p.amount_minor / 100).toFixed(2)
  refundLoading.value = true
  try {
    const data = await apiClient.getPlatformUserPayments(userId, { kind: 'refund', limit: 100 })
    const refunded = (data.items || [])
        .filter(r => r.gateway_charge_id === p.gateway_charge_id)
        .reduce((sum, r) => sum + r.amount_minor, 0)
    refundRemainingMinor.value = Math.max(0, p.amount_minor - refunded)
    refundAmountInput.value = (refundRemainingMinor.value / 100).toFixed(2)
  } catch (err) {
    toaster.push(err.message || 'Failed to load prior refunds')
  } finally {
    refundLoading.value = false
  }
}

async function confirmRefund() {
  const p = refundTarget.value
  const amountMinor = parseEurInput(refundAmountInput.value)
  if (amountMinor === null) {
    refundError.value = 'Enter a valid amount'
    return
  }

  refundSaving.value = true
  try {
    // full charge ⇒ omit the amount (backend treats an empty body as a full refund)
    await apiClient.refundPlatformUserPayment(userId, p.id, amountMinor === p.amount_minor ? 0 : amountMinor)
    toaster.success('Payment refunded')
    refundTarget.value = null
    await reload()
  } catch (err) {
    toaster.push(err.message || 'Failed to refund payment')
  } finally {
    refundSaving.value = false
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

.payment-kind {
  text-transform: capitalize;
}

.evidence {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.evidence-terms {
  overflow-wrap: anywhere;
}

.refund-remaining {
  margin: 8px 0;
}

/* wide table keeps its columns; DataTable's own wrapper scrolls horizontally */
@media (max-width: 1024px) {
  .page :deep(.data-table) {
    min-width: 1100px;
  }
}
</style>
