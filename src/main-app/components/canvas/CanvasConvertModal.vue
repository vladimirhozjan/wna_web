<template>
  <Modal :visible="visible" title="Turn ideas into actions" max-width="520px" :fullscreen-mobile="true" @close="onClose">
    <div class="cv" data-testid="canvas-convert">
      <div v-if="ai && phase === 'waiting'" class="cv-state" data-testid="canvas-convert-waiting">
        <Spinner :size="24" />
        <span class="text-body-s color-text-secondary">AI is reading your brainstorm…</span>
      </div>

      <div v-else-if="ai && phase === 'credits'" class="card cv-credits">
        <template v-if="credits.code === 'not_enough_for_model'">
          <span class="text-body-s fw-semibold">Not enough credits for {{ credits.modelName }}</span>
          <span class="text-body-s color-text-secondary">Switch to a model that uses fewer credits, or buy a pack.</span>
        </template>
        <template v-else>
          <span class="text-body-s fw-semibold">You're out of credits</span>
          <span class="text-body-s color-text-secondary">
            Your monthly credits refill on {{ formatDay(credits.resetsAt) }}.{{ paymentsEnabled ? ' Buy a pack to keep going now.' : '' }}
          </span>
        </template>
        <Btn v-if="paymentsEnabled" variant="primary" size="sm" class="cv-credits-btn" @click="buyCredits">Buy credits</Btn>
      </div>

      <p v-else-if="ai && phase !== 'ready'" class="text-body-s color-text-secondary cv-message" data-testid="canvas-convert-message">{{ MESSAGES[phase] }}</p>

      <template v-else>
        <p class="text-body-s color-text-secondary cv-intro">
          {{ ai ? 'AI turned your ideas into actions. Edit any of them or untick what you don\'t want.' : 'Each ticked idea becomes an action at the end of the project\'s backlog. Untick anything that isn\'t an action.' }}
        </p>
        <div class="cv-toggle" :class="{ 'cv-disabled': converting }">
          <Lnk text="" :link="allTicked ? 'Untick all' : 'Tick all'" class="cv-toggle-link" @action="toggleAll" />
        </div>
        <div class="cv-list" :class="{ 'cv-disabled': converting }">
          <template v-if="ai">
            <div v-for="row in proposal" :key="row.key" class="cv-row cv-row--ai" data-testid="canvas-convert-ai-row">
              <AnimatedCheckbox :checked="ticked.has(row.key)" :disabled="converting" no-initial-animation @change="setTick(row.key, $event)" />
              <span class="cv-row-text">
                <input
                    v-if="editingKey === row.key"
                    ref="editRef"
                    v-model="editDraft"
                    class="text-body-m cv-edit"
                    maxlength="500"
                    @keydown.enter.prevent="commitEdit"
                    @keydown.esc.prevent.stop="cancelEdit"
                    @blur="commitEdit"
                />
                <span v-else class="text-body-m cv-title cv-title--editable" @click="startEdit(row)">{{ row.title }}</span>
                <span class="text-caption color-text-secondary cv-path">From: {{ sourcesOf(row) }}</span>
              </span>
            </div>
          </template>
          <template v-else>
            <div v-for="idea in candidates" :key="idea.id" class="cv-row">
              <AnimatedCheckbox :checked="ticked.has(idea.id)" :disabled="converting" no-initial-animation @change="setTick(idea.id, $event)" />
              <span class="cv-row-text" @click="setTick(idea.id, !ticked.has(idea.id))">
                <span class="text-body-m cv-title">{{ idea.text.trim() }}</span>
                <span v-if="pathOf(idea)" class="text-caption color-text-secondary cv-path">{{ pathOf(idea) }}</span>
              </span>
            </div>
          </template>
        </div>
        <p v-if="ai && skipped" class="text-caption color-text-secondary cv-skipped">
          {{ skipped === 1 ? '1 idea left out — it doesn\'t read as an action.' : `${skipped} ideas left out — they don't read as actions.` }}
        </p>
      </template>
    </div>
    <template #actions>
      <template v-if="ai && !['waiting', 'ready'].includes(phase)">
        <Btn variant="secondary" size="sm" @click="emit('close')">Close</Btn>
        <Btn v-if="RETRYABLE.has(phase)" variant="primary" size="sm" @click="start">Try again</Btn>
      </template>
      <template v-else>
        <Btn variant="secondary" size="sm" :disabled="converting" @click="emit('close')">Cancel</Btn>
        <Btn variant="primary" size="sm" :disabled="!tickedCount || phase === 'waiting'" :loading="converting" data-testid="canvas-convert-add" @click="onConfirm">{{ confirmLabel }}</Btn>
      </template>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { format, parseISO } from 'date-fns'
