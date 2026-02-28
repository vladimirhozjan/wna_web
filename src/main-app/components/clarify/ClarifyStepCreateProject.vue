<template>
  <div class="clarify-step">
    <h3 class="clarify-step-question">Create Project</h3>
    <p class="clarify-step-hint">Define the project outcome.</p>

    <form class="clarify-form" @submit.prevent="onSubmit">
      <div class="clarify-field">
        <label class="clarify-label" for="project-title">Project Title *</label>
        <input
            id="project-title"
            ref="titleInput"
            v-model="form.title"
            type="text"
            class="clarify-input"
            placeholder="What's the desired outcome?"
            required
        />
      </div>

      <div class="clarify-field">
        <label class="clarify-label" for="project-outcome">Outcome *</label>
        <textarea
            id="project-outcome"
            v-model="form.outcome"
            class="clarify-textarea"
            placeholder="What does done look like?"
            rows="2"
            required
        ></textarea>
      </div>

      <div class="clarify-field">
        <label class="clarify-label" for="project-description">Description</label>
        <textarea
            id="project-description"
            v-model="form.description"
            class="clarify-textarea"
            placeholder="Project notes and context (optional)"
            rows="3"
        ></textarea>
      </div>

      <div class="clarify-field">
        <label class="clarify-label">Tags</label>
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
import { reactive, ref, onMounted } from 'vue'
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

const form = reactive({
  title: props.initialData.title || '',
  outcome: props.initialData.outcome || '',
  description: props.initialData.description || '',
  tags: props.initialData.tags || [],
})

onMounted(() => {
  titleInput.value?.focus()
})

function onSubmit() {
  if (!form.title.trim() || !form.outcome.trim()) return
  emit('submit', {
    title: form.title.trim(),
    outcome: form.outcome.trim(),
    description: form.description.trim(),
    tags: form.tags,
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

.clarify-field-hint {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  font-style: italic;
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
</style>
