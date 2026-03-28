<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="confirm.state.visible" class="overlay" @click.self="confirm.state.onCancel" @keyup.esc="confirm.state.onCancel" tabindex="0" ref="overlayRef">
        <div class="dialog">
          <h3 class="text-body-l fw-semibold title">{{ confirm.state.title }}</h3>
          <p class="text-body-m message">{{ confirm.state.message }}</p>
          <div class="actions">
            <Btn variant="ghost" size="sm" @click="confirm.state.onCancel">
              {{ confirm.state.cancelText }}
            </Btn>
            <Btn variant="danger" size="sm" @click="confirm.state.onConfirm">
              {{ confirm.state.confirmText }}
            </Btn>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { confirmModel } from '../scripts/core/confirmModel.js'
import Btn from './Btn.vue'

const confirm = confirmModel()
const overlayRef = ref(null)

watch(() => confirm.state.visible, (visible) => {
  if (visible) nextTick(() => overlayRef.value?.focus())
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
  background: var(--color-popup-background);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  padding: 24px;
  min-width: 300px;
  max-width: 400px;
  box-shadow: var(--shadow-modal);
}

.title {
  margin: 0 0 12px;
  color: var(--color-text-primary);
}

.message {
  margin: 0 0 20px;
  color: var(--color-text-secondary);
  line-height: var(--lh-relaxed);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