import Modal from '../Modal.vue'
import Btn from '../Btn.vue'
import Lnk from '../Lnk.vue'
import Spinner from '../Spinner.vue'
import AnimatedCheckbox from '../AnimatedCheckbox.vue'
import { canvasModel } from '../../scripts/models/canvasModel.js'
import { assistantModel } from '../../scripts/models/assistantModel.js'
import { flagsModel } from '../../scripts/core/flagsModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
  mode: { type: String, default: 'manual' }, // manual, ai
})

const emit = defineEmits(['close'])

const MESSAGES = {
  empty: 'AI found no actions in this brainstorm.',
  model: 'The AI assistant isn\'t available right now. No credits were used — try again in a few minutes.',
  network: 'Couldn\'t reach the AI assistant. Check your connection and try again.',
  busy: 'The AI assistant is still working on another request. Try again when it\'s done.',
  converted: 'Every idea is already an action.',
  disabled: 'The AI assistant is turned off right now.',
}
const RETRYABLE = new Set(['model', 'network', 'busy'])

const router = useRouter()
const canvas = canvasModel()
const assistant = assistantModel()
const { paymentsEnabled } = flagsModel()
const toaster = errorModel()

const ticked = ref(new Set())
const converting = ref(false)

// AI mode: waiting → ready, or one of the MESSAGES keys / credits
const phase = ref('ready')
const proposal = ref([])
const skipped = ref(0)
const credits = ref({})
const editingKey = ref(null)
const editDraft = ref('')
const editRef = ref(null)
let run = 0

const ai = computed(() => props.mode === 'ai')
const candidates = computed(() => canvas.convertCandidates.value)
const rowKeys = computed(() => ai.value ? proposal.value.map(r => r.key) : candidates.value.map(c => c.id))
const tickedCount = computed(() => rowKeys.value.filter(k => ticked.value.has(k)).length)
const allTicked = computed(() => tickedCount.value === rowKeys.value.length)

const confirmLabel = computed(() => {
  if (!tickedCount.value) return 'Add actions'
  if (tickedCount.value === 1) return 'Add 1 action'
  return `Add ${tickedCount.value} actions`
})

function pathOf(idea) {
  return canvas.pathTo(idea.id).slice(1, -1).map(n => canvas.displayText(n)).join(' › ')
}

function sourcesOf(row) {
  return row.source_ids.map(id => canvas.getNode(id)).filter(Boolean).map(n => canvas.displayText(n)).join(' · ')
}

function formatDay(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d, yyyy') } catch { return iso }
}

function setTick(id, on) {
  const next = new Set(ticked.value)
  if (on) next.add(id)
  else next.delete(id)
  ticked.value = next
}

function toggleAll() {
  if (converting.value) return
  ticked.value = allTicked.value ? new Set() : new Set(rowKeys.value)
}

function onClose() {
  if (!converting.value) emit('close')
}

// ── AI proposal ──

async function start() {
  const mine = ++run
  const stale = () => mine !== run || !props.visible
  phase.value = 'waiting'
  proposal.value = []
  skipped.value = 0
  editingKey.value = null
  try {
    const id = await assistant.startCanvas(canvas.project.value.id)
    if (stale()) return
    const data = await assistant.waitForRequest(id, stale)
    if (!data) return
    if (data.status !== 'done') {
      phase.value = 'model'
      return
    }
    proposal.value = (data.proposal || []).map((r, i) => ({ key: `ai-${i}`, title: r.title, source_ids: r.source_idea_ids }))
    skipped.value = data.skipped_count || 0
    ticked.value = new Set(proposal.value.map(r => r.key))
    phase.value = proposal.value.length ? 'ready' : 'empty'
  } catch (err) {
    if (stale()) return
    onStartError(err)
  }
}

