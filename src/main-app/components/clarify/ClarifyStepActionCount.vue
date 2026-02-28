<template>
  <div class="clarify-step">
    <h3 class="text-h4 fw-semibold clarify-step-question">Single action or project?</h3>
    <p class="text-body-m clarify-step-hint">Will this take more than one action to complete?</p>

    <div class="clarify-options">
      <button
          class="clarify-option"
          @click="select(true)"
      >
        <div class="clarify-option-content">
          <span class="text-body-l fw-semibold clarify-option-label">Single Action</span>
          <span class="text-body-s clarify-option-desc">One concrete next step</span>
        </div>
        <span class="text-body-s clarify-option-key">S</span>
      </button>
      <button
          class="clarify-option"
          @click="select(false)"
      >
        <div class="clarify-option-content">
          <span class="text-body-l fw-semibold clarify-option-label">Project</span>
          <span class="text-body-s clarify-option-desc">Multiple actions needed</span>
        </div>
        <span class="text-body-s clarify-option-key">P</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['select'])

function select(isSingle) {
  emit('select', isSingle)
}

function handleKeydown(e) {
  const key = e.key.toLowerCase()
  if (key === 's') {
    e.preventDefault()
    select(true)
  } else if (key === 'p') {
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
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
}

.clarify-step-hint {
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
  gap: 12px;
  padding: 24px 32px;
  border: 2px solid var(--color-border-light);
  border-radius: 12px;
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.15s ease;
  min-width: 0;
  flex: 1 1 140px;
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

.clarify-option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.clarify-option-label {
  color: var(--color-text-primary);
}

.clarify-option-desc {
  color: var(--color-text-secondary);
}

.clarify-option-key {
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
    flex-direction: row;
    justify-content: space-between;
    padding: 16px 20px;
    min-width: unset;
  }

  .clarify-option-content {
    text-align: left;
  }
}
</style>
