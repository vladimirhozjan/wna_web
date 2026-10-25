<template>
  <Modal :visible="shortcuts.state.shortcutsOpen" title="Keyboard shortcuts" @close="shortcuts.closeShortcuts()">
    <div class="shortcuts" data-testid="shortcuts-dialog">
      <div v-for="block in blocks" :key="block.title" class="shortcuts__block">
        <div class="text-overline shortcuts__header">{{ block.title }}</div>
        <div v-for="row in block.rows" :key="row.keys" class="shortcuts__row">
          <span class="text-caption shortcuts__key">{{ row.keys }}</span>
          <span class="text-body-s shortcuts__action">{{ row.action }}</span>
        </div>
      </div>
      <p class="text-caption shortcuts__note">Press G, then the letter. Shortcuts pause while you type in a field or a dialog is open. {{ undoKey }} works while the Undo toast shows.</p>
    </div>
    <template #actions>
      <Btn variant="secondary" size="sm" @click="shortcuts.closeShortcuts()">Close</Btn>
    </template>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import Modal from './Modal.vue'
import Btn from './Btn.vue'
import { shortcutModel } from '../scripts/core/shortcutModel.js'

const shortcuts = shortcutModel()

const isMac = /mac/i.test(navigator.platform)
const paletteKey = isMac ? '⌘K' : 'Ctrl+K'
const undoKey = isMac ? '⌘Z' : 'Ctrl+Z'
const modKey = isMac ? '⌘' : 'Ctrl'
const redoKey = isMac ? '⌘⇧Z' : 'Ctrl+Shift+Z'

const blocks = computed(() => [
  {
    title: 'General',
    rows: [
      { keys: paletteKey, action: 'Open the command palette' },
      { keys: undoKey, action: 'Undo the last complete, trash or move' },
      { keys: 'C', action: 'Add to Inbox' },
      { keys: '?', action: 'Show keyboard shortcuts' },
    ],
  },
  {
    title: 'Go to',
    rows: shortcuts.navigation.value.filter(n => n.hint).map(n => ({ keys: n.hint, action: n.page })),
  },
  {
    title: 'On the brainstorm canvas',
    rows: [
      { keys: 'Tab', action: 'Add an idea under the selected one' },
      { keys: 'Enter', action: 'Add the next idea' },
      { keys: 'Space', action: 'Edit the selected idea' },
      { keys: 'Del', action: 'Delete the idea and its branch' },
      { keys: '← ↑ ↓ →', action: 'Move between ideas' },
      { keys: `${modKey} ↑ ↓`, action: 'Fold / unfold' },
      { keys: undoKey, action: 'Undo a canvas change' },
      { keys: redoKey, action: 'Redo' },
      { keys: 'Esc', action: 'Stop editing' },
    ],
  },
  {
    title: 'In the command palette',
    rows: [
      { keys: '↑ ↓', action: 'Move' },
      { keys: 'Enter', action: 'Run' },
      { keys: 'Esc', action: 'Close' },
    ],
  },
])
</script>

<style scoped>
.shortcuts {
  max-height: 60vh;
  overflow-y: auto;
}

.shortcuts__block + .shortcuts__block {
  margin-top: 16px;
}

.shortcuts__header {
  margin-bottom: 8px;
  color: var(--color-text-tertiary);
}

.shortcuts__row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 4px 0;
}

.shortcuts__key {
  flex: 0 0 88px;
  color: var(--color-text-tertiary);
}

.shortcuts__action {
  color: var(--color-text-primary);
}

.shortcuts__note {
  margin: 16px 0 0;
  color: var(--color-text-tertiary);
}
</style>
