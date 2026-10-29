<template>
  <Modal :visible="shortcuts.state.paletteOpen" max-width="560px" @close="close">
    <div class="palette" data-testid="command-palette">
      <div class="palette__field">
        <SearchIcon class="palette__search-icon" />
        <input
            ref="inputRef"
            v-model="query"
            type="text"
            class="text-body-s palette__input"
            placeholder="Type to search or run a command"
            data-testid="command-palette-input"
            @input="onInput"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="runHighlighted"
            @keydown.esc.prevent="close"
        />
      </div>

      <div ref="listRef" class="palette__list">
        <template v-for="group in groups" :key="group.name">
          <div class="text-overline palette__group">{{ group.name }}</div>
          <template v-for="row in group.rows" :key="row.id">
            <div v-if="row.kind === 'loading'" class="palette__state">
              <Spinner :size="16" />
            </div>
            <div v-else-if="row.kind === 'empty'" class="text-body-s palette__state palette__message">
              No results found for "{{ search.resultTerm.value }}". Try a different search term.
            </div>
            <!-- Capture: run() owns the row click (SearchResultRow navigation, Try again) -->
            <div
                v-else
                class="palette__row"
                :class="{ 'palette__row--active': row.index === highlight, 'palette__row--result': row.kind === 'result', 'palette__row--disabled': !row.run }"
                :data-index="row.index"
                :data-testid="`command-palette-row-${row.kind}`"
                @mousemove="highlight = row.index"
                @mousedown.prevent
                @click.capture.stop="row.run && run(row)"
            >
              <SearchResultRow v-if="row.kind === 'result'" :item="row.item" :term="search.resultTerm.value" no-hover />
              <template v-else-if="row.kind === 'error'">
                <span class="text-body-s palette__message">{{ errorText }}</span>
                <Btn variant="link" size="sm">Try again</Btn>
              </template>
              <template v-else-if="row.kind === 'create'">
                <PlusIcon class="palette__plus-icon" />
                <span class="text-body-s">{{ row.label }}<span class="fw-semibold">{{ row.title }}</span></span>
              </template>
              <template v-else-if="row.kind === 'ai'">
                <AiIcon class="palette__plus-icon palette__ai-icon" />
                <span class="text-body-s palette__ai-label">{{ row.label }}<span class="fw-semibold">{{ row.title }}</span></span>
                <span v-if="!row.run" class="text-caption palette__hint">· Needs a connection</span>
              </template>
              <template v-else>
                <span class="text-body-s">{{ row.label }}</span>
                <span v-if="row.hint" class="text-caption palette__hint">{{ row.hint }}</span>
              </template>
            </div>
          </template>
        </template>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Modal from './Modal.vue'
import Btn from './Btn.vue'
import Spinner from './Spinner.vue'
import SearchResultRow from './SearchResultRow.vue'
import SearchIcon from '../assets/SearchIcon.vue'
import PlusIcon from '../assets/PlusIcon.vue'
import AiIcon from '../assets/AiIcon.vue'
import { shortcutModel } from '../scripts/core/shortcutModel.js'
import { searchModel, searchRoute, SEARCH_MIN_LENGTH } from '../scripts/models/searchModel.js'
import { stuffModel } from '../scripts/models/stuffModel.js'
import { nextActionModel } from '../scripts/models/nextActionModel.js'
import { projectModel } from '../scripts/models/projectModel.js'
import { moveModel } from '../scripts/models/moveModel.js'
import { errorModel } from '../scripts/core/errorModel.js'
import { assistantModel } from '../scripts/models/assistantModel.js'

const router = useRouter()
const shortcuts = shortcutModel()
const search = searchModel().palette
const { addStuff } = stuffModel()
const { addAction } = nextActionModel()
const { addProject } = projectModel()
const mover = moveModel()
const toaster = errorModel()
const assistant = assistantModel()

const query = ref('')
const highlight = ref(0)
const inputRef = ref(null)
const listRef = ref(null)
let returnFocus = null

const term = computed(() => query.value.trim())

const errorText = computed(() =>
    search.error.value?.status === 429
        ? 'Too many searches. Wait a moment and try again.'
        : 'Search failed. Check your connection and try again.'
)

const itemRows = computed(() => shortcuts.itemCommands.value.map((c, i) => ({
  id: `item-${i}`,
  kind: 'command',
  label: c.label,
  run: c.run,
})))

const navRows = computed(() => shortcuts.navigation.value.map(n => ({
  id: `nav-${n.route}`,
  kind: 'command',
  label: `Go to ${n.page}`,
  hint: n.hint,
  run: () => router.push({ name: n.route }),
})))

// Only while a conversation exists — the way back to it without spending a request
const assistantRows = computed(() => assistant.enabled.value && assistant.hasConversation.value
    ? [{ id: 'open-assistant', kind: 'command', label: 'Open AI conversation', keywords: 'open ai assistant conversation', run: assistant.openPanel }]
    : [])

