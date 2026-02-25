<template>
  <DashboardLayout>
    <div class="detail-page">

      <!-- Header -->
      <div class="detail-header">
        <div class="detail-header-left">
          <a class="detail-back-link" @click="goBack">&lt;</a>
          <span class="detail-meta-link" @click="goBack">Calendar</span>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="pageLoading" class="detail-loading">
        <span class="detail-spinner"></span>
      </div>

      <!-- Content -->
      <div v-else class="detail-body">

        <!-- Title area -->
        <div class="detail-title-area">
          <RecurringIcon class="detail-type-icon" viewBox="0 0 48 48" />
          <div class="detail-title-wrapper">
            <div v-if="savingField === 'title'" class="detail-section-overlay">
              <span class="detail-spinner"></span>
            </div>
            <h2
                v-if="!isCreate"
                class="detail-title"
                :class="{ 'detail-title--hidden': editingField === 'title' }"
                @click="startEdit('title', template.title)"
            >{{ template.title }}</h2>
            <textarea
                v-if="isCreate"
                ref="titleInput"
                v-model="createData.title"
                class="detail-title-input detail-title-input--create"
                placeholder="Template title"
                @input="autoResizeTitle"
                rows="1"
            ></textarea>
            <textarea
                v-else-if="editingField === 'title'"
                ref="titleInput"
                v-model="editTitle"
                class="detail-title-input"
                :disabled="savingField === 'title'"
                @keydown.enter.prevent="saveField('title')"
                @keyup.esc="cancelEdit"
                @blur="saveField('title')"
                @input="autoResizeTitle"
                rows="1"
            ></textarea>
          </div>
        </div>

        <!-- Active instance badge -->
        <div v-if="!isCreate && template.active_instance_id" class="detail-instance-badge" @click="goToInstance">
          <ActionIcon class="detail-instance-badge__icon" />
          <span>Active instance</span>
        </div>

        <!-- Action buttons -->
        <div class="detail-actions">
          <template v-if="isCreate">
            <Btn
                variant="primary"
                size="sm"
                :loading="creating"
                :disabled="!createData.title.trim() || creating"
                @click="onCreateSubmit"
            >
              Create
            </Btn>
          </template>
          <template v-else>
            <Btn
                v-if="!template.active_instance_id"
                variant="primary"
                size="sm"
                :loading="actionLoading === 'spawn'"
                @click="onSpawn"
            >
              Spawn next
            </Btn>
            <Btn
                variant="ghost-danger"
                size="sm"
                :loading="actionLoading === 'delete'"
                @click="onDelete"
            >
              Trash
            </Btn>
          </template>
        </div>

        <!-- Description area -->
        <div class="detail-section-area">
          <label class="detail-section-label">Description</label>
          <div class="detail-section-wrapper">
            <template v-if="isCreate">
              <textarea
                  v-model="createData.description"
                  class="detail-section-textarea"
                  placeholder="Add a description..."
                  rows="1"
              ></textarea>
            </template>
            <template v-else>
              <p
                  v-if="editingField !== 'description'"
                  class="detail-section-content"
                  :class="{ 'detail-section-content--empty': !template.description }"
                  @click="startEdit('description', template.description || '')"
              >{{ template.description || 'Add a description...' }}</p>
              <textarea
                  v-else
                  ref="descriptionInput"
                  v-model="editValue"
                  class="detail-section-textarea"
                  :disabled="savingField === 'description'"
                  @keyup.esc="cancelEdit"
                  @blur="saveField('description')"
                  rows="1"
              ></textarea>
              <div v-if="editingField === 'description'" class="detail-section-actions">
                <Btn variant="primary" size="sm" :disabled="savingField === 'description'" :loading="savingField === 'description'" @mousedown.prevent @click="saveField('description')">Save</Btn>
                <Btn variant="ghost" size="sm" :disabled="savingField === 'description'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
              </div>
            </template>
          </div>
        </div>

        <!-- Recurrence rule -->
        <div class="detail-section-area">
          <label class="detail-section-label">Recurrence</label>
          <div class="detail-section-wrapper">
            <RecurrenceInput
                v-if="isCreate"
                v-model="createData.recurrence_rule"
            />
            <RecurrenceInput
                v-else
                :model-value="template.recurrence_rule || ''"
                :disabled="savingField === 'recurrence'"
                @update:model-value="onRecurrenceChanged"
            />
          </div>
        </div>

        <!-- Scheduled time -->
        <div class="detail-section-area">
          <label class="detail-section-label">Scheduled time</label>
          <div class="detail-section-wrapper">
            <div class="detail-date-inputs">
              <input
                  type="time"
                  :value="isCreate ? createData.scheduled_time : template.scheduled_time"
                  class="detail-input detail-input--time"
                  :disabled="!isCreate && savingField === 'time'"
                  @change="onTimeChanged($event.target.value)"
              />
              <div class="detail-duration-input">
                <input
                    type="number"
                    :value="isCreate ? createData.scheduled_duration : template.scheduled_duration"
                    class="detail-input detail-input--duration"
                    min="5"
                    step="5"
                    placeholder="min"
                    :disabled="!isCreate && savingField === 'time'"
                    @change="onDurationChanged(Number($event.target.value))"
                />
                <span class="detail-duration-label">min</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags section -->
        <div class="detail-section-area">
          <label class="detail-section-label">Tags</label>
          <div class="detail-section-wrapper">
            <template v-if="isCreate">
              <TagInput v-model="createData.tags" />
            </template>
            <template v-else>
              <div v-if="editingField !== 'tags'" class="detail-tags-display" @click="startTagEdit">
                <span v-if="template.tags && template.tags.length > 0" class="detail-tags-chips">
                  <span v-for="tag in template.tags" :key="tag" class="detail-tag-chip">{{ tag }}</span>
                </span>
                <span v-else class="detail-section-content detail-section-content--empty">Add tags...</span>
              </div>
              <template v-else>
                <TagInput v-model="editTags" :disabled="savingField === 'tags'" />
                <div class="detail-section-actions">
                  <Btn variant="primary" size="sm" :disabled="savingField === 'tags'" :loading="savingField === 'tags'" @mousedown.prevent @click="saveTags">Save</Btn>
                  <Btn variant="ghost" size="sm" :disabled="savingField === 'tags'" @mousedown.prevent @click="cancelEdit">Cancel</Btn>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Next occurrence (edit mode only) -->
        <div v-if="!isCreate && template.next_occurrence" class="detail-section-area">
          <label class="detail-section-label">Next occurrence</label>
          <div class="detail-section-wrapper">
            <p class="detail-section-content detail-section-content--readonly">{{ formatDate(template.next_occurrence) }}</p>
          </div>
        </div>

        <!-- Metadata (edit mode) -->
        <div v-if="!isCreate" class="detail-metadata">
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Created</span>
            <span class="detail-metadata-value">{{ formatDate(template.created) }}</span>
          </span>
          <span class="detail-metadata-separator">&middot;</span>
          <span class="detail-metadata-item">
            <span class="detail-metadata-label">Updated</span>
            <span class="detail-metadata-value">{{ formatDate(template.updated) }}</span>
          </span>
        </div>

      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import Btn from '../components/Btn.vue'