function onStartError(err) {
  if (err.code === 'out_of_credits' || err.code === 'not_enough_for_model') {
    credits.value = { code: err.code, resetsAt: err.data?.monthly_resets_at, modelName: err.data?.model_name }
    phase.value = 'credits'
  } else if (err.code === 'canvas_read_only') {
    emit('close')
    canvas.onLostEditRights()
  } else if (err.code === 'canvas_empty') {
    phase.value = 'converted'
  } else if (err.code === 'assistant_busy') {
    phase.value = 'busy'
  } else if (err.code === 'assistant_disabled') {
    phase.value = 'disabled'
  } else if (err.status === null) {
    phase.value = 'network'
  } else {
    phase.value = 'model'
  }
}

function startEdit(row) {
  if (converting.value) return
  editingKey.value = row.key
  editDraft.value = row.title
  nextTick(() => editRef.value?.[0]?.focus())
}

function commitEdit() {
  const row = proposal.value.find(r => r.key === editingKey.value)
  if (row && editDraft.value.trim()) row.title = editDraft.value.trim()
  editingKey.value = null
}

function cancelEdit() {
  editingKey.value = null
}

function buyCredits() {
  emit('close')
  router.push({ name: 'buy-credits' })
}

async function onConfirm() {
  const rows = ai.value
      ? proposal.value.filter(r => ticked.value.has(r.key)).map(r => ({ title: r.title, source_ids: r.source_ids }))
      : candidates.value.filter(c => ticked.value.has(c.id)).map(c => ({ title: c.text, source_ids: [c.id] }))
  if (!rows.length) return
  converting.value = true
  try {
    const { created, outcome } = await canvas.convert(rows)
    if (outcome === 'network') {
      toaster.push('Couldn\'t add the actions. Check your connection and try again.')
      return
    }
    if (outcome === 'ok') toaster.success(created === 1 ? '1 action added to the project' : `${created} actions added to the project`)
    emit('close')
  } finally {
    converting.value = false
  }
}

watch(() => props.visible, (open) => {
  if (!open) {
    run++
    return
  }
  if (ai.value) {
    start()
  } else {
    phase.value = 'ready'
    ticked.value = new Set(candidates.value.map(c => c.id))
  }
})
</script>

<style scoped>
.cv {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cv-intro {
  margin: 0 0 8px;
}

.cv-toggle {
  display: flex;
  padding: 0 4px;
}

.cv-toggle-link {
  text-align: left;
}

.cv-list {
  max-height: 50vh;
  overflow-y: auto;
  margin-top: 4px;
}

.cv-disabled {
  pointer-events: none;
  opacity: 0.6;
}

.cv-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
}

.cv-row:last-child {
  border-bottom: none;
}

.cv-row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.cv-title {
  color: var(--color-text-primary);
  word-break: break-word;
}

.cv-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cv-title--editable {
  cursor: text;
}

.cv-edit {
  width: 100%;
  margin: -3px 0;
  padding: 2px 6px;
  border: 1px solid var(--color-input-border-focus);
  border-radius: 4px;
  outline: none;
  box-shadow: var(--shadow-focus-ring);
  box-sizing: border-box;
  font-family: inherit;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

.cv-row--ai {
  cursor: default;
}

.cv-skipped {
  margin: 8px 0 0;
  padding: 0 4px;
}

.cv-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 160px;
}

.cv-message {
  margin: 0;
  padding: 24px 0;
  text-align: center;
}

.cv-credits {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 16px;
  color: var(--color-text-primary);
}

.cv-credits-btn {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .cv-edit {
    font-size: var(--font-size-body);
  }

  .cv-list {
    max-height: none;
  }
}
</style>
