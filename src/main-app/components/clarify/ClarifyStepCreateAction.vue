<template>
  <div class="clarify-step">
    <h3 class="text-h4 fw-semibold clarify-step-question">Create Action</h3>
    <p class="text-body-m clarify-step-hint">Define the next physical action you can take.</p>

    <form class="clarify-form" @submit.prevent="onSubmit">
      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label" for="action-title">Title *</label>
        <input
            id="action-title"
            ref="titleInput"
            v-model="form.title"
            type="text"
            class="text-body-m clarify-input"
            placeholder="What's the next action?"
            required
        />
      </div>

      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label" for="action-description">Description</label>
        <textarea
            id="action-description"
            v-model="form.description"
            class="text-body-m clarify-textarea"
            placeholder="Additional details (optional)"
            rows="3"
        ></textarea>
      </div>

      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label">Tags</label>
        <TagInput v-model="form.tags" placeholder="Add context tags (optional)" />
      </div>

      <!-- Sub-step: Choose -->
      <div v-if="subStep === 'choose'" class="clarify-options">
        <button
            type="button"
            class="clarify-option"
            :disabled="!form.title.trim() || loading"
            @click="onSubmit"
        >
          <div class="clarify-option-content">
            <span class="text-body-l fw-semibold clarify-option-label">Create Next Action</span>
            <span class="text-body-s clarify-option-desc">Add to your next actions list</span>
          </div>
        </button>
        <button
            type="button"
            class="clarify-option"
            :disabled="!form.title.trim()"
            @click="subStep = 'delegate'"
        >
          <div class="clarify-option-content">
            <span class="text-body-l fw-semibold clarify-option-label">Delegate It</span>
            <span class="text-body-s clarify-option-desc">Waiting on someone else</span>
          </div>
        </button>
        <button
            type="button"
            class="clarify-option"
            :disabled="!form.title.trim()"
            @click="subStep = 'defer'"
        >
          <div class="clarify-option-content">
            <span class="text-body-l fw-semibold clarify-option-label">Defer It</span>
            <span class="text-body-s clarify-option-desc">Schedule for later</span>
          </div>
        </button>
      </div>

      <!-- Sub-step: Delegate -->
      <div v-else-if="subStep === 'delegate'" class="clarify-substep">
        <div class="clarify-field">
          <label class="text-body-s fw-semibold clarify-label" for="action-waiting-for">Who/what are you waiting on?</label>
          <input
              id="action-waiting-for"
              ref="waitingForInput"
              v-model="form.waitingFor"
              type="text"
              class="text-body-m clarify-input"
              placeholder="e.g. John, design team, client approval"
          />
        </div>

        <div class="clarify-substep-actions">
          <Btn variant="ghost" size="md" @click="backToChoose">Back</Btn>
          <Btn
              type="submit"
              variant="primary"
              size="md"
              :disabled="!form.title.trim() || !form.waitingFor.trim() || loading"
              :loading="loading"
          >
            Create Action
          </Btn>
        </div>
      </div>

      <!-- Sub-step: Defer -->
      <div v-else-if="subStep === 'defer'" class="clarify-substep">
        <!-- Deferred (Scheduled for / Start after) -->
        <div class="clarify-date-field">
          <label class="text-body-s fw-semibold clarify-label">Deferred</label>
          <div class="clarify-date-type-selector">
            <label class="text-body-m clarify-radio">
              <input type="radio" v-model="form.deferType" value="scheduled" />
              <span>Scheduled for</span>
            </label>
            <label class="text-body-m clarify-radio">
              <input type="radio" v-model="form.deferType" value="start" />
              <span>Start after</span>
            </label>
          </div>
          <div v-if="form.deferType" class="clarify-date-inputs">
            <DateInput v-model="form.deferDate" class="text-body-m clarify-input" />
            <span v-if="!showDeferTime" class="text-body-s clarify-link" @click="showDeferTime = true">Add time</span>
            <input v-else type="time" v-model="form.deferTime" class="text-body-m clarify-input clarify-input--time" />
            <template v-if="form.deferType === 'scheduled' && form.deferTime">
              <span v-if="!showDuration" class="text-body-s clarify-link" @click="showDuration = true">Add duration</span>
              <select v-else v-model="form.deferDuration" class="text-body-m clarify-input clarify-input--duration">
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
          <button v-if="form.deferType" type="button" class="text-body-s clarify-clear-btn" @click="clearDeferred">Clear</button>
        </div>

        <!-- Due Date (hidden when scheduled is selected — mutual exclusivity) -->
        <div v-if="form.deferType !== 'scheduled'" class="clarify-date-field">
          <label class="text-body-s fw-semibold clarify-label">Due</label>
          <div class="clarify-date-inputs">
            <DateInput v-model="form.dueDate" class="text-body-m clarify-input" />
            <span v-if="form.dueDate && !showDueTime" class="text-body-s clarify-link" @click="showDueTime = true">Add time</span>
            <input v-if="form.dueDate && showDueTime" type="time" v-model="form.dueTime" class="text-body-m clarify-input clarify-input--time" />
          </div>
          <button v-if="form.dueDate" type="button" class="text-body-s clarify-clear-btn" @click="clearDue">Clear</button>
        </div>

        <div class="clarify-substep-actions">
          <Btn variant="ghost" size="md" @click="backToChoose">Back</Btn>
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
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, nextTick, onMounted } from 'vue'
import Btn from '../Btn.vue'
import TagInput from '../TagInput.vue'
import DateInput from '../DateInput.vue'

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
const waitingForInput = ref(null)
const subStep = ref('choose') // 'choose' | 'delegate' | 'defer'
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
  waitingFor: '',
})

function backToChoose() {
  subStep.value = 'choose'
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
    deferType: subStep.value === 'defer' ? form.deferType : null,
    deferDate: subStep.value === 'defer' ? form.deferDate : null,
    deferTime: subStep.value === 'defer' ? form.deferTime : null,
    deferDuration: subStep.value === 'defer' && form.deferDuration ? parseInt(form.deferDuration) : null,
    dueDate: subStep.value === 'defer' ? form.dueDate : null,
    dueTime: subStep.value === 'defer' ? form.dueTime : null,
    waitingFor: subStep.value === 'delegate' ? form.waitingFor.trim() : '',
  })
}
</script>

<style scoped>
.clarify-step {
  max-width: 480px;
  margin: 0 auto;
}

.clarify-step-question {
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  text-align: center;
}

.clarify-step-hint {
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
  color: var(--color-text-primary);
}

.clarify-input {
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

/* 3-button choice layout */
.clarify-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.clarify-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.clarify-option:hover:not(:disabled) {
  border-color: var(--color-action);
  background: var(--color-bg-secondary);
}

.clarify-option:focus:not(:disabled) {
  outline: none;
  border-color: var(--color-action);
  box-shadow: var(--shadow-focus-ring-wide);
}

.clarify-option:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clarify-option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.clarify-option-label {
  color: var(--color-text-primary);
}

.clarify-option-desc {
  color: var(--color-text-secondary);
}

/* Sub-step sections (delegate / defer) */
.clarify-substep {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 8px;
}

.clarify-substep-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

/* Date fields */
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
  color: var(--color-link-text);
  cursor: pointer;
}

.clarify-link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.clarify-clear-btn {
  align-self: flex-start;
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
