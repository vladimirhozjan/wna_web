<template>
  <div class="page">
    <h1 class="page-title">AI Assistant</h1>

    <div class="section-header">
      <h3 class="text-label color-text-secondary section-title">Models</h3>
      <Btn variant="primary" size="sm" @click="openAddModel">Add model</Btn>
    </div>
    <DataTable
        :columns="modelColumns"
        :rows="models"
        :loading="modelsLoading"
        :row-clickable="true"
        :show-pagination="false"
        empty-text="No models."
        class="section-table"
        @row-click="openEditModel"
    >
      <template #cell-model="{ row }">
        <div class="model-name">
          <span class="fw-medium">{{ row.display_name }}</span>
          <span class="text-caption color-text-tertiary">{{ row.vertex_model_id }}</span>
        </div>
      </template>
      <template #cell-offered="{ row }">
        <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--on': row.offered }"
            :disabled="toggleSaving"
            :aria-label="row.offered ? 'Stop offering' : 'Offer'"
            @click.stop="toggleOffered(row)"
        >
          <span class="toggle-knob"></span>
        </button>
      </template>
      <template #cell-is_default="{ value }">
        <Badge v-if="value" type="primary" value="Default" />
      </template>
      <template #cell-requests_30d="{ value }">{{ formatInt(value) }}</template>
    </DataTable>

    <div class="card credits-card">
      <h3 class="text-label color-text-secondary section-title">Monthly credits</h3>
      <p class="text-caption color-text-tertiary credits-hint">Per user per month</p>
      <div class="credits-grid">
        <Inpt v-model="tierCredits.free" type="number" title="Free" :disabled="tierLoading || tierSaving" />
        <Inpt v-model="tierCredits.pro" type="number" title="Pro" :disabled="tierLoading || tierSaving" />
        <Inpt v-model="tierCredits.team" type="number" title="Team" :disabled="tierLoading || tierSaving" />
      </div>
      <div class="credits-actions">
        <Btn variant="primary" size="sm" :loading="tierSaving" :disabled="tierLoading || tierSaving" @click="saveTierCredits">
          Save
        </Btn>
      </div>
    </div>

    <div class="section-header">
      <h3 class="text-label color-text-secondary section-title">Credit packs</h3>
      <Btn variant="primary" size="sm" @click="openAddPack">Add pack</Btn>
    </div>
    <DataTable
        :columns="packColumns"
        :rows="packs"
        :loading="packsLoading"
        :row-clickable="true"
        :show-pagination="false"
        empty-text="No credit packs."
        @row-click="openEditPack"
    >
      <template #cell-credits="{ value }">{{ formatInt(value) }}</template>
      <template #cell-price_minor="{ value }">{{ formatEur(value) }}</template>
      <template #cell-active="{ row }">
        <button
            type="button"
            class="toggle-btn"
            :class="{ 'toggle-btn--on': row.active }"
            :disabled="toggleSaving"
            :aria-label="row.active ? 'Deactivate' : 'Activate'"
            @click.stop="togglePackActive(row)"
        >
          <span class="toggle-knob"></span>
        </button>
      </template>
    </DataTable>

    <!-- Add / Edit model -->
    <Modal :visible="showModelModal" :title="editingModel ? 'Edit model' : 'Add model'" @close="closeModelModal">
      <form class="modal-form" @submit.prevent="saveModel">
        <Inpt
            v-if="!editingModel"
            v-model="modelForm.vertex_model_id"
            v-model:error="modelErrors.vertex_model_id"
            type="text"
            title="Vertex model id"
            :disabled="modelSaving"
        />
        <Inpt v-model="modelForm.display_name" type="text" title="Display name" :disabled="modelSaving" />
        <Inpt
            v-model="modelForm.credits_per_request"
            v-model:error="modelErrors.credits_per_request"
            type="number"
            title="Credits per request"
            :disabled="modelSaving"
        />
        <Inpt v-model="modelForm.context_tokens" type="number" title="Context per round (tokens)" :disabled="modelSaving" />
        <Inpt
            v-model="modelForm.conversation_tokens"
            v-model:error="modelErrors.conversation_tokens"
            type="number"
            title="Conversation part (tokens)"
            :disabled="modelSaving"
        />
        <Inpt v-model="modelForm.price_in_eur_per_mtok" type="text" title="Price in (€ per 1M tokens)" :disabled="modelSaving" />
        <Inpt v-model="modelForm.price_cached_in_eur_per_mtok" type="text" title="Price cached in (€ per 1M tokens)" :disabled="modelSaving" />
        <Inpt v-model="modelForm.price_out_eur_per_mtok" type="text" title="Price out (€ per 1M tokens)" :disabled="modelSaving" />
        <!-- A new model starts not offered, so it can only become the default once edited -->
        <label v-if="editingModel" class="text-body-s check-label">
          <input v-model="modelForm.is_default" type="checkbox" :disabled="modelSaving || !!editingModel?.is_default" />
          <span>Make default</span>
        </label>
        <p v-if="modelFormError" class="text-body-s color-text-danger form-error">{{ modelFormError }}</p>
      </form>

      <template #actions>
        <Btn variant="secondary" size="sm" :disabled="modelSaving" @click="closeModelModal">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="modelSaving" @click="saveModel">Save</Btn>
      </template>
    </Modal>

    <!-- Add / Edit pack -->
    <Modal :visible="showPackModal" :title="editingPack ? 'Edit pack' : 'Add pack'" @close="closePackModal">
      <form class="modal-form" @submit.prevent="savePack">
        <Inpt v-model="packForm.credits" type="number" title="Credits" :disabled="packSaving" />
        <Inpt v-model="packForm.price" type="text" title="Price (EUR, VAT incl.)" :disabled="packSaving" />
        <p v-if="packFormError" class="text-body-s color-text-danger form-error">{{ packFormError }}</p>
      </form>

      <template #actions>
        <Btn variant="secondary" size="sm" :disabled="packSaving" @click="closePackModal">Cancel</Btn>
        <Btn variant="primary" size="sm" :loading="packSaving" @click="savePack">Save</Btn>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import DataTable from '../components/DataTable.vue'
