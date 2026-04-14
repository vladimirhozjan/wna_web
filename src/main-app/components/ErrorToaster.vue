<template>
  <div class="toast-wrapper">
    <TransitionGroup tag="div" name="toast" class="toast-inner">
      <div
          v-for="e in error.state.errors"
          :key="e.id"
          class="text-body-s toast"
          :class="`toast--${e.type || 'error'}`"
          @click="error.remove(e.id)"
      >
        <SuccessCircleIcon v-if="e.type === 'success'" class="toast__icon" />
        {{ e.message }}
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
  position: relative;
}

.toast {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  margin-bottom: 10px;
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