<template>
  <div class="clarify-panel" :class="[`clarify-panel--${mode}`]">
    <!-- Header -->
    <div class="clarify-header">
      <h2 class="clarify-header-title">Clarify</h2>
      <div class="clarify-header-nav">
        <button
            v-if="canGoBack"
            class="clarify-nav-btn"
            @click="onBack"
            title="Back"
        >&lt;</button>
        <span class="clarify-step-indicator">{{ currentStepNumber }}/{{ totalSteps }}</span>
        <button class="clarify-nav-btn" @click="onCancel" title="Close">×</button>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="clarify-progress">
      <div class="clarify-progress-bar" :style="{ width: `${progress}%` }"></div>
    </div>

    <!-- Context - show item being processed -->
    <div class="clarify-context" v-if="stuffItem">
      <span class="clarify-context-label">Processing:</span>
      <span class="clarify-context-title">{{ stuffItem.title }}</span>
    </div>

    <!-- Step Content -->
    <div class="clarify-content">
      <ClarifyStepActionable
          v-if="state.step === ClarifyState.ACTIONABLE_DECISION"
          @select="onActionableSelect"
      />
      <ClarifyStepNonActionable
          v-else-if="state.step === ClarifyState.NON_ACTIONABLE_TARGET"
          :loading="state.loading"
          @select="onNonActionableSelect"
      />
      <ClarifyStepActionCount
          v-else-if="state.step === ClarifyState.ACTION_COUNT_DECISION"
          @select="onActionCountSelect"
      />
      <ClarifyStepTwoMinute
          v-else-if="state.step === ClarifyState.TWO_MINUTE_DECISION"
          @select="onTwoMinuteSelect"
      />
      <ClarifyStepCreateAction
          v-else-if="state.step === ClarifyState.CREATE_ACTION"
          :initial-data="state.actionData"
          :loading="state.loading"
          @submit="onActionSubmit"
      />
      <ClarifyStepCreateProject
          v-else-if="state.step === ClarifyState.CREATE_PROJECT"
          :initial-data="state.projectData"
          :loading="state.loading"
          @submit="onProjectSubmit"
      />
      <ClarifyStepDoItNow
          v-else-if="state.step === ClarifyState.DO_IT_NOW"
          :title="state.stuffItem?.title"
          :loading="state.loading"
          @done="onDoItNowDone"
      />
      <div v-else-if="state.step === ClarifyState.DONE" class="clarify-done">
        <div class="clarify-done-icon">✓</div>
        <p class="clarify-done-text">Item processed successfully!</p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { clarifyModel, ClarifyState, NonActionableTarget } from '../../scripts/models/clarifyModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import ClarifyStepActionable from './ClarifyStepActionable.vue'
import ClarifyStepNonActionable from './ClarifyStepNonActionable.vue'
import ClarifyStepActionCount from './ClarifyStepActionCount.vue'
import ClarifyStepTwoMinute from './ClarifyStepTwoMinute.vue'
import ClarifyStepCreateAction from './ClarifyStepCreateAction.vue'
import ClarifyStepCreateProject from './ClarifyStepCreateProject.vue'
import ClarifyStepDoItNow from './ClarifyStepDoItNow.vue'

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
const toaster = errorModel()

// Show errors as toast
watch(() => state.error, (err) => {
  if (!err) return
  toaster.push(err)
})

const progress = computed(() => clarify.getProgress())

const canGoBack = computed(() => {
  return ![
    ClarifyState.ACTIONABLE_DECISION,
    ClarifyState.DONE,
  ].includes(state.step)
})

const totalSteps = computed(() => {
  if (state.isActionable === false) return 2
  if (state.isSingleAction === true) return 4 // actionable → count → two-minute → create/do-it-now
  if (state.isSingleAction === false) return 3 // actionable → count → project
  return 3 // default before single/project decision
})

const currentStepNumber = computed(() => {
  switch (state.step) {
    case ClarifyState.ACTIONABLE_DECISION:
      return 1
    case ClarifyState.NON_ACTIONABLE_TARGET:
      return 2
    case ClarifyState.ACTION_COUNT_DECISION:
      return 2
    case ClarifyState.TWO_MINUTE_DECISION:
      return 3
    case ClarifyState.CREATE_ACTION:
    case ClarifyState.DO_IT_NOW:
      return 4
    case ClarifyState.CREATE_PROJECT:
      return 3
    case ClarifyState.DONE:
      return totalSteps.value
    default:
      return 1
  }
})

onMounted(() => {
  // Only start if not already in progress (avoids reset on mobile/desktop switch)
  if (state.step === ClarifyState.IDLE || state.stuffItem?.id !== props.stuffItem.id) {
    clarify.start(props.stuffItem, props.mode)
  }
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e) {
  // Escape to cancel (except during loading or do-it-now)
  if (e.key === 'Escape' && !state.loading && state.step !== ClarifyState.DO_IT_NOW) {
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

async function onNonActionableSelect(target) {
  clarify.setNonActionableTarget(target)
  await executeConfirm()
}

function onActionCountSelect(isSingle) {
  clarify.setSingleAction(isSingle)
}

async function onActionSubmit(data) {
  clarify.setActionData(data)
  await executeConfirm()
}

function onTwoMinuteSelect(canDoNow) {
  clarify.setTwoMinuteDecision(canDoNow)
}

async function onDoItNowDone() {
  const success = await clarify.doItNow()
  if (success) {
    const title = truncateTitle(props.stuffItem.title)
    toaster.success(`"${title}" done`)
    emit('done', props.stuffItem)
  }
}

async function onProjectSubmit(data) {
  clarify.setProjectData(data)
  await executeConfirm()
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

async function executeConfirm() {
  const success = await clarify.confirm()
  if (success) {
    const title = truncateTitle(props.stuffItem.title)

    if (!state.isActionable) {
      switch (state.nonActionableTarget) {
        case NonActionableTarget.REFERENCE:
          toaster.success(`"${title}" moved to Reference`)
          break
        case NonActionableTarget.SOMEDAY:
          toaster.success(`"${title}" moved to Someday`)
          break
        case NonActionableTarget.TRASH:
          toaster.success(`"${title}" moved to trash`)
          break
      }
    } else if (state.isSingleAction) {
      toaster.success(`"${title}" converted to action`)
    } else {
      toaster.success(`"${title}" converted to project`)
    }

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
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.clarify-header-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.clarify-header-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.clarify-nav-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  font-size: var(--font-size-md);
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: 4px;
}

.clarify-nav-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.clarify-step-indicator {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  min-width: 28px;
  text-align: center;
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
  padding: 16px 20px;
  flex-shrink: 0;
  text-align: center;
}

.clarify-context-label {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  display: block;
  margin-bottom: 4px;
}

.clarify-context-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
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
  background: var(--color-success-light);
  color: var(--color-success);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-2xl);
  margin-bottom: 16px;
}

.clarify-done-text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .clarify-context {
    padding: 10px 16px;
  }

  .clarify-content {
    padding: 20px 16px;
  }
}
</style>
