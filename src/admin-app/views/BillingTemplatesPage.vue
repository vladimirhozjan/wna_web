<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Billing Templates</h1>
      <Btn variant="primary" size="sm" @click="openCreate">Create Template</Btn>
    </div>

    <p class="text-body-s color-text-secondary intro">
      A template's price and title are editable — a price edit re-prices all active subscriptions of
      that template at their next renewal. Currency and period are immutable — create a new template
      when those change, and hide retired ones. The 4 pricing slots below decide which template each
      plan option sells; a slot without an active assignment is not offered.
    </p>

    <h3 class="text-label color-text-secondary section-title">Pricing Slots</h3>
    <DataTable
        :columns="slotColumns"
        :rows="slotRows"
        :loading="loading"
        :show-pagination="false"
        class="section-table"
    >
      <template #cell-slot="{ row }">
        <span class="fw-medium">{{ row.planLabel }}</span>
        <span class="period"> · {{ row.billing_period }}</span>
      </template>
      <template #cell-template="{ row }">
        <select
            class="text-body-s slot-select"
            :value="row.template?.id || ''"
            :disabled="actionLoading"
            @change="onAssign(row, $event.target.value)"
        >
          <option value="">— Unassigned —</option>
          <option v-for="t in templates" :key="t.id" :value="t.id">
            {{ templateLabel(t) }}
          </option>
        </select>
      </template>
      <template #cell-active="{ row }">
        <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--on': row.active }"
            :disabled="actionLoading"
            @click="onToggleActive(row)"
            :aria-label="row.active ? 'Deactivate' : 'Activate'"
        >
          <span class="toggle-knob"></span>
        </button>
      </template>
    </DataTable>

    <div class="catalog-header">
      <h3 class="text-label color-text-secondary section-title">Template Catalog</h3>
      <label class="text-body-s hidden-check">
        <input type="checkbox" v-model="showHidden" />
        <span>Show hidden</span>
      </label>
    </div>
    <DataTable
        :columns="catalogColumns"
        :rows="catalogRows"
        :loading="loading"
        :show-pagination="false"
        empty-text="No billing templates yet."
    >
      <template #cell-title="{ row }">
        <span class="fw-medium">{{ row.title || '—' }}</span>
        <Badge v-if="row.hidden" type="draft" value="hidden" class="hidden-badge" />
      </template>
      <template #cell-price_minor="{ value }">
        {{ formatPrice(value) }}
      </template>
      <template #cell-period="{ row }">
        {{ formatPeriod(row.period_count, row.period_units) }}
      </template>
      <template #cell-paywiser_billing_template_id="{ value }">
        <span class="text-caption template-id">{{ value || '—' }}</span>
      </template>
      <template #cell-assigned_to="{ value }">
        <span v-if="value">{{ slotLabel(value) }}</span>
        <span v-else class="color-text-tertiary">—</span>
      </template>
      <template #cell-created_at="{ value }">
        {{ formatDate(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="row-actions">
          <Btn
              variant="ghost"
              size="sm"
              :disabled="actionLoading"
              @click="openEdit(row)"
          >Edit</Btn>
          <Btn
              variant="ghost"
              size="sm"
              :loading="hidingId === row.id"
              :disabled="actionLoading"
              @click="onToggleHidden(row)"
          >{{ row.hidden ? 'Unhide' : 'Hide' }}</Btn>
        </div>
      </template>
    </DataTable>

    <!-- Create modal -->
    <Modal :visible="showCreate" title="Create Billing Template" @close="closeCreate">
      <div class="form-body">
        <div class="form-row">
          <Inpt
              v-model="priceInput"
              type="text"
              title="Price (VAT-inclusive)"
              placeholder="e.g. 11.00"
              :disabled="saving"
          />
          <Inpt
              v-model="currencyInput"
              type="text"
              title="Currency"
              placeholder="EUR"
              :disabled="saving"
          />
        </div>
        <div class="form-row">
          <Inpt
              v-model="periodCountInput"
              type="number"
              title="Period count"
              placeholder="1"
              :disabled="saving"
          />
          <label class="select-label">
            <span class="text-label color-text-primary">Period units</span>
            <select v-model="periodUnitsInput" class="text-body-m select-input" :disabled="saving">
              <option value="days">days</option>
              <option value="weeks">weeks</option>
              <option value="months">months</option>
            </select>
          </label>
        </div>
        <Inpt
            v-model="titleInput"
            type="text"
            title="Paywiser template title (optional)"
            placeholder="e.g. WNA Pro monthly"
            :disabled="saving"
        />
        <p v-if="formError" class="text-body-s color-text-danger form-error">{{ formError }}</p>
      </div>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeCreate" :disabled="saving">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="saving" :disabled="saving" @click="saveCreate">Create</Btn>
      </template>
    </Modal>

    <!-- Edit modal -->
    <Modal :visible="showEdit" title="Edit Billing Template" @close="closeEdit">
      <div class="form-body">
        <Inpt
            v-model="editPriceInput"
            type="text"
            title="Price (VAT-inclusive)"
            placeholder="e.g. 11.00"
            :disabled="editSaving"
        />
        <Inpt
            v-model="editTitleInput"
            type="text"
            title="Paywiser template title"
            :disabled="editSaving"
        />
        <p v-if="editError" class="text-body-s color-text-danger form-error">{{ editError }}</p>
      </div>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeEdit" :disabled="editSaving">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="editSaving" :disabled="editSaving || !editChanged" @click="saveEdit">Save</Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format, parseISO } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()
const confirm = confirmModel()

const SLOT_ORDER = [
  { tier: 'pro', billing_period: 'monthly', planLabel: 'Pro' },
  { tier: 'pro', billing_period: 'yearly', planLabel: 'Pro' },
  { tier: 'team', billing_period: 'monthly', planLabel: 'Team' },
  { tier: 'team', billing_period: 'yearly', planLabel: 'Team' },
]

const slotColumns = [
  { key: 'slot', label: 'Slot', width: '180px' },
  { key: 'template', label: 'Assigned Template' },
  { key: 'active', label: 'Active', width: '90px' },
]

const catalogColumns = [
  { key: 'title', label: 'Title' },
  { key: 'price_minor', label: 'Price', width: '90px' },
  { key: 'currency', label: 'Currency', width: '90px' },
  { key: 'period', label: 'Period', width: '110px' },
  { key: 'paywiser_billing_template_id', label: 'Paywiser Template' },
  { key: 'assigned_to', label: 'Assigned Slot', width: '140px' },
  { key: 'created_at', label: 'Created', width: '120px' },
  { key: 'actions', label: '', width: '150px' },
]

const templates = ref([])
const plans = ref([])
const loading = ref(false)
const actionLoading = ref(false)
const showHidden = ref(false)

const slotRows = computed(() => SLOT_ORDER.map(slot => {
  const plan = plans.value.find(p => p.tier === slot.tier && p.billing_period === slot.billing_period)
  return { ...slot, ...plan, id: `${slot.tier}-${slot.billing_period}` }
}))

const catalogRows = computed(() =>
    showHidden.value ? templates.value : templates.value.filter(t => !t.hidden))

async function loadAll() {
  loading.value = true
  try {
    const [tplData, planData] = await Promise.all([
      apiClient.listBillingTemplates({ includeHidden: true }),
      apiClient.listBillingPlans(),
    ])
    templates.value = tplData.templates || []
    plans.value = planData.plans || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load billing templates')
  } finally {
    loading.value = false
  }
}

function formatPrice(minor) {
  return minor == null ? '—' : (minor / 100).toFixed(2)
}

function formatPeriod(count, units) {
  if (count == null || !units) return '—'
  return `${count} ${count === 1 ? units.replace(/s$/, '') : units}`
}

function formatDate(val) {
  if (!val) return '—'
  try { return format(parseISO(val), 'MMM d, yyyy') } catch { return val }
}

function slotLabel({ tier, billing_period }) {
  const slot = SLOT_ORDER.find(s => s.tier === tier && s.billing_period === billing_period)
  return `${slot?.planLabel || tier} · ${billing_period}`
}

function templateLabel(t) {
  const parts = [t.title || 'Untitled', `${formatPrice(t.price_minor)} ${t.currency}`, formatPeriod(t.period_count, t.period_units)]
  return parts.join(' — ') + (t.hidden ? ' (hidden)' : '')
}

// Slot assignment / active toggle
async function onAssign(slot, templateId) {
  actionLoading.value = true
  try {
    await apiClient.setBillingPlan(slot.tier, slot.billing_period, { billing_template_id: templateId || null })
    toaster.success(templateId ? `Template assigned to ${slotLabel(slot)}` : `${slotLabel(slot)} unassigned`)
  } catch (err) {
    toaster.push(err.message || 'Failed to update slot')
  } finally {
    actionLoading.value = false
    await loadAll()
  }
}

async function onToggleActive(slot) {
  actionLoading.value = true
  try {
    await apiClient.setBillingPlan(slot.tier, slot.billing_period, { active: !slot.active })
    toaster.success(`${slotLabel(slot)} ${!slot.active ? 'activated' : 'deactivated'}`)
  } catch (err) {
    toaster.push(err.message || 'Failed to update slot')
  } finally {
    actionLoading.value = false
    await loadAll()
  }
}

// Hide / unhide
const hidingId = ref(null)

async function onToggleHidden(row) {
  hidingId.value = row.id
  actionLoading.value = true
  try {
    await apiClient.setBillingTemplateHidden(row.id, !row.hidden)
    toaster.success(`Template ${!row.hidden ? 'hidden' : 'unhidden'}`)
    await loadAll()
  } catch (err) {
    toaster.push(err.message || 'Failed to update template')
  } finally {
    hidingId.value = null
    actionLoading.value = false
  }
}

// Create form
const showCreate = ref(false)
const priceInput = ref('')
const currencyInput = ref('EUR')
const periodCountInput = ref('1')
const periodUnitsInput = ref('months')
const titleInput = ref('')
const saving = ref(false)
const formError = ref('')

function openCreate() {
  priceInput.value = ''
  currencyInput.value = 'EUR'
  periodCountInput.value = '1'
  periodUnitsInput.value = 'months'
  titleInput.value = ''
  formError.value = ''
  showCreate.value = true
}

function closeCreate() {
  if (saving.value) return
  showCreate.value = false
}

async function saveCreate() {
  formError.value = ''
  const price = Number(priceInput.value.replace(',', '.'))
  if (!Number.isFinite(price) || price <= 0) {
    formError.value = 'Enter a valid price greater than 0'
    return
  }
  const currency = currencyInput.value.trim().toUpperCase()
  if (!/^[A-Z]{3}$/.test(currency)) {
    formError.value = 'Currency must be a 3-letter code (e.g. EUR)'
    return
  }
  const periodCount = Number(periodCountInput.value)
  if (!Number.isInteger(periodCount) || periodCount < 1) {
    formError.value = 'Period count must be a whole number of at least 1'
    return
  }

  saving.value = true
  try {
    const body = {
      price_minor: Math.round(price * 100),
      currency,
      period_count: periodCount,
      period_units: periodUnitsInput.value,
    }
    if (titleInput.value.trim()) body.title = titleInput.value.trim()
    await apiClient.createBillingTemplate(body)
    toaster.success('Billing template created')
    showCreate.value = false
    await loadAll()
  } catch (err) {
    formError.value = err.message || 'Failed to create billing template'
  } finally {
    saving.value = false
  }
}

// Edit form
const showEdit = ref(false)
const editRow = ref(null)
const editPriceInput = ref('')
const editTitleInput = ref('')
const editSaving = ref(false)
const editError = ref('')

const editChanged = computed(() => {
  if (!editRow.value) return false
  return editPriceInput.value !== formatPrice(editRow.value.price_minor)
      || editTitleInput.value.trim() !== (editRow.value.title || '')
})

function openEdit(row) {
  editRow.value = row
  editPriceInput.value = formatPrice(row.price_minor)
  editTitleInput.value = row.title || ''
  editError.value = ''
  showEdit.value = true
}

function closeEdit() {
  if (editSaving.value) return
  showEdit.value = false
}

async function saveEdit() {
  editError.value = ''
  const row = editRow.value
  const price = Number(editPriceInput.value.replace(',', '.'))
  if (!Number.isFinite(price) || price <= 0) {
    editError.value = 'Enter a valid price greater than 0'
    return
  }

  const body = {}
  const priceMinor = Math.round(price * 100)
  if (priceMinor !== row.price_minor) body.price_minor = priceMinor

  const title = editTitleInput.value.trim()
  if (title !== (row.title || '')) {
    if (!title) {
      editError.value = 'Title cannot be empty'
      return
    }
    if (title.length > 120) {
      editError.value = 'Title must be 120 characters or fewer'
      return
    }
    body.title = title
  }

  if (!Object.keys(body).length) {
    showEdit.value = false
    return
  }

  if ('price_minor' in body) {
    const count = row.active_subscriptions ?? 0
    const confirmed = await confirm.show({
      title: 'Change Price',
      message: `${count} active subscription${count === 1 ? '' : 's'} will renew at the new price.`,
      confirmText: 'Change Price',
      cancelText: 'Cancel',
    })
    if (!confirmed) return
  }

  editSaving.value = true
  try {
    await apiClient.updateBillingTemplate(row.id, body)
    toaster.success('Billing template updated')
    showEdit.value = false
    await loadAll()
  } catch (err) {
    editError.value = err.message || 'Failed to update billing template'
  } finally {
    editSaving.value = false
  }
}

onMounted(loadAll)
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
  margin: 0 0 20px;
  max-width: 720px;
}

.section-title {
  margin: 0 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-table {
  margin-bottom: 24px;
}

.catalog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.catalog-header .section-title {
  margin-bottom: 0;
}

.hidden-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.hidden-badge {
  margin-left: 8px;
}

.period {
  text-transform: capitalize;
}

.template-id {
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.row-actions {
  display: flex;
  gap: 4px;
}

/* Slot select */
.slot-select {
  max-width: 420px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.slot-select:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

/* Toggle */
.toggle-btn {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: var(--color-border-medium);
  cursor: pointer;
  transition: background 0.2s;
  padding: 0;
}

.toggle-btn--on {
  background: var(--color-success);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.toggle-btn--on .toggle-knob {
  transform: translateX(18px);
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Create form */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.select-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.select-input {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid var(--color-input-border);
  background: var(--color-input-background);
  color: var(--color-text-primary);
}

.select-input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.form-error {
  margin: 0;
}
</style>