import TagInput from '../components/TagInput.vue'
import RecurrenceInput from '../components/RecurrenceInput.vue'
import RecurringIcon from '../assets/RecurringIcon.vue'
import ActionIcon from '../assets/ActionIcon.vue'
import { recurringModel } from '../scripts/recurringModel.js'
import { errorModel } from '../scripts/errorModel.js'
import { confirmModel } from '../scripts/confirmModel.js'
import { tagModel } from '../scripts/tagModel.js'

const route = useRoute()
const router = useRouter()
const toaster = errorModel()
const confirm = confirmModel()
const tagMdl = tagModel()

const {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring: deleteRecurringFn,
  spawnRecurring,
} = recurringModel()

const template = ref({})
const pageLoading = ref(true)
const editingField = ref(null)
const editValue = ref('')
const savingField = ref(null)
const titleInput = ref(null)
const descriptionInput = ref(null)
const actionLoading = ref(null)
const editTags = ref([])
const editTitle = ref('')
const creating = ref(false)

const isCreate = computed(() => route.name === 'recurring-new')

// Create mode data
const createData = ref({
  title: '',
  description: '',
  recurrence_rule: 'FREQ=WEEKLY',
  scheduled_time: '',
  scheduled_duration: null,
  tags: [],
})

onMounted(async () => {
  if (isCreate.value) {
    pageLoading.value = false
    nextTick(() => titleInput.value?.focus())
    return
  }

  try {
    const data = await getRecurring(route.params.id)
    template.value = { ...data }
  } catch {
    toaster.push('Failed to load recurring template')
    router.push({ name: 'calendar' })
  } finally {
    pageLoading.value = false
  }
})

function goBack() {
  router.push({ name: 'calendar' })
}

function goToInstance() {
  if (!template.value.active_instance_id) return
  router.push({
    name: 'action-detail',
    params: { id: template.value.active_instance_id },
    query: { from: 'recurring', recurring_id: template.value.id }
  })
}

