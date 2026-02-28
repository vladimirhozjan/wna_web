<template>
  <div class="clarify-step">
    <h3 class="clarify-step-question">What would you like to do with it?</h3>
    <p class="clarify-step-hint">This item is not actionable. Choose where to store it.</p>

    <div class="clarify-options">
      <button
          class="clarify-option"
          :disabled="loading"
          @click="select('REFERENCE')"
      >
        <div class="clarify-option-content">
          <span class="clarify-option-label">Reference</span>
          <span class="clarify-option-desc">Save as reference material</span>
        </div>
        <span class="clarify-option-key">R</span>
      </button>
      <button
          class="clarify-option"
          :disabled="loading"
          @click="select('SOMEDAY')"
      >
        <div class="clarify-option-content">
          <span class="clarify-option-label">Someday</span>
          <span class="clarify-option-desc">Maybe do this later</span>
        </div>
        <span class="clarify-option-key">S</span>
      </button>
      <button
          class="clarify-option clarify-option--danger"
          :disabled="loading"
          @click="select('TRASH')"
      >
        <div class="clarify-option-content">
          <span class="clarify-option-label">Trash</span>
          <span class="clarify-option-desc">Move to trash</span>
        </div>
        <span class="clarify-option-key">T</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

function select(target) {
  emit('select', target)
}

function handleKeydown(e) {
  if (props.loading) return
  const key = e.key.toLowerCase()
  if (key === 'r') {
    e.preventDefault()
    select('REFERENCE')
  } else if (key === 's') {
    e.preventDefault()
    select('SOMEDAY')
  } else if (key === 't') {
    e.preventDefault()
    select('TRASH')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.clarify-step {
  text-align: center;
}

.clarify-step-question {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
}

.clarify-step-hint {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0 0 32px 0;
}

.clarify-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  margin: 0 auto;
}

.clarify-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 2px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.clarify-option:hover {
  border-color: var(--color-action);
  background: var(--color-bg-secondary);
}

.clarify-option:focus {
  outline: none;
  border-color: var(--color-action);
  box-shadow: var(--shadow-focus-ring-wide);
}

.clarify-option--danger:hover {
  border-color: var(--color-danger);
  background: var(--color-danger-light);
}

.clarify-option--danger:focus {
  border-color: var(--color-danger);
  box-shadow: var(--shadow-focus-ring-danger);
}

.clarify-option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.clarify-option-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.clarify-option-desc {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
}

.clarify-option-key {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  flex-shrink: 0;
}
</style>
