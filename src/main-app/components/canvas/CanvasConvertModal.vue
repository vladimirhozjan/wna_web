<template>
  <Modal :visible="visible" title="Turn ideas into actions" max-width="520px" :fullscreen-mobile="true" @close="onClose">
    <div class="cv" data-testid="canvas-convert">
      <p class="text-body-s color-text-secondary cv-intro">Each ticked idea becomes an action at the end of the project's backlog. Untick anything that isn't an action.</p>
      <div class="cv-toggle" :class="{ 'cv-disabled': converting }">
        <Lnk text="" :link="allTicked ? 'Untick all' : 'Tick all'" class="cv-toggle-link" @action="toggleAll" />
      </div>
      <div class="cv-list" :class="{ 'cv-disabled': converting }">
        <div v-for="idea in candidates" :key="idea.id" class="cv-row">
          <AnimatedCheckbox :checked="ticked.has(idea.id)" :disabled="converting" no-initial-animation @change="setTick(idea.id, $event)" />
          <span class="cv-row-text" @click="setTick(idea.id, !ticked.has(idea.id))">
            <span class="text-body-m cv-title">{{ idea.text.trim() }}</span>
            <span v-if="pathOf(idea)" class="text-caption color-text-secondary cv-path">{{ pathOf(idea) }}</span>
          </span>
        </div>
      </div>
    </div>
    <template #actions>
      <Btn variant="secondary" size="sm" :disabled="converting" @click="emit('close')">Cancel</Btn>
      <Btn variant="primary" size="sm" :disabled="!tickedCount" :loading="converting" @click="onConfirm">{{ confirmLabel }}</Btn>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from '../Modal.vue'
import Btn from '../Btn.vue'
import Lnk from '../Lnk.vue'
import AnimatedCheckbox from '../AnimatedCheckbox.vue'
import { canvasModel } from '../../scripts/models/canvasModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const canvas = canvasModel()
const toaster = errorModel()

const ticked = ref(new Set())
const converting = ref(false)

const candidates = computed(() => canvas.convertCandidates.value)
const tickedCount = computed(() => candidates.value.filter(c => ticked.value.has(c.id)).length)
const allTicked = computed(() => tickedCount.value === candidates.value.length)

const confirmLabel = computed(() => {
  if (!tickedCount.value) return 'Add actions'
  if (tickedCount.value === 1) return 'Add 1 action'
  return `Add ${tickedCount.value} actions`
})

function pathOf(idea) {
  return canvas.pathTo(idea.id).slice(1, -1).map(n => canvas.displayText(n)).join(' › ')
}

function setTick(id, on) {
  const next = new Set(ticked.value)
  if (on) next.add(id)
  else next.delete(id)
  ticked.value = next
}

function toggleAll() {
  if (converting.value) return
  ticked.value = allTicked.value ? new Set() : new Set(candidates.value.map(c => c.id))
}

function onClose() {
  if (!converting.value) emit('close')
}

async function onConfirm() {
  const ids = candidates.value.filter(c => ticked.value.has(c.id)).map(c => c.id)
  if (!ids.length) return
  converting.value = true
  try {
    const { created, outcome } = await canvas.convert(ids)
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
  if (open) ticked.value = new Set(candidates.value.map(c => c.id))
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

@media (max-width: 768px) {
  .cv-list {
    max-height: none;
  }
}
</style>
