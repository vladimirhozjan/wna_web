<template>
  <div class="clarify-step">
    <h3 class="text-h4 fw-semibold clarify-step-question">Create Project</h3>
    <p class="text-body-m clarify-step-hint">Define the project outcome.</p>

    <form class="clarify-form" @submit.prevent="onSubmit">
      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label" for="project-title">Project Title *</label>
        <input
            id="project-title"
            ref="titleInput"
            v-model="form.title"
            type="text"
            class="text-body-m clarify-input"
            placeholder="What's the desired outcome?"
            required
        />
      </div>

      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label" for="project-outcome">Outcome *</label>
        <p class="text-footnote color-text-secondary clarify-helper">{{ OUTCOME_HELPER }}</p>
        <textarea
            id="project-outcome"
            v-model="form.outcome"
            class="text-body-m clarify-textarea"
            placeholder="e.g. New website live, so clients can book online"
            rows="2"
            required
        ></textarea>
      </div>

      <div v-if="showAreaPicker || showGoalPicker" class="clarify-horizons">
        <div v-if="showAreaPicker" class="clarify-field">
          <label class="text-body-s fw-semibold clarify-label">Area of focus</label>
          <Select v-model="form.area_id" :options="horizon.options('area')" title="Area of focus" block data-testid="clarify-project-area" />
        </div>
        <div v-if="showGoalPicker" class="clarify-field">
          <label class="text-body-s fw-semibold clarify-label">Goal</label>
          <Select v-model="form.goal_id" :options="horizon.options('goal')" title="Goal" block data-testid="clarify-project-goal" />
        </div>
      </div>

      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label" for="project-description">Description</label>
        <textarea
            id="project-description"
            v-model="form.description"
            class="text-body-m clarify-textarea"
            placeholder="Project notes and context (optional)"
            rows="3"
        ></textarea>
      </div>

      <div class="clarify-field">
        <label class="text-body-s fw-semibold clarify-label">Tags</label>
        <TagInput v-model="form.tags" placeholder="Add context tags (optional)" />
      </div>

      <div class="clarify-form-actions">
        <Btn
            type="submit"
            variant="primary"
            size="md"
            :disabled="!form.title.trim() || !form.outcome.trim() || loading"
            :loading="loading"
        >
          Create Project
        </Btn>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import Btn from '../Btn.vue'
import TagInput from '../TagInput.vue'
import Select from '../Select.vue'
import { OUTCOME_HELPER } from '../../scripts/core/textUtils.js'
import { horizonModel } from '../../scripts/models/horizonModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'

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
const horizon = horizonModel()
const settings = settingsModel()

const showAreaPicker = computed(() => settings.state.horizonsEnabled && horizon.hasAreas.value)
const showGoalPicker = computed(() => settings.state.horizonsEnabled && horizon.hasGoals.value)

const form = reactive({
  title: props.initialData.title || '',
  outcome: props.initialData.outcome || '',
  description: props.initialData.description || '',
  tags: props.initialData.tags || [],
  area_id: props.initialData.area_id || '',
  goal_id: props.initialData.goal_id || '',
})

onMounted(() => {
  titleInput.value?.focus()
  if (settings.state.horizonsEnabled) horizon.load().catch(() => {})
})

function onSubmit() {
  if (!form.title.trim() || !form.outcome.trim()) return
  emit('submit', {
    title: form.title.trim(),
    outcome: form.outcome.trim(),
    description: form.description.trim(),
    tags: form.tags,
    area_id: showAreaPicker.value ? form.area_id : '',
    goal_id: showGoalPicker.value ? form.goal_id : '',
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

/* Each picker takes half the width; a single one stays on the left */
.clarify-horizons {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.clarify-helper {
  margin: 0;
}

.clarify-field-hint {
  color: var(--color-text-tertiary);
  font-style: italic;
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

.clarify-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
