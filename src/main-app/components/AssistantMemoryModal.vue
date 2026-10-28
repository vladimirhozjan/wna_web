<template>
  <Modal :visible="visible" title="AI memory" max-width="520px" fullscreen-mobile @close="close">
    <div class="memory" data-testid="assistant-memory-modal">
      <p class="text-body-s color-text-secondary memory__intro">
        The assistant writes notes here as you work together, like "work tasks get @work". Edit or remove anything.
      </p>
      <div v-if="loading" class="memory__loading">
        <Spinner :size="24" />
      </div>
      <textarea
          v-else
          v-model="text"
          class="text-body-s memory__input"
          placeholder="Nothing yet. The assistant notes your habits and rules as you work together."
          data-testid="assistant-memory-text"
      ></textarea>
      <div class="memory__count">
        <span class="text-caption" :class="overCap ? 'color-text-error' : 'color-text-tertiary'">{{ used.toLocaleString('en-US') }} / {{ maxChars.toLocaleString('en-US') }} characters</span>
        <span v-if="overCap" class="text-caption color-text-error">Memory can be up to {{ maxChars.toLocaleString('en-US') }} characters. Shorten it to save.</span>
      </div>
    </div>
    <template #actions>
      <Btn variant="ghost-danger" size="sm" class="memory__clear" :disabled="loading || saving || !saved" @click="onClear">Clear memory</Btn>
      <Btn variant="secondary" size="sm" :disabled="saving" @click="close">Cancel</Btn>
      <Btn variant="primary" size="sm" :disabled="!canSave" :loading="saving" data-testid="assistant-memory-save" @click="onSave">Save</Btn>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'
import Btn from './Btn.vue'
import Spinner from './Spinner.vue'
import { assistantModel, charCount } from '../scripts/models/assistantModel.js'
import { confirmModel } from '../scripts/core/confirmModel.js'
import { errorModel } from '../scripts/core/errorModel.js'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const assistant = assistantModel()
const confirm = confirmModel()
const toaster = errorModel()

const text = ref('')
const saved = ref('')
const maxFromApi = ref(null)
const loading = ref(false)
const saving = ref(false)

const maxChars = computed(() => maxFromApi.value ?? assistant.state.account?.memory_max_chars ?? 0)
const used = computed(() => charCount(text.value))
const overCap = computed(() => maxChars.value > 0 && used.value > maxChars.value)
const canSave = computed(() => !loading.value && !saving.value && text.value !== saved.value && !overCap.value)

async function load() {
  loading.value = true
  try {
    const data = await assistant.getMemory()
    text.value = saved.value = data.text || ''
    maxFromApi.value = data.max_chars
  } catch {
    toaster.push('Couldn\'t load the memory. Try again.')
    emit('close')
  } finally {
    loading.value = false
  }
}

function close() {
  if (!saving.value) emit('close')
}

async function onSave() {
  if (!canSave.value) return
  saving.value = true
  try {
    await assistant.saveMemory(text.value)
    saving.value = false
    toaster.success('Memory saved')
    emit('close')
  } catch (err) {
    if (err.data?.max_chars) maxFromApi.value = err.data.max_chars
    toaster.push('Couldn\'t save the memory. Try again.')
  } finally {
    saving.value = false
  }
}

async function onClear() {
  const ok = await confirm.show({
    title: 'Clear memory?',
    message: 'The assistant forgets everything it noted about how you work. This can\'t be undone.',
    confirmText: 'Clear',
    cancelText: 'Cancel',
  })
  if (!ok) return
  saving.value = true
  try {
    await assistant.clearMemory()
    text.value = saved.value = ''
    toaster.success('Memory cleared')
  } catch {
    toaster.push('Couldn\'t clear the memory. Try again.')
  } finally {
    saving.value = false
  }
}

watch(() => props.visible, (open) => {
  if (open) load()
})
</script>

<style scoped>
.memory {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.memory__intro {
  margin: 0;
}

.memory__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(10lh + 18px);
}

.memory__input {
  flex: 1;
  min-height: calc(10lh + 18px);
  max-height: 50vh;
  padding: 8px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  outline: none;
  resize: none;
  box-sizing: border-box;
  font-family: inherit;
  line-height: var(--lh-relaxed);
  color: var(--color-text-primary);
  background: var(--color-bg-primary);
}

.memory__input::placeholder {
  color: var(--color-text-tertiary);
}

.memory__input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.memory__count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
}

.memory__clear {
  margin-right: auto;
}

@media (max-width: 768px) {
  .memory__input {
    max-height: none;
    font-size: var(--font-size-body);
  }
}
</style>
