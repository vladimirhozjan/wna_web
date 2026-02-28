<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="move.state.visible" class="overlay" @click.self="move.close">
        <div class="dialog">
          <h3 class="text-h3 title">{{ move.state.title }}</h3>

          <!-- Schedule Modal -->
          <template v-if="move.state.type === 'schedule'">
            <div class="form-group">
              <label class="text-body-s fw-medium label">Date</label>
              <input
                  ref="dateInput"
                  type="date"
                  v-model="move.state.date"
                  class="text-body-m input"
                  @keyup.enter="onConfirm"
                  @keyup.esc="move.close"
              />
            </div>
            <div class="form-group">
              <div class="time-toggle">
                <span
                    v-if="!move.state.showTime"
                    class="text-body-s link"
                    @click="enableTime"
                >Add time</span>
                <template v-else>
                  <input
                      type="time"
                      v-model="move.state.time"
                      class="text-body-m input input--time"
                      @keyup.enter="onConfirm"
                      @keyup.esc="move.close"
                  />
                  <div class="duration-input">
                    <input
                        type="number"
                        v-model.number="move.state.duration"
                        class="text-body-m input input--duration"
                        min="5"
                        step="5"
                        @keyup.enter="onConfirm"
                        @keyup.esc="move.close"
                    />
                    <span class="text-body-s duration-label">min</span>
                  </div>
                </template>
              </div>
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
                  @keyup.esc="move.close"
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
                  @keyup.esc="move.close"
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

const move = moveModel()
const dateInput = ref(null)
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

function enableTime() {
  move.state.showTime = true
  move.state.time = '09:00'
}

// Auto-focus inputs when modal opens
watch(() => move.state.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      if (move.state.type === 'schedule' && dateInput.value) {
        dateInput.value.focus()
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
  max-width: 400px;
  box-shadow: var(--shadow-modal);
}

.title {
  margin: 0 0 16px;
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.label {
  display: block;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
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

.input--time {
  width: 120px;
}

.input--duration {
  width: 70px;
  text-align: center;
}

.time-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.link {
  color: var(--color-link-text);
  cursor: pointer;
}

.link:hover {
  color: var(--color-link-hover);
  text-decoration: underline;
}

.duration-input {
  display: flex;
  align-items: center;
  gap: 4px;
}

.duration-label {
  color: var(--color-text-secondary);
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
