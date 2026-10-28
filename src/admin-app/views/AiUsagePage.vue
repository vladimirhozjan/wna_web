<template>
  <div class="page">
    <h1 class="page-title">AI Usage</h1>

    <div class="filters">
      <Select v-model="month" :options="monthOptions" title="Month" />
      <Select v-model="tier" :options="TIER_OPTIONS" title="Tier" />
      <Select v-model="modelId" :options="modelOptions" title="Model" />
      <SearchInput v-model="email" placeholder="User email" />
      <div class="group-by">
        <span class="text-body-s color-text-secondary">Group by</span>
        <Select v-model="group" :options="GROUP_OPTIONS" title="Group by" />
      </div>
    </div>

    <p v-if="loading" class="text-body-m color-text-tertiary state">Loading…</p>

    <div v-else-if="loadError" class="state state--error">
      <p class="text-body-m color-text-danger">Couldn't load AI usage.</p>
      <Btn variant="secondary" size="sm" @click="load">Retry</Btn>
    </div>

    <template v-else>
      <div class="card totals">
        <Stat label="Requests" :value="totals.requests ?? 0" />
        <Stat label="Tokens in" :value="totals.tokens_in ?? 0" />
        <Stat label="Tokens out" :value="totals.tokens_out ?? 0" />
        <Stat label="Cost (€)" :value="formatCost(totals.cost_eur)" />
        <Stat label="Credits spent" :value="totals.credits ?? 0" />
      </div>

      <DataTable
          :columns="columns"
          :rows="tableRows"
          :show-pagination="false"
          empty-text="No AI usage in this period."
      >
        <template #cell-name="{ row }">
          <template v-if="usedGroup === 'user'">
            <RouterLink v-if="row.user_id" :to="`/users/${row.user_id}`" class="row-link">{{ row.name || row.key }}</RouterLink>
            <span v-else class="color-text-secondary">Deleted user</span>
          </template>
          <span v-else-if="usedGroup === 'tier'" class="tier-name">{{ row.name || row.key }}</span>
          <span v-else>{{ row.name || row.key }}</span>
        </template>
        <template #cell-requests="{ value }">{{ formatInt(value) }}</template>
        <template #cell-tokens_in="{ value }">{{ formatInt(value) }}</template>
        <template #cell-tokens_out="{ value }">{{ formatInt(value) }}</template>
        <template #cell-cost_eur="{ value }">{{ formatCost(value) }}</template>
        <template #cell-credits="{ value }">{{ formatInt(value) }}</template>
      </DataTable>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { format } from 'date-fns'
import DataTable from '../components/DataTable.vue'
import Btn from '../components/Btn.vue'
import SearchInput from '../components/SearchInput.vue'
import Select from '../components/Select.vue'
import Stat from '../components/Stat.vue'
import apiClient from '../scripts/core/apiClient.js'

// Usage rows are kept 13 months
const MONTHS_KEPT = 13

const TIER_OPTIONS = [
  { value: '', label: 'All tiers' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
]

const GROUP_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'tier', label: 'Tier' },
  { value: 'model', label: 'Model' },
]

const GROUP_LABELS = { user: 'User', tier: 'Tier', model: 'Model' }

const monthOptions = buildMonthOptions()
const month = ref(monthOptions[0].value)
const tier = ref('')
const modelId = ref('')
const email = ref('')
const group = ref('user')
const models = ref([])

const loading = ref(false)
const loadError = ref(false)
const totals = ref({})
const rows = ref([])
// Group of the rows on screen; the Select may already show a newer choice while it loads
const usedGroup = ref('user')
let requestSeq = 0

const modelOptions = computed(() => [
  { value: '', label: 'All models' },
  ...models.value.map(m => ({ value: String(m.id), label: m.display_name })),
])

const columns = computed(() => [
  { key: 'name', label: GROUP_LABELS[usedGroup.value] },
  { key: 'requests', label: 'Requests' },
  { key: 'tokens_in', label: 'Tokens in' },
  { key: 'tokens_out', label: 'Tokens out' },
  { key: 'cost_eur', label: 'Cost (€)' },
  { key: 'credits', label: 'Credits spent' },
])

const tableRows = computed(() => rows.value.map(r => ({ ...r, id: r.key })))

function buildMonthOptions() {
  const now = new Date()
  const options = []
  for (let i = 0; i < MONTHS_KEPT; i++) {
    const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    options.push({ value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') })
  }
  return options
}

function formatInt(val) {
  return val == null ? '—' : Number(val).toLocaleString()
}

function formatCost(val) {
  if (val == null) return '—'
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

async function load() {
  const seq = ++requestSeq
  const params = { month: month.value, group: group.value }
  if (tier.value) params.tier = tier.value
  if (modelId.value) params.model_id = modelId.value
  if (email.value.trim()) params.email = email.value.trim()

  loading.value = true
  loadError.value = false
  try {
    const data = await apiClient.getAiUsage(params)
    if (seq !== requestSeq) return
    totals.value = data.totals || {}
    rows.value = data.rows || []
    usedGroup.value = params.group
  } catch {
    if (seq !== requestSeq) return
    loadError.value = true
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

async function loadModels() {
  try {
    const data = await apiClient.listAiModels()
    models.value = data.models || []
  } catch {
    models.value = []
  }
}

watch([month, tier, modelId, email, group], load)

onMounted(() => {
  loadModels()
  load()
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-title {
  margin-bottom: 24px;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.group-by {
  display: flex;
  align-items: center;
  gap: 8px;
}

.state {
  padding: 24px 0;
  margin: 0;
}

.state--error {
  display: flex;
  align-items: center;
  gap: 12px;
}

.state--error p {
  margin: 0;
}

.totals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  padding: 20px;
}

.row-link {
  color: var(--color-link-text);
  text-decoration: none;
}

.row-link:hover {
  color: var(--color-link-hover);
}

.tier-name {
  text-transform: capitalize;
}
</style>
