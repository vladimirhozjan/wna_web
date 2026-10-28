<template>
    <div class="horizons-page">

      <div class="horizons-header" :class="{ 'horizons-header--intro': hasIntro }">
        <h1 class="page-title">Horizons</h1>
        <div v-if="enabled && loadFailed" class="horizons-error">
          <span class="text-body-s color-text-secondary">Couldn't load your horizons.</span>
          <Btn variant="secondary" size="sm" :loading="horizon.state.loading" @click="load">Retry</Btn>
        </div>
      </div>

      <div class="horizons-content">

        <!-- Horizons switched off in Settings -->
        <div v-if="!enabled" class="card">
          <div class="empty-state">
            <EmptyState
                :icon="HorizonIcon"
                title="Horizons are turned off"
                text="Turn them on in Settings to plan from your areas of focus up to your purpose."
                buttonText="Open Settings"
                @action="router.push({ name: 'settings', query: { section: 'review' } })"
            />
          </div>
        </div>

        <div v-else-if="!horizon.state.loaded && !loadFailed" class="loading-state">
          <Spinner :size="32" delayed />
        </div>

        <template v-else-if="horizon.state.loaded">

          <p v-if="allEmpty" class="horizons-intro text-body-s color-text-secondary" data-testid="horizons-intro">
            Step back from the day-to-day. Start with your areas of focus, then add goals, vision and purpose when you're ready.
          </p>
          <div v-else-if="showUnlinked" class="horizons-intro">
            <button
                type="button"
                class="text-body-s color-text-secondary horizons-toggle"
                :aria-expanded="isOpen(UNLINKED)"
                data-testid="horizons-unlinked"
                @click="toggle(UNLINKED)"
            >{{ unlinkedLabel }}</button>
            <ul v-if="isOpen(UNLINKED)" class="horizons-projects">
              <li v-for="p in horizon.state.unlinkedProjects" :key="p.id">
                <button type="button" class="text-body-s horizons-projects__link" @click="openProject(p.id)">{{ p.title }}</button>
              </li>
            </ul>
          </div>

          <div v-for="level in HORIZON_LEVELS" :key="level" class="card" :data-testid="`horizons-level-${level}`">
            <div class="card-header">
              <span class="section__title">{{ COPY[level].name }}</span>
              <Badge v-if="isDue(level)" type="pending" label="Due for review" />
              <Badge v-else-if="level === 'area' && allEmpty" type="primary" label="Start here" />
            </div>

            <p class="text-body-s color-text-secondary level-meaning">{{ COPY[level].meaning }}</p>
            <p v-if="horizon.state.levels[level].length === 0" class="text-body-s color-text-tertiary level-example">{{ COPY[level].example }}</p>

            <ItemList
                v-else
                v-model="horizon.state.levels[level]"
                class="level-list"
                :loading="false"
                :loading-ids="loadingIds"
                :no-checkbox="true"
                :source-type="level"
                swipe-left="delete"
                @update="(id, data) => onRename(id, data)"
                @delete="id => onDelete(level, id)"
                @swipe-left="id => onDelete(level, id)"
                @move="onMove"
            >
              <template v-if="LINKABLE.includes(level)" #subtitle="{ item }">
                <div class="level-sub" @click.stop>
                  <template v-if="item.active_project_count > 0">
                    <button
                        type="button"
                        class="text-footnote color-text-secondary horizons-toggle"
                        :aria-expanded="isOpen(item.id)"
                        @click="toggle(item.id)"
                    >{{ projectCountLabel(item.active_project_count) }}</button>
                    <ul v-if="isOpen(item.id)" class="horizons-projects">
                      <li v-for="p in item.projects" :key="p.id">
                        <button type="button" class="text-body-s horizons-projects__link" @click="openProject(p.id)">{{ p.title }}</button>
                      </li>
                    </ul>
                  </template>
                  <span v-else class="level-sub__empty">
                    <span class="chip chip--warning">
                      <WarningIcon class="chip__icon" />
                      <span>No projects</span>
                    </span>
                    <span class="text-footnote color-text-tertiary">·</span>
                    <button type="button" class="text-footnote fw-semibold level-sub__link" @click="addProjectFor(level, item.id)">Add project</button>
                  </span>
                </div>
              </template>
            </ItemList>

            <div v-if="adds[level].open" class="level-add-form" @focusout="e => onAddFocusOut(e, level)">
              <Inpt
                  :ref="el => { addInputs[level] = el }"
                  v-model="adds[level].text"
                  type="text"
                  :placeholder="COPY[level].placeholder"
                  @enter="onAdd(level)"
                  @keyup.esc="closeAdd(level)"
              />
              <Btn
                  class="add-button"
                  variant="primary"
                  size="sm"
                  :disabled="!adds[level].text.trim() || adds[level].adding"
                  :loading="adds[level].adding"
                  @click="onAdd(level)"
              >Add</Btn>
            </div>
            <button
                v-else
                type="button"
                class="text-body-m color-text-tertiary level-add"
                :data-testid="`horizons-add-${level}`"
                @click="openAdd(level)"
            >
              <PlusIcon class="level-add__icon" />
              {{ COPY[level].add }}
            </button>
          </div>

        </template>
      </div>

      <!-- Delete an area / goal that has linked projects -->
      <Modal :visible="dialog.visible" :title="dialog.level === 'goal' ? 'Delete this goal?' : 'Delete this area?'" max-width="420px" @close="closeDialog">
        <p class="text-body-m dialog-body">"{{ dialog.title }}" has {{ linkedLabel(dialog.count) }}.</p>
        <div v-if="moveOptions.length > 1" class="dialog-field">
          <label class="text-body-s fw-semibold dialog-label">Move them to</label>
          <Select v-model="dialog.moveTo" :options="moveOptions" title="Move them to" :disabled="dialog.deleting" block />
        </div>
        <p v-else class="text-body-m color-text-secondary dialog-body">They'll stay, just without {{ dialog.level === 'goal' ? 'a goal' : 'an area' }}.</p>
        <template #actions>
          <div class="dialog-actions">
            <Btn variant="secondary" size="sm" :disabled="dialog.deleting" @click="closeDialog">Cancel</Btn>
            <Btn variant="danger" size="sm" :loading="dialog.deleting" data-testid="horizons-delete-confirm" @click="onConfirmDelete">Delete</Btn>
          </div>
        </template>
      </Modal>

    </div>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ItemList from '../../components/ItemList.vue'
