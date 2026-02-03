<template>
  <div class="toast-wrapper">
    <TransitionGroup tag="div" name="toast" class="toast-inner">
      <div
          v-for="e in error.state.errors"
          :key="e.id"
          class="toast"
          :class="`toast--${e.type || 'error'}`"
          @click="error.remove(e.id)"
      >
        {{ e.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import {errorModel} from "../scripts/errorModel.js";

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
  display: block;
  text-align: center;
}

.toast {
  display: inline-block;
  padding: 8px 12px;
  border-radius: 6px;
  text-align: center;
  font-family: var(--font-family-default), serif;
  font-size: var(--font-size-body-s);
  line-height: var(--lh-body-s);
  font-weight: 400;
  margin-bottom: 10px;
  cursor: pointer;
}

.toast--error {
  background: var(--color-toast-error-bg);
  color: var(--color-toast-error-text);
}

.toast--success {
  background: var(--color-toast-success-bg);
  color: var(--color-toast-success-text);
}

:global(.toast-enter-from) {
  opacity: 0;
  transform: translateY(10px);
}

:global(.toast-enter-active),
:global(.toast-leave-active),
:global(.toast-move) {
  transition: all .25s ease;
}

:global(.toast-enter-to) {
  opacity: 1;
  transform: translateY(0);
}

:global(.toast-leave-to) {
  opacity: 0;
  transform: translateY(10px);
}
</style>