<template>
  <div class="clarify-step">
    <h3 class="clarify-step-question">Create Action</h3>
    <p class="clarify-step-hint">Define the next physical action you can take.</p>

    <form class="clarify-form" @submit.prevent="onSubmit">
      <div class="clarify-field">
        <label class="clarify-label" for="action-title">Title *</label>
        <input
            id="action-title"
            ref="titleInput"
            v-model="form.title"
            type="text"
            class="clarify-input"
            placeholder="What's the next action?"
            required
        />
      </div>

      <div class="clarify-field">
        <label class="clarify-label" for="action-description">Description</label>
        <textarea
            id="action-description"
            v-model="form.description"
            class="clarify-textarea"
            placeholder="Additional details (optional)"
            rows="3"
        ></textarea>
      </div>

      <div class="clarify-field">
        <label class="clarify-label">Tags</label>
        <TagInput v-model="form.tags" placeholder="Add context tags (optional)" />
      </div>

      <!-- Dates Section (collapsible, closed by default) -->
      <div class="clarify-dates-section">
        <div class="clarify-dates-header" @click="toggleDates">
          <span class="clarify-dates-label">Dates</span>
          <span v-if="!datesExpanded && !hasAnyDate" class="clarify-dates-hint">Add dates...</span>
          <span v-else-if="!datesExpanded" class="clarify-dates-summary">{{ datesSummary }}</span>
          <span class="clarify-dates-toggle">{{ datesExpanded ? '&#9660;' : '&#9654;' }}</span>
        </div>

        <div v-if="datesExpanded" class="clarify-dates-content">
          <!-- Deferred (Scheduled for / Start after) -->
          <div class="clarify-date-field">
            <label class="clarify-label">Deferred</label>
            <div class="clarify-date-type-selector">
              <label class="clarify-radio">
                <input type="radio" v-model="form.deferType" value="scheduled" />
                <span>Scheduled for</span>
              </label>
              <label class="clarify-radio">
                <input type="radio" v-model="form.deferType" value="start" />
                <span>Start after</span>
              </label>
            </div>
            <div v-if="form.deferType" class="clarify-date-inputs">
              <input type="date" v-model="form.deferDate" class="clarify-input" />
              <span v-if="!showDeferTime" class="clarify-link" @click="showDeferTime = true">Add time</span>
              <input v-else type="time" v-model="form.deferTime" class="clarify-input clarify-input--time" />
              <template v-if="form.deferType === 'scheduled' && form.deferTime">
                <span v-if="!showDuration" class="clarify-link" @click="showDuration = true">Add duration</span>
                <select v-else v-model="form.deferDuration" class="clarify-input clarify-input--duration">
                  <option :value="null">No duration</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </template>
            </div>
            <button v-if="form.deferType" type="button" class="clarify-clear-btn" @click="clearDeferred">Clear</button>
          </div>

          <!-- Due Date -->
          <div class="clarify-date-field">
            <label class="clarify-label">Due</label>
            <div class="clarify-date-inputs">
              <input type="date" v-model="form.dueDate" class="clarify-input" />
              <span v-if="form.dueDate && !showDueTime" class="clarify-link" @click="showDueTime = true">Add time</span>
              <input v-if="form.dueDate && showDueTime" type="time" v-model="form.dueTime" class="clarify-input clarify-input--time" />
            </div>
            <button v-if="form.dueDate" type="button" class="clarify-clear-btn" @click="clearDue">Clear</button>
          </div>
        </div>
      </div>

      <div class="clarify-form-actions">
        <Btn
            type="submit"
            variant="primary"
            size="md"
            :disabled="!form.title.trim() || loading"
            :loading="loading"
        >
          Create Action
        </Btn>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import Btn from '../Btn.vue'
import TagInput from '../TagInput.vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['submit'])

const titleInput = ref(null)
const datesExpanded = ref(false)
const showDeferTime = ref(false)
const showDueTime = ref(false)
const showDuration = ref(false)

