<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="move.state.visible" class="overlay" @click.self="move.close">
        <div class="dialog" @keyup.esc="move.close">
          <h3 class="text-h3 title">{{ move.state.title }}</h3>

          <!-- Schedule Modal -->
          <template v-if="move.state.type === 'schedule'">
            <div class="form-group" @keyup.enter="onConfirm">
              <DateTimeInput
                  ref="dateTimeInput"
                  :date="move.state.date"
                  @update:date="move.state.date = $event"
                  :time="move.state.time"
                  @update:time="move.state.time = $event"
                  :duration="move.state.duration"
                  @update:duration="move.state.duration = $event"
                  :with-duration="true"
                  :clearable="true"
              />
            </div>
          </template>

          <!-- Waiting For Modal -->
          <template v-else-if="move.state.type === 'waiting'">
            <div class="form-group">
              <input
                  ref="waitingInput"
                  type="text"
                  v-model="move.state.waitingFor"
                  class="text-body-m input"
                  placeholder="e.g., Sarah from Legal"
                  @keyup.enter="onConfirm"
              />
            </div>
          </template>

          <!-- Outcome Modal -->
          <template v-else-if="move.state.type === 'outcome'">
            <div class="form-group">
              <textarea
                  ref="outcomeInput"
                  v-model="move.state.outcome"
                  class="text-body-m input input--textarea"
                  placeholder="Describe the successful outcome..."
                  rows="3"
              ></textarea>
            </div>
          </template>

          <div class="actions">
            <Btn variant="ghost" size="sm" @click="move.close">
              Cancel
            </Btn>
            <Btn
                variant="primary"
                size="sm"
                @click="onConfirm"
                :disabled="!isValid"
            >
              {{ confirmText }}
            </Btn>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { moveModel } from '../scripts/models/moveModel.js'
import Btn from './Btn.vue'
import DateTimeInput from './DateTimeInput.vue'

const move = moveModel()
const dateTimeInput = ref(null)
const waitingInput = ref(null)
const outcomeInput = ref(null)

const isValid = computed(() => {
  if (move.state.type === 'schedule') {
    return !!move.state.date
  }
  if (move.state.type === 'waiting') {
    return !!move.state.waitingFor.trim()
  }
  if (move.state.type === 'outcome') {
    return !!move.state.outcome.trim()
  }
  return false
})

const confirmText = computed(() => {
  if (move.state.type === 'schedule') return 'Schedule'
  if (move.state.type === 'waiting') return 'Save'
  if (move.state.type === 'outcome') return 'Create Project'
  return 'Confirm'
})

function onConfirm() {
  if (!isValid.value) return
  if (move.state.onConfirm) move.state.onConfirm()
}

// Auto-focus inputs when modal opens
watch(() => move.state.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      if (move.state.type === 'schedule' && dateTimeInput.value) {
        dateTimeInput.value.focus()
      } else if (move.state.type === 'waiting' && waitingInput.value) {
        waitingInput.value.focus()
      } else if (move.state.type === 'outcome' && outcomeInput.value) {
        outcomeInput.value.focus()
      }
    })
  }
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  padding-bottom: 48px;
  justify-content: center;
  z-index: 99998;
}

.dialog {
  background: var(--color-bg-primary);
  border-radius: 12px;
  padding: 24px;
  min-width: 320px;
  max-width: 600px;
  box-shadow: var(--shadow-modal);
}

.title {
  margin: 0 0 16px;
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .form-group :deep(.dti) {
    flex-direction: column;
    align-items: stretch;
  }

  .form-group :deep(.dti-field--time) {
    width: 100%;
  }

  .form-group :deep(.dur),
  .form-group :deep(.dur-field) {
    width: 100%;
    box-sizing: border-box;
  }
}

.input {
  width: 100%;
  color: var(--color-text-primary);
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.input--textarea {
  resize: vertical;
  min-height: 80px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
