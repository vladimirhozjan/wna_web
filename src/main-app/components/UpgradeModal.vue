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
            <p v-if="paymentsEnabled" class="text-body-s color-text-secondary hint">
              You can upgrade your plan anytime from Settings.
            </p>
            <p v-else class="text-body-s color-text-secondary hint">
              WhatsNextAction is currently in beta and self-service upgrades aren't available yet. To enable Team features on your account, please contact <a class="hint-link" href="mailto:support@whatsnextaction.com?subject=Team%20plan%20access">support@whatsnextaction.com</a>.
            </p>
          </div>
          <div class="dialog-actions">
            <button v-if="paymentsEnabled" type="button" class="btn-ghost text-body-s" @click="upgrade.close()">Not now</button>
            <button v-if="paymentsEnabled" type="button" class="btn-close text-body-s" @click="goToPlans">View plans</button>
            <button v-else type="button" class="btn-close text-body-s" @click="upgrade.close()">Got it</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { upgradeModel } from '../scripts/core/upgradeModel.js'
import { flagsModel } from '../scripts/core/flagsModel.js'

const upgrade = upgradeModel()
const { paymentsEnabled } = flagsModel()
const router = useRouter()

function goToPlans() {
  upgrade.close()
  router.push({ path: '/settings', query: { section: 'plan' } })
}
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

.hint-link {
  color: var(--color-action);
  text-decoration: none;
}

.hint-link:hover {
  text-decoration: underline;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 24px 24px;
}

.btn-ghost {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid var(--color-border-light);
  background: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.btn-ghost:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
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