function startEdit(field, value) {
  if (savingField.value) return
  editingField.value = field
  editValue.value = value
  if (field === 'title') editTitle.value = value
  nextTick(() => {
    if (field === 'title' && titleInput.value) {
      autoResizeTitle()
      titleInput.value.focus()
      titleInput.value.select()
    } else if (field === 'description' && descriptionInput.value) {
      descriptionInput.value.focus()
    }
  })
}

function cancelEdit() {
  editingField.value = null
  editValue.value = ''
  editTitle.value = ''
}

function autoResizeTitle() {
  if (titleInput.value) {
    titleInput.value.style.height = '0'
    titleInput.value.style.height = Math.max(44, titleInput.value.scrollHeight) + 'px'
  }
}

async function saveField(field) {
  if (editingField.value !== field) return
  if (savingField.value) return

  const newValue = field === 'title' ? editTitle.value.trim() : editValue.value.trim()

  if (field === 'title' && (!newValue || newValue === template.value.title)) {
    editingField.value = null
    return
  }

  if (field === 'description' && newValue === (template.value.description || '')) {
    editingField.value = null
    return
  }

  const oldValue = template.value[field]
  template.value[field] = newValue
  savingField.value = field

  try {
    await updateRecurring(template.value.id, { [field]: newValue })
    editingField.value = null
  } catch {
    template.value[field] = oldValue
    toaster.push('Failed to save changes')
  } finally {
    savingField.value = null
  }
}

function startTagEdit() {
  if (savingField.value) return
  editingField.value = 'tags'
  editTags.value = [...(template.value.tags || [])]
}

async function saveTags() {
  if (editingField.value !== 'tags' || savingField.value) return

  const newTags = [...editTags.value]
  const oldTags = template.value.tags || []

  if (JSON.stringify(newTags) === JSON.stringify(oldTags)) {
    editingField.value = null
    return
  }

  template.value.tags = newTags
  savingField.value = 'tags'

  try {
    await updateRecurring(template.value.id, { tags: newTags })
    tagMdl.addToCache(newTags)
    editingField.value = null
  } catch {
    template.value.tags = oldTags
    toaster.push('Failed to save tags')
  } finally {
    savingField.value = null
  }
}

async function onRecurrenceChanged(newRule) {
  const oldRule = template.value.recurrence_rule
  template.value.recurrence_rule = newRule
  savingField.value = 'recurrence'

  try {
    await updateRecurring(template.value.id, { recurrence_rule: newRule })
  } catch {
    template.value.recurrence_rule = oldRule
    toaster.push('Failed to save recurrence')
  } finally {
    savingField.value = null
  }
}

async function onTimeChanged(time) {
  if (isCreate.value) {
    createData.value.scheduled_time = time
    return
  }

  const oldTime = template.value.scheduled_time
  template.value.scheduled_time = time
  savingField.value = 'time'

  try {
    await updateRecurring(template.value.id, { scheduled_time: time })
  } catch {
    template.value.scheduled_time = oldTime
    toaster.push('Failed to save time')
  } finally {
    savingField.value = null
  }
}

async function onDurationChanged(duration) {
  if (isCreate.value) {
    createData.value.scheduled_duration = duration || null
    return
  }

  const oldDuration = template.value.scheduled_duration
  template.value.scheduled_duration = duration || null
  savingField.value = 'time'

  try {
    await updateRecurring(template.value.id, { scheduled_duration: duration || null })
  } catch {
    template.value.scheduled_duration = oldDuration
    toaster.push('Failed to save duration')
  } finally {
    savingField.value = null
  }
}

async function onCreateSubmit() {
  const title = createData.value.title.trim()
  if (!title) return

  creating.value = true
  try {
    const body = { title }
    if (createData.value.description) body.description = createData.value.description
    if (createData.value.recurrence_rule) body.recurrence_rule = createData.value.recurrence_rule
    if (createData.value.scheduled_time) body.scheduled_time = createData.value.scheduled_time
    if (createData.value.scheduled_duration) body.scheduled_duration = createData.value.scheduled_duration
    if (createData.value.tags?.length) body.tags = createData.value.tags

    const created = await createRecurring(body)
    toaster.success('Recurring template created')
    router.push({ name: 'recurring-detail', params: { id: created.id } })
  } catch (err) {
    toaster.push(err.message || 'Failed to create template')
  } finally {
    creating.value = false
  }
}

async function onSpawn() {
  actionLoading.value = 'spawn'
  try {
    const updated = await spawnRecurring(template.value.id)
    template.value = { ...updated }
    toaster.success('Next instance spawned')
  } catch (err) {
    toaster.push(err.message || 'Failed to spawn instance')
  } finally {
    actionLoading.value = null
  }
}