function resultRows() {
  if (search.error.value) return [{ id: 'error', kind: 'error', keepOpen: true, run: search.retry }]
  const items = search.items.value
  if (!items.length) {
    const loading = search.loading.value || search.resultTerm.value === null
    return [{ id: loading ? 'loading' : 'empty', kind: loading ? 'loading' : 'empty' }]
  }
  const rows = items.map(item => ({
    id: `${item.type}-${item.id}`,
    kind: 'result',
    item,
    run: () => {
      const to = searchRoute(item)
      if (to) router.push(to)
    },
  }))
  if (search.totalCount.value > items.length) {
    const q = term.value
    rows.push({
      id: 'see-all',
      kind: 'command',
      label: `See all ${search.totalCount.value} results`,
      run: () => router.push({ name: 'search', query: { q } }),
    })
  }
  return rows
}

function createRows() {
  const title = term.value
  return [
    { id: 'create-inbox', kind: 'create', label: 'Add to Inbox: ', title, run: () => createStuff(title) },
    { id: 'create-project', kind: 'create', label: 'New project: ', title, run: () => createProject(title) },
    { id: 'create-action', kind: 'create', label: 'New next action: ', title, run: () => createAction(title) },
    // Last, so Enter on a fresh query never spends credits by accident; offline it is shown but skipped
    ...(assistant.enabled.value
        ? [{ id: 'create-ai', kind: 'ai', label: 'Tell AI what to do: ', title, run: assistant.isOffline.value ? null : () => assistant.send(title) }]
        : []),
  ]
}

// Runnable rows get a running index — one highlight moves across all groups
const groups = computed(() => {
  const list = []
  let index = 0
  const add = (name, rows) => {
    if (!rows.length) return
    list.push({ name, rows: rows.map(r => (r.run ? { ...r, index: index++ } : r)) })
  }

  if (!term.value) {
    add('This item', itemRows.value)
    add('Go to', [...navRows.value, ...assistantRows.value])
    return list
  }

  const needle = term.value.toLowerCase()
  add('Commands', [...itemRows.value, ...navRows.value, ...assistantRows.value]
      .filter(r => `${r.label} ${r.keywords || ''}`.toLowerCase().includes(needle)))
  if (term.value.length >= SEARCH_MIN_LENGTH) add('Results', resultRows())
  add('Create', createRows())
  return list
})

const runnable = computed(() => groups.value.flatMap(g => g.rows).filter(r => r.run))

function onInput() {
  highlight.value = 0
  search.input(query.value)
}

function move(delta) {
  const count = runnable.value.length
  if (!count) return
  highlight.value = (highlight.value + delta + count) % count
  nextTick(() => {
    listRef.value?.querySelector(`[data-index="${highlight.value}"]`)?.scrollIntoView({ block: 'nearest' })
  })
}

function run(row) {
  if (!row.keepOpen) shortcuts.closePalette()
  row.run()
}

function runHighlighted() {
  const row = runnable.value[highlight.value]
  if (row) run(row)
}

function close() {
  shortcuts.closePalette()
  returnFocus?.focus?.()
}

function onCreateError(err, title) {
  if (!err.upgrade) toaster.push(err.fromServer ? err.message : `Couldn't add "${title}". Check your connection and try again.`, 'error', { keepOffline: true })
}

async function createStuff(title) {
  try {
    await addStuff(title)
  } catch (err) {
    onCreateError(err, title)
  }
}

async function createAction(title) {
  try {
    const created = await addAction(title)
    router.push({ name: 'action-detail', params: { id: created.id } })
  } catch (err) {
    onCreateError(err, title)
  }
}

async function createProject(title) {
  const outcome = await mover.showOutcome()
  if (!outcome) return
  try {
    const created = await addProject(title, '', outcome)
    router.push({ name: 'project-detail', params: { id: created.id } })
  } catch (err) {
    onCreateError(err, title)
  }
}

watch(() => runnable.value.length, (count) => {
  if (highlight.value >= count) highlight.value = Math.max(0, count - 1)
})

watch(() => shortcuts.state.paletteOpen, async (open) => {
  query.value = ''
  highlight.value = 0
  search.reset()
  if (!open) return
  returnFocus = document.activeElement
  await nextTick()
  inputRef.value?.focus()
})
</script>

<style scoped>
.palette__field {
  position: relative;
  display: flex;
  align-items: center;
}

.palette__search-icon {
  position: absolute;
  left: 12px;
  width: 14px;
  height: 14px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

.palette__input {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.palette__input:focus {
  outline: none;
  border-color: var(--color-action);
  box-shadow: 0 0 0 1px var(--color-focus-ring);
}

.palette__input::placeholder {
  color: var(--color-text-tertiary);
}

.palette__list {
  max-height: 60vh;
  margin-top: 8px;
  overflow-y: auto;
}

.palette__group {
  padding: 12px 12px 4px;
  color: var(--color-text-tertiary);
}

.palette__row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.palette__row--result {
  display: block;
  padding: 0;
}

.palette__row--active {
  background: var(--color-bg-row-hover);
}

.palette__hint {
  margin-left: auto;
  color: var(--color-text-tertiary);
}

.palette__plus-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
}

.palette__ai-icon {
  width: 14px;
  height: 14px;
  margin: 0 -1px;
  color: var(--color-action);
}

.palette__row--disabled {
  cursor: default;
}

.palette__row--disabled .palette__ai-label {
  color: var(--color-text-secondary);
}

.palette__row--disabled .palette__ai-icon {
  color: var(--color-text-tertiary);
}

.palette__state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  text-align: center;
}

.palette__message {
  color: var(--color-text-tertiary);
}
</style>