import Badge from '../components/Badge.vue'
import Btn from '../components/Btn.vue'
import Inpt from '../components/Inpt.vue'
import Modal from '../components/Modal.vue'
import { errorModel } from '../scripts/core/errorModel.js'
import apiClient from '../scripts/core/apiClient.js'

const toaster = errorModel()

const SAVE_FAILED = "Couldn't save. Try again."

const modelColumns = [
  { key: 'model', label: 'Model' },
  { key: 'offered', label: 'Offered', width: '80px' },
  { key: 'is_default', label: 'Default', width: '90px' },
  { key: 'credits_per_request', label: 'Credits per request' },
  { key: 'context_tokens', label: 'Context per round (tokens)' },
  { key: 'conversation_tokens', label: 'Conversation part (tokens)' },
  { key: 'avg_cost_eur_30d', label: 'Avg cost per request, last 30 days (€)' },
  { key: 'requests_30d', label: 'Requests, last 30 days' },
]

const packColumns = [
  { key: 'credits', label: 'Credits' },
  { key: 'price_minor', label: 'Price (EUR, VAT incl.)' },
  { key: 'active', label: 'Active', width: '80px' },
]

const models = ref([])
const modelsLoading = ref(false)
const packs = ref([])
const packsLoading = ref(false)
const toggleSaving = ref(false)

const tierCredits = reactive({ free: '', pro: '', team: '' })
const tierLoading = ref(false)
const tierSaving = ref(false)

const showModelModal = ref(false)
const editingModel = ref(null)
const modelForm = reactive({})
const modelErrors = reactive({ vertex_model_id: '', credits_per_request: '', conversation_tokens: '' })
const modelFormError = ref('')
const modelSaving = ref(false)

const showPackModal = ref(false)
const editingPack = ref(null)
const packForm = reactive({ credits: '', price: '' })
const packFormError = ref('')
const packSaving = ref(false)

const MODEL_FIELDS = ['display_name', 'credits_per_request', 'context_tokens', 'conversation_tokens',
  'price_in_eur_per_mtok', 'price_cached_in_eur_per_mtok', 'price_out_eur_per_mtok']
const INT_FIELDS = ['credits_per_request', 'context_tokens', 'conversation_tokens']

// error code → [field it shows under (null = modal), copy]
function modelErrorFor(err) {
  switch (err.code) {
    case 'default_must_be_offered': return [null, 'The default model must be offered.']
    case 'invalid_credits': return ['credits_per_request', 'Credits per request must be a whole number of at least 1.']
    case 'invalid_context': return ['conversation_tokens', 'Conversation part must be above 0 and below context per round.']
    case 'vertex_model_rejected': return ['vertex_model_id', `Vertex refused this model: ${err.detail || ''}. Check the model id and that it is enabled for the project.`]
    case 'unsupported_model_id': return ['vertex_model_id', "This model id isn't supported yet."]
    case 'model_exists': return ['vertex_model_id', 'This model is already in the list.']
    default: return [null, SAVE_FAILED]
  }
}

function formatInt(val) {
  return val == null ? '—' : Number(val).toLocaleString()
}

function formatEur(minor) {
  if (minor == null) return '—'
  return `€${(minor / 100).toFixed(2)}`
}

async function loadModels() {
  modelsLoading.value = true
  try {
    const data = await apiClient.listAiModels()
    models.value = data.models || []
  } catch {
    toaster.push("Couldn't load models.")
  } finally {
    modelsLoading.value = false
  }
}

