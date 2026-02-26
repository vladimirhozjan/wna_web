<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="move.state.visible" class="overlay" @click.self="move.close">
        <div class="dialog">
          <h3 class="title">{{ move.state.title }}</h3>

          <!-- Schedule Modal -->
          <template v-if="move.state.type === 'schedule'">
            <div class="form-group">
              <label class="label">Date</label>
              <input
                  ref="dateInput"
                  type="date"
                  v-model="move.state.date"
                  class="input"
                  @keyup.enter="onConfirm"
                  @keyup.esc="move.close"
              />
            </div>
            <div class="form-group">
              <div class="time-toggle">
                <span
                    v-if="!move.state.showTime"
                    class="link"
                    @click="enableTime"
                >Add time</span>
                <template v-else>
                  <input
                      type="time"
                      v-model="move.state.time"
                      class="input input--time"
                      @keyup.enter="onConfirm"
                      @keyup.esc="move.close"
                  />
                  <div class="duration-input">
                    <input
                        type="number"
                        v-model.number="move.state.duration"
                        class="input input--duration"
                        min="5"
                        step="5"
                        @keyup.enter="onConfirm"
                        @keyup.esc="move.close"
                    />
                    <span class="duration-label">min</span>
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
                  class="input"
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
                  class="input input--textarea"
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
  background: rgba(0, 0, 0, 0.5);
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
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

.title {
  margin: 0 0 16px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.label {
  display: block;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
}

.input {
  width: 100%;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
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
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
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
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
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
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
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