async function onDelete() {
  const hasInstance = !!template.value.active_instance_id

  let deleteInstance = false
  if (hasInstance) {
    const confirmed = await confirm.show({
      title: 'Delete Template',
      message: `Delete "${template.value.title}"? This will also delete the active instance.`,
      confirmText: 'Delete All',
      cancelText: 'Cancel'
    })
    if (!confirmed) return
    deleteInstance = true
  } else {
    const confirmed = await confirm.show({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${template.value.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    })
    if (!confirmed) return
  }

  actionLoading.value = 'delete'
  try {
    await deleteRecurringFn(template.value.id, deleteInstance)
    toaster.success(`"${template.value.title}" deleted`)
    router.push({ name: 'calendar' })
  } catch (err) {
    toaster.push(err.message || 'Failed to delete template')
  } finally {
    actionLoading.value = null
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014'
  return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-back-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-link-text);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.detail-back-link:hover {
  background: var(--color-bg-secondary);
  color: var(--color-link-hover);
}

.detail-meta-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-link-text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-meta-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.detail-loading {
  display: flex;
  justify-content: center;
  padding: 48px;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ── Title area ── */
.detail-title-area {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 24px 24px 0 4px;
}

.detail-type-icon {
  width: 42px;
  height: 42px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  align-self: center;
}

.detail-title-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.detail-section-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 4px;
}

.detail-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  line-height: 1.4;
  word-break: break-word;
  cursor: pointer;
}

.detail-title:hover {
  background: var(--color-bg-secondary);
}

.detail-title--hidden {
  visibility: hidden;
}

.detail-title-input {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding: 5px 0;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  line-height: 1.4;
  box-sizing: border-box;
  outline: none;
  background: var(--color-bg-primary);
  resize: none;
  overflow: hidden;
}

.detail-title-input--create {
  position: relative;
}

.detail-title-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

/* ── Active instance badge ── */
.detail-instance-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  margin: 8px 0 0 50px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-link-text);
  cursor: pointer;
}

.detail-instance-badge:hover {
  color: var(--color-link-hover);
  border-color: var(--color-text-tertiary);
}

.detail-instance-badge__icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

/* ── Action buttons ── */
.detail-actions {
  display: flex;
  gap: 8px;
  padding: 16px 24px 16px 50px;
}

/* ── Section areas ── */
.detail-section-area {
  padding: 12px 24px 12px 50px;
  border-bottom: 1px solid var(--color-border-light);
}

.detail-section-label {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.detail-section-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-section-content {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  min-height: 32px;
  box-sizing: border-box;
}

.detail-section-content:hover {
  background: var(--color-bg-secondary);
}

.detail-section-content--empty {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.detail-section-content--readonly {
  cursor: default;
}

.detail-section-content--readonly:hover {
  background: transparent;
}

.detail-section-textarea {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
  padding: 4px 0;
  outline: none;
  width: 100%;
  resize: none;
  background: var(--color-bg-primary);
  box-sizing: border-box;
  line-height: 1.5;
  min-height: 32px;
  field-sizing: content;
}

.detail-section-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.detail-section-actions {
  display: flex;
  gap: 8px;
}

/* ── Date inputs ── */
.detail-date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 8px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
}

.detail-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  outline: none;
}

.detail-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail-input--time {
  width: 120px;
}

.detail-duration-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-input--duration {
  width: 70px;
  text-align: center;
}

.detail-duration-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
}

/* ── Tags section ── */
.detail-tags-display {
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  min-height: 32px;
  display: flex;
  align-items: center;
}

.detail-tags-display:hover {
  background: var(--color-bg-secondary);
}

.detail-tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  line-height: 1.4;
}

/* ── Metadata section ── */
.detail-metadata {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 16px 24px 24px 50px;
  margin-top: 8px;
}

.detail-metadata-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.detail-metadata-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.detail-metadata-value {
  font-family: var(--font-family-default), sans-serif;
  font-size: 11px;
  color: var(--color-text-secondary);
}

.detail-metadata-separator {
  color: var(--color-text-tertiary);
  font-size: 11px;
}

/* ── Spinners ── */
.detail-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .detail-header {
    padding: 8px 12px;
  }

  .detail-title-area {
    padding: 16px 16px 0 4px;
  }

  .detail-actions {
    padding: 12px 16px 12px 50px;
  }

  .detail-section-area {
    padding: 12px 16px 12px 50px;
  }

  .detail-metadata {
    padding: 12px 16px 16px 50px;
  }

  .detail-date-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-input--time {
    width: 100%;
  }

  .detail-duration-input {
    flex-direction: row;
    width: 100%;
  }

  .detail-input--duration {
    flex: 1;
    width: auto;
  }
}
</style>