async function loadTierCredits() {
  tierLoading.value = true
  try {
    const data = await apiClient.getAiTierCredits()
    tierCredits.free = data.free
    tierCredits.pro = data.pro
    tierCredits.team = data.team
  } catch {
    toaster.push("Couldn't load monthly credits.")
  } finally {
    tierLoading.value = false
  }
}

async function loadPacks() {
  packsLoading.value = true
  try {
    const data = await apiClient.listAiPacks()
    packs.value = data.packs || []
  } catch {
    toaster.push("Couldn't load credit packs.")
  } finally {
    packsLoading.value = false
  }
}

async function toggleOffered(row) {
  toggleSaving.value = true
  try {
    await apiClient.updateAiModel(row.id, { offered: !row.offered })
    await loadModels()
  } catch (err) {
    toaster.push(modelErrorFor(err)[1])
  } finally {
    toggleSaving.value = false
  }
}

async function togglePackActive(row) {
  toggleSaving.value = true
  try {
    await apiClient.updateAiPack(row.id, { active: !row.active })
    await loadPacks()
  } catch {
    toaster.push(SAVE_FAILED)
  } finally {
    toggleSaving.value = false
  }
}

async function saveTierCredits() {
  tierSaving.value = true
  try {
    await apiClient.setAiTierCredits({
      free: Number(tierCredits.free),
      pro: Number(tierCredits.pro),
      team: Number(tierCredits.team),
    })
    toaster.success('Monthly credits saved')
    await loadTierCredits()
  } catch {
    toaster.push(SAVE_FAILED)
  } finally {
    tierSaving.value = false
  }
}

function clearModelErrors() {
  Object.keys(modelErrors).forEach(k => { modelErrors[k] = '' })
  modelFormError.value = ''
}

function openModelModal(model) {
  editingModel.value = model
  modelForm.vertex_model_id = ''
  MODEL_FIELDS.forEach(k => { modelForm[k] = model ? model[k] : '' })
  modelForm.is_default = !!model?.is_default
  clearModelErrors()
  showModelModal.value = true
}

function openAddModel() {
  openModelModal(null)
}

function openEditModel(row) {
  openModelModal(row)
}

function closeModelModal() {
  showModelModal.value = false
  editingModel.value = null
}

// Empty fields are left out so the API applies its own defaults on create
function modelBody() {
  const body = {}
  MODEL_FIELDS.forEach(k => {
    const v = modelForm[k]
    if (v === '' || v == null) return
    body[k] = INT_FIELDS.includes(k) ? Number(v) : String(v).trim()
  })
  if (editingModel.value && modelForm.is_default && !editingModel.value.is_default) body.is_default = true
  return body
}

async function saveModel() {
  clearModelErrors()
  modelSaving.value = true
  try {
    if (editingModel.value) {
      await apiClient.updateAiModel(editingModel.value.id, modelBody())
    } else {
      await apiClient.createAiModel({ vertex_model_id: String(modelForm.vertex_model_id).trim(), ...modelBody() })
    }
    closeModelModal()
    await loadModels()
  } catch (err) {
    const [field, copy] = modelErrorFor(err)
    if (field && (field !== 'vertex_model_id' || !editingModel.value)) modelErrors[field] = copy
    else modelFormError.value = copy
  } finally {
    modelSaving.value = false
  }
}

function openPackModal(pack) {
  editingPack.value = pack
  packForm.credits = pack ? pack.credits : ''
  packForm.price = pack ? (pack.price_minor / 100).toFixed(2) : ''
  packFormError.value = ''
  showPackModal.value = true
}

function openAddPack() {
  openPackModal(null)
}

function openEditPack(row) {
  openPackModal(row)
}

function closePackModal() {
  showPackModal.value = false
  editingPack.value = null
}

async function savePack() {
  packFormError.value = ''
  const body = {
    credits: Number(packForm.credits),
    price_minor: Math.round(Number(String(packForm.price).replace(',', '.')) * 100),
  }
  packSaving.value = true
  try {
    if (editingPack.value) {
      await apiClient.updateAiPack(editingPack.value.id, body)
    } else {
      await apiClient.createAiPack(body)
    }
    closePackModal()
    await loadPacks()
  } catch {
    packFormError.value = SAVE_FAILED
  } finally {
    packSaving.value = false
  }
}

onMounted(() => {
  loadModels()
  loadTierCredits()
  loadPacks()
})
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-title {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-table {
  margin-bottom: 24px;
}

.model-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.credits-card {
  padding: 20px;
  margin-bottom: 24px;
}

.credits-hint {
  margin: 4px 0 16px;
}

.credits-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  max-width: 600px;
}

.credits-actions {
  margin-top: 12px;
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
  background: var(--color-text-inverse);
  transition: transform 0.2s;
}

.toggle-btn--on .toggle-knob {
  transform: translateX(18px);
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal form */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.form-error {
  margin: 0;
}

@media (max-width: 768px) {
  .credits-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