import Btn from '../../components/Btn.vue'
import Inpt from '../../components/Inpt.vue'
import Badge from '../../components/Badge.vue'
import Modal from '../../components/Modal.vue'
import Select from '../../components/Select.vue'
import Spinner from '../../components/Spinner.vue'
import EmptyState from '../../components/EmptyState.vue'
import HorizonIcon from '../../assets/HorizonIcon.vue'
import PlusIcon from '../../assets/PlusIcon.vue'
import WarningIcon from '../../assets/WarningIcon.vue'
import { horizonModel, HORIZON_LEVELS } from '../../scripts/models/horizonModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'
import { offlineModel } from '../../scripts/core/offlineModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { truncateTitle } from '../../scripts/core/textUtils.js'
import { onAssistantChange } from '../../scripts/models/assistantModel.js'

const COPY = {
  area: {
    name: 'Areas of focus',
    meaning: 'The parts of your life and work you keep up. They never finish. Review monthly.',
    example: 'For example: Health, Family, Finances, Home, Career.',
    add: 'Add an area',
    placeholder: 'e.g. Health',
  },
  goal: {
    name: 'Goals',
    meaning: 'What you want to achieve in the next year or two. Review quarterly.',
    example: 'For example: Run a half marathon. Launch my own studio.',
    add: 'Add a goal',
    placeholder: 'e.g. Run a half marathon',
  },
  vision: {
    name: 'Vision',
    meaning: 'What success looks like three to five years from now. Review yearly.',
    example: 'For example: We live by the sea and I work four days a week.',
    add: 'Add a vision',
    placeholder: 'e.g. I work four days a week',
  },
  purpose: {
    name: 'Purpose & principles',
    meaning: 'Why you do what you do, and the values you live by. Add each as its own item. Review yearly.',
    example: 'For example: Help small teams do their best work. Be honest, even when it\'s hard.',
    add: 'Add a purpose or principle',
    placeholder: 'e.g. Be honest, even when it\'s hard',
  },
}
const LINKABLE = ['area', 'goal']
const UNLINKED = 'unlinked'
const SAVE_FAILED = 'Couldn\'t save. Try again.'
const DELETE_FAILED = 'Couldn\'t delete. Try again.'