const form = reactive({
  title: props.initialData.title || '',
  description: props.initialData.description || '',
  tags: props.initialData.tags || [],
  deferType: null,
  deferDate: null,
  deferTime: null,
  deferDuration: null,
  dueDate: null,
  dueTime: null,
})

const hasAnyDate = computed(() => form.deferDate || form.dueDate)

const datesSummary = computed(() => {
  const parts = []
  if (form.dueDate) parts.push(`Due: ${formatShortDate(form.dueDate)}`)
  if (form.deferDate && form.deferType === 'scheduled') {
    let scheduled = `Scheduled: ${formatShortDate(form.deferDate)}`
    if (form.deferDuration) scheduled += ` (${formatDuration(form.deferDuration)})`
    parts.push(scheduled)
  }
  if (form.deferDate && form.deferType === 'start') parts.push(`Starts: ${formatShortDate(form.deferDate)}`)
  return parts.join(' · ')
})

function formatDuration(minutes) {
  const mins = parseInt(minutes)
  if (mins < 60) return `${mins} min`
  if (mins === 60) return '1 hour'
  if (mins % 60 === 0) return `${mins / 60} hours`
  return `${mins / 60} hours`
}

function toggleDates() {
  datesExpanded.value = !datesExpanded.value
}

function formatShortDate(date) {
  if (!date) return ''
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function clearDeferred() {
  form.deferType = null
  form.deferDate = null
  form.deferTime = null
  form.deferDuration = null
  showDeferTime.value = false
  showDuration.value = false
}

function clearDue() {
  form.dueDate = null
  form.dueTime = null
  showDueTime.value = false
}

onMounted(() => {
  titleInput.value?.focus()
})

function onSubmit() {
  if (!form.title.trim()) return
  emit('submit', {
    title: form.title.trim(),
    description: form.description.trim(),
    tags: form.tags,
    deferType: form.deferType,
    deferDate: form.deferDate,
    deferTime: form.deferTime,
    deferDuration: form.deferDuration ? parseInt(form.deferDuration) : null,
    dueDate: form.dueDate,
    dueTime: form.dueTime,
  })
}
</script>

<style scoped>
.clarify-step {
  max-width: 480px;
  margin: 0 auto;
}

.clarify-step-question {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  text-align: center;
}

.clarify-step-hint {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0 0 24px 0;
  text-align: center;
}

.clarify-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.clarify-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.clarify-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.clarify-input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
}

.clarify-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.clarify-input::placeholder {
  color: var(--color-text-prefill);
}

.clarify-textarea {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
  resize: vertical;
  min-height: 80px;
}

.clarify-textarea:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.clarify-textarea::placeholder {
  color: var(--color-text-prefill);
}

.clarify-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

/* Dates section */
.clarify-dates-section {
  margin-top: 4px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  overflow: hidden;
}

.clarify-dates-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  background: var(--color-bg-secondary);
}

.clarify-dates-header:hover {
  background: var(--color-bg-tertiary);
}

.clarify-dates-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.clarify-dates-hint {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  font-style: italic;
}

.clarify-dates-summary {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
}

.clarify-dates-toggle {
  font-size: var(--font-size-2xs);
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.clarify-dates-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.clarify-date-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clarify-date-type-selector {
  display: flex;
  gap: 16px;
}

.clarify-radio {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
}

.clarify-radio input {
  margin: 0;
  cursor: pointer;
}

.clarify-date-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.clarify-input--time {
  width: 120px;
}

.clarify-input--duration {
  width: 120px;
}

.clarify-link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-link-text);
  cursor: pointer;
}

.clarify-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.clarify-clear-btn {
  align-self: flex-start;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.clarify-clear-btn:hover {
  color: var(--color-danger);
}

@media (max-width: 768px) {
  .clarify-date-type-selector {
    flex-direction: column;
    gap: 8px;
  }

  .clarify-date-inputs {
    flex-direction: column;
    align-items: stretch;
  }

  .clarify-input--time {
    width: 100%;
  }

  .clarify-input--duration {
    width: 100%;
  }
}
</style>
