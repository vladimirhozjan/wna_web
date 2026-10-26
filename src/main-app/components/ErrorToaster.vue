<template>
  <div class="toast-wrapper">
    <TransitionGroup tag="div" name="toast" class="toast-inner">
      <div
          v-for="e in error.state.errors"
          :key="e.id"
          class="text-body-s toast"
          :class="`toast--${e.type || 'error'}`"
          :data-testid="e.type === 'undo' ? 'undo-toast' : null"
          @click="e.type !== 'undo' && error.dismiss(e)"
      >
        <SuccessCircleIcon v-if="e.type === 'success'" class="toast__icon" />
        <span class="toast__message">{{ e.message }}</span>
        <button
            v-if="e.type === 'undo'"
            type="button"
            class="text-label fw-semibold toast__undo"
            :disabled="e.undoing"
            data-testid="undo-toast-button"
            @click.stop="error.runUndo()"
        >
          {{ e.undoing ? 'Undoing…' : 'Undo' }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import {errorModel} from "../scripts/core/errorModel.js";
import SuccessCircleIcon from "../assets/SuccessCircleIcon.vue";

const error = errorModel()
</script>

<style scoped>
.toast-wrapper {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
}

.toast-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
}

.toast {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  white-space: nowrap;
}

.toast__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  animation: toast-icon-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes toast-icon-pop {
  0% { transform: scale(0); }
  100% { transform: scale(1); }
}

/* noinspection CssUnusedSymbol - used via dynamic :class binding */
.toast--error {
  background: var(--color-toast-error-bg);
  color: var(--color-toast-error-text);
}

/* noinspection CssUnusedSymbol - used via dynamic :class binding */
.toast--success {
  background: var(--color-toast-success-bg);
  color: var(--color-toast-success-text);
}

/* noinspection CssUnusedSymbol - used via dynamic :class binding */
.toast--undo {
  box-sizing: border-box;
  min-width: 320px;
  max-width: 560px;
  gap: 16px;
  padding: 10px 8px 10px 16px;
  border-radius: 8px;
  background: var(--color-bg-dark);
  color: var(--color-text-on-dark);
  box-shadow: var(--shadow-elevated);
  text-align: left;
  cursor: default;
}

.toast--undo .toast__message {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toast__undo {
  position: relative;
  flex-shrink: 0;
  padding: 0 8px;
  border: none;
  background: none;
  color: var(--color-action-medium);
  cursor: pointer;
}

.toast__undo::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: max(100%, var(--touch-target-min));
  height: max(100%, var(--touch-target-min));
  transform: translate(-50%, -50%);
}

.toast__undo:hover:not(:disabled) {
  text-decoration: underline;
}

.toast__undo:disabled {
  cursor: default;
}

@media (max-width: 768px) {
  .toast-wrapper {
    left: 16px;
    right: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: none;
  }

  .toast-inner {
    align-items: stretch;
  }

  .toast {
    white-space: normal;
    text-align: left;
  }

  .toast:not(.toast--undo) .toast__message {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }

  .toast--undo {
    min-width: 0;
    max-width: none;
  }
}

/* noinspection CssUnusedSymbol - used via dynamic :class binding */
.toast--warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

/* noinspection CssUnusedSymbol - Vue TransitionGroup classes */
:global(.toast-enter-from) {
  opacity: 0;
  transform: translateY(10px);
}

/* noinspection CssUnusedSymbol - Vue TransitionGroup classes */
:global(.toast-enter-active),
:global(.toast-leave-active) {
  transition: opacity .25s ease, transform .25s ease;
}

/* noinspection CssUnusedSymbol - Vue TransitionGroup classes */
:global(.toast-enter-to) {
  opacity: 1;
  transform: translateY(0);
}

/* noinspection CssUnusedSymbol - Vue TransitionGroup classes */
:global(.toast-leave-to) {
  opacity: 0;
  transform: scale(0.85);
}
</style>