const router = useRouter()
const toaster = errorModel()
const settings = settingsModel()
const horizon = horizonModel()
const { isOffline } = offlineModel()

const adds = reactive(Object.fromEntries(HORIZON_LEVELS.map(l => [l, { open: false, text: '', adding: false }])))
const addInputs = {}
const expanded = ref(new Set())
const loadingIds = ref([])
const dialog = reactive({ visible: false, level: null, id: null, title: '', count: 0, moveTo: '', deleting: false })

const enabled = computed(() => settings.state.horizonsEnabled)
const loadFailed = computed(() => !!horizon.state.error && !horizon.state.loaded && !isOffline.value)
const allEmpty = computed(() => HORIZON_LEVELS.every(l => horizon.state.levels[l].length === 0))
const showUnlinked = computed(() => (horizon.hasAreas.value || horizon.hasGoals.value) && horizon.state.unlinkedCount > 0)
const hasIntro = computed(() => enabled.value && horizon.state.loaded && (allEmpty.value || showUnlinked.value))
const unlinkedLabel = computed(() => {
  const n = horizon.state.unlinkedCount
  return n === 1 ? '1 project has no area or goal' : `${n} projects have no area or goal`
})
const moveOptions = computed(() => {
  if (!dialog.level) return []
  return horizon.options(dialog.level).filter(o => o.value !== dialog.id)
})

function load() {
  horizon.load().catch(() => {})
}
onAssistantChange(load)

function isDue(level) {
  return settings.state.reviewEnabled && horizon.state.dueLevels.includes(level)
}

function projectCountLabel(n) {
  return n === 1 ? '1 project' : `${n} projects`
}

function linkedLabel(n) {
  return n === 1 ? '1 linked project' : `${n} linked projects`
}

function isOpen(key) {
  return expanded.value.has(key)
}

function toggle(key) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next
}

function openProject(id) {
  router.push({ name: 'project-detail', params: { id } })
}

function addProjectFor(level, id) {
  router.push({ name: 'projects', query: { add: 1, [level]: id } })
}

function openAdd(level) {
  adds[level].open = true
  nextTick(() => addInputs[level]?.focus())
}

function closeAdd(level) {
  adds[level].open = false
  adds[level].text = ''
}

function onAddFocusOut(e, level) {
  if (e.currentTarget.contains(e.relatedTarget)) return
  if (!adds[level].text.trim() && !adds[level].adding) closeAdd(level)
}

async function onAdd(level) {
  const add = adds[level]
  const title = add.text.trim()
  if (!title || add.adding) return
  add.adding = true
  try {
    await horizon.add(level, title)
    add.text = ''
  } catch (err) {
    toaster.push(err.code === 'horizon_level_full'
      ? `You've reached the limit for ${COPY[level].name}. Delete one to add another.`
      : SAVE_FAILED)
  } finally {
    add.adding = false
    nextTick(() => addInputs[level]?.focus())
  }
}

async function onRename(id, { title }) {
  loadingIds.value = [...loadingIds.value, id]
  try {
    await horizon.rename(id, title)
  } catch {
    toaster.push(SAVE_FAILED)
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== id)
  }
}

async function onMove(id, destination) {
  try {
    await horizon.move(id, destination)
  } catch {
    toaster.push(SAVE_FAILED)
  }
}

