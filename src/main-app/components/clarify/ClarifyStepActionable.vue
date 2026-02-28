<template>
  <div class="clarify-step">
    <h3 class="clarify-step-question">Is it actionable?</h3>
    <p class="clarify-step-hint">Can you take a physical action on this item?</p>

    <div class="clarify-options">
      <button
          class="clarify-option"
          @click="select(true)"
      >
        <span class="clarify-option-label">Yes</span>
        <span class="clarify-option-key">Y</span>
      </button>
      <button
          class="clarify-option"
          @click="select(false)"
      >
        <span class="clarify-option-label">No</span>
        <span class="clarify-option-key">N</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['select'])

function select(isActionable) {
  emit('select', isActionable)
}

function handleKeydown(e) {
  if (e.key.toLowerCase() === 'y') {
    e.preventDefault()
    select(true)
  } else if (e.key.toLowerCase() === 'n') {
    e.preventDefault()
    select(false)
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
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
}

.clarify-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  min-width: 0;
  flex: 1 1 140px;
  border: 2px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.15s ease;
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

.clarify-option-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-l);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.clarify-option-key {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .clarify-options {
    flex-direction: column;
    gap: 12px;
  }

  .clarify-option {
    padding: 20px;
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
