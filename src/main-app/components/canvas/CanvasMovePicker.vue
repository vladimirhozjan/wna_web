<template>
  <Modal :visible="!!node" title="Move to" :fullscreen-mobile="true" @close="emit('close')">
    <div v-if="node" class="mp" data-testid="canvas-move-picker">
      <p class="text-body-s color-text-secondary mp-intro">Pick the new place for “{{ canvas.displayText(node) }}”.</p>
      <div class="mp-list">
        <button
            v-for="row in rows"
            :key="row.node.id"
            type="button"
            class="mp-row"
            :class="{ 'mp-row--current': row.current }"
            :style="{ paddingLeft: `${8 + row.depth * INDENT_PX}px` }"
            :disabled="row.current"
            @click="pick(row.node)"
        >
          <span class="text-body-m mp-text" :class="{ 'mp-blank': row.depth > 0 && !row.node.text.trim() }">{{ canvas.displayText(row.node) }}</span>
          <span v-if="row.current" class="text-footnote color-text-secondary">Current</span>
        </button>
      </div>
    </div>
    <template #actions>
      <Btn variant="secondary" size="sm" @click="emit('close')">Cancel</Btn>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from '../Modal.vue'
import Btn from '../Btn.vue'
import { canvasModel } from '../../scripts/models/canvasModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const props = defineProps({
  nodeId: { type: String, default: null },
})

const emit = defineEmits(['close'])

const INDENT_PX = 16

const canvas = canvasModel()
const toaster = errorModel()

const node = computed(() => props.nodeId ? canvas.getNode(props.nodeId) : null)

const rows = computed(() => {
  if (!node.value) return []
  return canvas.treeOrder()
      .filter(n => !canvas.isInBranch(n.id, node.value.id))
      .map(n => ({ node: n, depth: canvas.depthOf(n.id), current: n.id === node.value.parent_id }))
})

function pick(target) {
  if (canvas.moveTo(node.value.id, target.id)) toaster.success(`Moved to “${canvas.displayText(target)}”.`)
  emit('close')
}
</script>

<style scoped>
.mp {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.mp-intro {
  margin: 0 0 8px;
}

.mp-list {
  max-height: 50vh;
  overflow-y: auto;
}

.mp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: var(--touch-target-min);
  padding: 8px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--color-border-light);
  text-align: left;
  cursor: pointer;
}

.mp-row:last-child {
  border-bottom: none;
}

.mp-row:hover:not(:disabled) {
  background: var(--color-bg-secondary);
}

.mp-row--current {
  cursor: default;
}

.mp-text {
  min-width: 0;
  color: var(--color-text-primary);
  word-break: break-word;
}

.mp-blank {
  color: var(--color-text-secondary);
  font-style: italic;
}

@media (max-width: 768px) {
  .mp-list {
    max-height: none;
  }
}
</style>
