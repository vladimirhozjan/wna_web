<template>
  <div class="clarify-panel" :class="[`clarify-panel--${mode}`]">
    <!-- Header -->
    <div class="clarify-header">
      <h2 class="clarify-header-title">Clarify</h2>
      <button class="clarify-close-btn" @click="onCancel" title="Close">×</button>
    </div>

    <!-- Progress bar -->
    <div class="clarify-progress">
      <div class="clarify-progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>

    <!-- Context - show item being processed -->
    <div class="clarify-context" v-if="stuffItem">
      <span class="clarify-context-label">Processing:</span>
      <span class="clarify-context-title">"{{ stuffItem.title }}"</span>
    </div>

    <!-- Step Content -->
    <div class="clarify-content">
      <ClarifyStepActionable
          v-if="state.step === ClarifyState.ACTIONABLE_DECISION"
          @select="onActionableSelect"
      />
      <ClarifyStepNonActionable
          v-else-if="state.step === ClarifyState.NON_ACTIONABLE_TARGET"
          @select="onNonActionableSelect"
      />
      <ClarifyStepActionCount
          v-else-if="state.step === ClarifyState.ACTION_COUNT_DECISION"
          @select="onActionCountSelect"
      />
      <ClarifyStepCreateAction
          v-else-if="state.step === ClarifyState.CREATE_ACTION"
          :initial-data="state.actionData"
          @submit="onActionSubmit"
      />
      <ClarifyStepCreateProject
          v-else-if="state.step === ClarifyState.CREATE_PROJECT"
          :initial-data="state.projectData"
          @submit="onProjectSubmit"
      />
      <ClarifyStepConfirm
          v-else-if="state.step === ClarifyState.CONFIRM"
          :summary="clarify.getConfirmSummary()"
          :loading="state.loading"
          :error="state.error"
          @confirm="onConfirm"
      />
      <div v-else-if="state.step === ClarifyState.DONE" class="clarify-done">
        <div class="clarify-done-icon">✓</div>
        <p class="clarify-done-text">Item processed successfully!</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="clarify-footer" v-if="showFooter">
      <Btn
          v-if="canGoBack"
          variant="ghost"
          size="sm"
          @click="onBack"
      >
        Back
      </Btn>
      <div class="clarify-footer-spacer"></div>
      <Btn
          variant="ghost"
          size="sm"
          @click="onCancel"
      >
        Cancel
      </Btn>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { clarifyModel, ClarifyState } from '../scripts/clarifyModel.js'
import Btn from './Btn.vue'
import ClarifyStepActionable from './ClarifyStepActionable.vue'
import ClarifyStepNonActionable from './ClarifyStepNonActionable.vue'
import ClarifyStepActionCount from './ClarifyStepActionCount.vue'
import ClarifyStepCreateAction from './ClarifyStepCreateAction.vue'
import ClarifyStepCreateProject from './ClarifyStepCreateProject.vue'
import ClarifyStepConfirm from './ClarifyStepConfirm.vue'

const props = defineProps({
  stuffItem: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: 'inline', // 'inline' | 'modal' | 'fullscreen'
    validator: (v) => ['inline', 'modal', 'fullscreen'].includes(v),
  },
})

const emit = defineEmits(['done', 'cancel'])

const clarify = clarifyModel()
const state = clarify.state

const progress = computed(() => clarify.getProgress())

const showFooter = computed(() => {
  return ![ClarifyState.DONE, ClarifyState.CONFIRM].includes(state.step)
})

const canGoBack = computed(() => {
  return ![
    ClarifyState.ACTIONABLE_DECISION,
    ClarifyState.CONFIRM,
    ClarifyState.DONE,
  ].includes(state.step)
})

onMounted(() => {
  clarify.start(props.stuffItem, props.mode)
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  // Escape to cancel (except on CONFIRM step)
  if (e.key === 'Escape' && state.step !== ClarifyState.CONFIRM) {
    e.preventDefault()
    onCancel()
    return
  }

  // Backspace to go back (when not in input)
  if (e.key === 'Backspace' && canGoBack.value) {
    const activeEl = document.activeElement
    const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA'
    if (!isInput) {
      e.preventDefault()
      onBack()
    }
  }
}

function onActionableSelect(isActionable) {
  clarify.setActionable(isActionable)
}

function onNonActionableSelect(target) {
  clarify.setNonActionableTarget(target)
}

function onActionCountSelect(isSingle) {
  clarify.setSingleAction(isSingle)
}

function onActionSubmit(data) {
  clarify.setActionData(data)
  clarify.proceedToConfirm()
}

function onProjectSubmit(data) {
  clarify.setProjectData(data)
  clarify.proceedToConfirm()
}

async function onConfirm() {
  const success = await clarify.confirm()
  if (success) {
    emit('done', props.stuffItem)
  }
}

function onBack() {
  clarify.back()
}

function onCancel() {
  clarify.cancel()
  emit('cancel')
}
</script>

<style scoped>
.clarify-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg-primary);
}

.clarify-panel--modal {
  border-left: 1px solid var(--color-border-light);
}

.clarify-panel--fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
}

/* Header */
.clarify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.clarify-header-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.clarify-close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  font-size: 20px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 6px;
}

.clarify-close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* Progress */
.clarify-progress {
  height: 4px;
  background: var(--color-bg-secondary);
  flex-shrink: 0;
}

.clarify-progress-bar {
  height: 100%;
  background: var(--color-action);
  transition: width 0.3s ease;
}

/* Context */
.clarify-context {
  padding: 12px 20px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.clarify-context-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  margin-right: 6px;
}

.clarify-context-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  font-weight: 500;
}

/* Content */
.clarify-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
}

/* Done state */
.clarify-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.clarify-done-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-success-light, #dcfce7);
  color: var(--color-success, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
}

.clarify-done-text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
}

/* Footer */
.clarify-footer {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.clarify-footer-spacer {
  flex: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .clarify-header {
    padding: 12px 16px;
  }

  .clarify-context {
    padding: 10px 16px;
  }

  .clarify-content {
    padding: 20px 16px;
  }

  .clarify-footer {
    padding: 12px 16px;
  }
}
</style>
