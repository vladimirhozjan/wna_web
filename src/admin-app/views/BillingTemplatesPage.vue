<template>
  <div class="page">
    <div class="page-header">
      <h1 class="page-title">Billing Plans</h1>
    </div>

    <p class="text-body-s color-text-secondary intro">
      The 4 sellable plan options (Pro/Team × monthly/yearly). Each maps to a Paywiser billing template;
      subscribe uses the mapped template, so a plan must be configured here before it can be sold.
      Prices are EUR, VAT-inclusive.
    </p>

    <DataTable
        :columns="columns"
        :rows="catalog"
        :loading="loading"
        :show-pagination="false"
    >
      <template #cell-plan="{ row }">
        <span class="fw-medium">{{ row.planLabel }}</span>
      </template>
      <template #cell-billing_period="{ value }">
        <span class="period">{{ value }}</span>
      </template>
      <template #cell-price_minor="{ row }">
        {{ row.configured ? formatEur(row.price_minor) : '—' }}
      </template>
      <template #cell-active="{ row }">
        <Badge v-if="row.configured" :type="row.active ? 'active' : 'draft'" :value="row.active ? 'active' : 'inactive'" />
        <span v-else class="text-caption color-text-tertiary">Not configured</span>
      </template>
      <template #cell-paywiser_billing_template_id="{ value }">
        <span class="text-caption template-id">{{ value || '—' }}</span>
      </template>
      <template #cell-actions="{ row }">
        <Btn variant="secondary" size="sm" @click="openForm(row)">
          {{ row.configured ? 'Edit' : 'Create' }}
        </Btn>
      </template>
    </DataTable>

    <!-- Create / edit modal -->
    <Modal
        :visible="showForm"
        :title="`${editing?.configured ? 'Edit' : 'Create'} ${editing?.planLabel || ''} (${editing?.billing_period || ''})`"
        @close="closeForm"
    >
      <div class="form-body">
        <Inpt
            v-model="priceInput"
            type="text"
            title="Price (EUR, VAT-inclusive)"
            placeholder="e.g. 11.00"
            :disabled="saving"
        />
        <Inpt
            v-model="titleInput"
            type="text"
            title="Paywiser template title (optional)"
            placeholder="Defaults to the plan name"
            :disabled="saving"
        />
        <label class="text-body-s active-check">
          <input type="checkbox" v-model="activeInput" :disabled="saving" />
          <span>Active (sellable)</span>
        </label>
        <p v-if="formError" class="text-body-s color-text-danger form-error">{{ formError }}</p>
      </div>

      <template #actions>
        <Btn variant="secondary" size="sm" @click="closeForm" :disabled="saving">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="saving" :disabled="saving" @click="saveForm">
          {{ editing?.configured ? 'Save' : 'Create' }}
        </Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Modal from '../components/Modal.vue'
import Inpt from '../components/Inpt.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

const COMBOS = [
  { tier: 'pro', billing_period: 'monthly', planLabel: 'Pro' },
  { tier: 'pro', billing_period: 'yearly', planLabel: 'Pro' },
  { tier: 'team', billing_period: 'monthly', planLabel: 'Team' },
  { tier: 'team', billing_period: 'yearly', planLabel: 'Team' },
]

const columns = [
  { key: 'plan', label: 'Plan', width: '110px' },
  { key: 'billing_period', label: 'Period', width: '110px' },
  { key: 'price_minor', label: 'Price', width: '120px' },
  { key: 'active', label: 'Status', width: '140px' },
  { key: 'paywiser_billing_template_id', label: 'Paywiser Template' },
  { key: 'actions', label: '', width: '100px' },
]

const plans = ref([])
const loading = ref(false)

const catalog = computed(() => COMBOS.map(combo => {
  const plan = plans.value.find(p => p.tier === combo.tier && p.billing_period === combo.billing_period)
  return plan
      ? { ...combo, ...plan, configured: true, id: `${combo.tier}-${combo.billing_period}` }
      : { ...combo, configured: false, id: `${combo.tier}-${combo.billing_period}` }
}))

async function load() {
  loading.value = true
  try {
    const data = await apiClient.listBillingTemplates()
    plans.value = data.plans || []
  } catch (err) {
    toaster.push(err.message || 'Failed to load billing plans')
  } finally {
    loading.value = false
  }
}

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

// Create / edit form
const showForm = ref(false)
const editing = ref(null)
const priceInput = ref('')
const titleInput = ref('')
const activeInput = ref(true)
const saving = ref(false)
const formError = ref('')

function openForm(row) {
  editing.value = row
  priceInput.value = row.configured ? (row.price_minor / 100).toFixed(2) : ''
  titleInput.value = ''
  activeInput.value = row.configured ? row.active !== false : true
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

async function saveForm() {
  formError.value = ''
  const price = Number(priceInput.value.replace(',', '.'))
  if (!Number.isFinite(price) || price <= 0) {
    formError.value = 'Enter a valid price greater than 0'
    return
  }
  const priceMinor = Math.round(price * 100)

  saving.value = true
  try {
    if (editing.value.configured) {
      const body = { price_minor: priceMinor, active: activeInput.value }
      if (titleInput.value.trim()) body.title = titleInput.value.trim()
      await apiClient.updateBillingTemplate(editing.value.tier, editing.value.billing_period, body)
      toaster.success('Billing plan updated')
    } else {
      const body = {
        tier: editing.value.tier,
        billing_period: editing.value.billing_period,
        price_minor: priceMinor,
        currency: 'EUR',
        active: activeInput.value,
      }
      if (titleInput.value.trim()) body.title = titleInput.value.trim()
      await apiClient.createBillingTemplate(body)
      toaster.success('Billing plan created')
    }
    showForm.value = false
    await load()
  } catch (err) {
    formError.value = err.message || 'Failed to save billing plan'
  } finally {
    saving.value = false
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

.period {
  text-transform: capitalize;
}

.template-id {
  font-family: var(--font-family-mono);
  word-break: break-all;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.active-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.form-error {
  margin: 0;
}
</style>