async function onDelete(level, id) {
  const items = horizon.state.levels[level]
  const item = items.find(i => i.id === id)
  if (!item) return
  if (LINKABLE.includes(level) && item.linked_project_count > 0) {
    Object.assign(dialog, { visible: true, level, id, title: item.title, count: item.linked_project_count, moveTo: '', deleting: false })
    return
  }
  const position = items.indexOf(item)
  loadingIds.value = [...loadingIds.value, id]
  try {
    await horizon.remove(id)
    toaster.undoable(`"${truncateTitle(item.title)}" deleted`, () => onUndoDelete({ level, title: item.title, position }))
  } catch {
    toaster.push(DELETE_FAILED)
  } finally {
    loadingIds.value = loadingIds.value.filter(i => i !== id)
  }
}

async function onUndoDelete(item) {
  try {
    await horizon.restore(item)
  } catch {
    toaster.push(SAVE_FAILED)
  }
}

function closeDialog() {
  if (dialog.deleting) return
  dialog.visible = false
}

async function onConfirmDelete() {
  dialog.deleting = true
  try {
    await horizon.remove(dialog.id, dialog.moveTo || null)
    dialog.visible = false
    toaster.success(`"${truncateTitle(dialog.title)}" deleted`)
  } catch (err) {
    toaster.push(DELETE_FAILED)
    if (err.code === 'invalid_move_to') horizon.refresh()
  } finally {
    dialog.deleting = false
  }
}

watch(enabled, (on) => {
  if (on) load()
})

onMounted(() => {
  if (enabled.value) load()
})
</script>

<style scoped>
.horizons-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.horizons-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.horizons-header--intro {
  margin-bottom: 2px;
}

.horizons-header h1 {
  margin: 0;
  padding: 0;
}

.horizons-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  margin-top: 8px;
}

.horizons-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

/* Spinner sits on the centre of the empty-state coin */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 130px 24px 48px;
}

/* Same frame as the Engage empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.horizons-intro {
  margin: 0 0 20px;
}

.horizons-toggle {
  padding: 0;
  border: none;
  background: none;
  font-family: var(--font-family-default);
  text-align: left;
  cursor: pointer;
}

.horizons-toggle:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

.horizons-projects {
  list-style: none;
  margin: 6px 0 0;
  padding: 0 0 0 12px;
  border-left: 2px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.horizons-projects__link {
  padding: 2px 0;
  border: none;
  background: none;
  font-family: var(--font-family-default);
  color: var(--color-link-text);
  text-align: left;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.horizons-projects__link:hover {
  color: var(--color-link-hover);
}

.section__title {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-family-default);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 13px;
  color: var(--color-action);
}

.level-meaning {
  margin: 0;
  padding: 12px 20px;
}

.level-example {
  margin: -8px 0 0;
  padding: 0 20px 12px;
}

/* Purpose statements are long — titles wrap in full */
.level-list :deep(.item__title) {
  white-space: normal;
  overflow-wrap: anywhere;
}

.level-list :deep(.item__content) {
  flex: 1 1 auto;
}

.level-sub {
  min-width: 0;
}

.level-sub__empty {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.level-sub__link {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-link-text);
  cursor: pointer;
}

.level-sub__link:hover {
  color: var(--color-link-hover);
}

/* The Projects "No next action" chip */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
}

.chip--warning {
  color: var(--color-warning);
}

.chip__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.level-add {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 44px;
  padding: 0 16px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.level-add:hover {
  background: var(--color-bg-row-hover);
  color: var(--color-text-secondary);
}

.level-add__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.level-add-form {
  display: flex;
  gap: 10px;
  padding: 0 16px 8px;
}

.add-button {
  margin-top: 8px;
  margin-bottom: 4px;
}

.dialog-body {
  margin: 0 0 16px;
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}

.dialog-body.color-text-secondary {
  color: var(--color-text-secondary);
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-label {
  color: var(--color-text-primary);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 768px) {
  .loading-state {
    padding-top: 110px;
  }

  .dialog-actions {
    flex: 1;
    flex-direction: column-reverse;
  }

  .dialog-actions > * {
    width: 100%;
  }
}
</style>
