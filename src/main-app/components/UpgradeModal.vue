<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="upgrade.state.visible" class="overlay" @click.self="upgrade.close()">
        <div class="dialog">
          <div class="dialog-header">
            <h3 class="text-body-l fw-semibold title">Upgrade Your Plan</h3>
            <button type="button" class="close-btn" @click="upgrade.close()" aria-label="Close">&times;</button>
          </div>
          <div class="dialog-body">
            <p class="text-body-m message">{{ upgrade.state.message }}</p>
            <p class="text-body-s color-text-secondary hint">
              Visit your account settings to upgrade your plan.
            </p>
          </div>
          <div class="dialog-actions">
            <button type="button" class="btn-close text-body-s" @click="upgrade.close()">Got it</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { upgradeModel } from '../scripts/core/upgradeModel.js'

const upgrade = upgradeModel()
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99998;
}

.dialog {
  background: var(--color-bg-primary);
  border-radius: 12px;
  min-width: 320px;
  max-width: 420px;
  width: 90vw;
  box-shadow: var(--shadow-modal);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.title {
  margin: 0;
  color: var(--color-text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 4px;
}

.close-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.dialog-body {
  padding: 24px 24px;
}

.message {
  margin: 0 0 16px;
  color: var(--color-text-primary);
}

.hint {
  margin: 0;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 8px 24px 24px;
}

.btn-close {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  background: var(--color-action);
  color: var(--color-btn-primary-text);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-close:hover {
  background: var(--color-action-dark);
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
