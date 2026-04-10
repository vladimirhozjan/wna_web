<template>
  <DashboardLayout>
    <div class="review-page">

      <div class="review-header">
        <h1 class="page-title">Weekly Review</h1>
        <p class="review-last text-body-s">{{ lastReviewedText }}</p>
      </div>

      <div class="review-body">

        <TipTricks
            v-if="!hasReminder"
            ref="setupTip"
            storage-key="tip_review_setup"
            :dismissible="true"
        >
          <div class="tip-content">
            <p>Set up a recurring reminder so you never miss a weekly review.</p>
            <Btn variant="outline" size="sm" :loading="creatingReminder" @click="createReminder">
              Create reminder
            </Btn>
          </div>
        </TipTricks>

        <div class="review-actions">
          <Btn v-if="!inReview" variant="primary" size="md" @click="startReview">
            Start Review
          </Btn>
          <Btn v-else variant="primary" size="md" :disabled="!allStepsComplete" @click="onComplete">
            Complete Review
          </Btn>
          <span v-if="inReview" class="review-progress text-body-s">
            {{ completedCount }} of {{ reviewSteps.length }} complete
          </span>
        </div>

        <div class="card review-card" :class="{ 'review-card--disabled': !inReview }">
          <div class="card-header review-card-header">
            <span class="review-card-title">Review Steps</span>

          </div>
          <div class="review-steps">
            <div
                v-for="(step, index) in reviewSteps"
                :key="index"
                class="review-step"
                :class="{ 'review-step--checked': steps[index] }"
            >
              <label class="review-step__checkbox">
                <input
                    type="checkbox"
                    :checked="steps[index]"
                    :disabled="!inReview"
                    @change="toggleStep(index)"
                />
              </label>
              <div class="review-step__body">
                <span class="fw-semibold review-step__title">{{ step.title }}</span>
                <span class="review-step__hint text-body-s">{{ step.hint }}</span>
              </div>
              <span v-if="stepCount(step.statsKey) != null" class="review-step__count text-footnote">
                {{ stepCount(step.statsKey) }}
              </span>
              <Btn variant="outline" size="sm" class="review-step__go" @click="router.push({ name: step.route })">
                Go
              </Btn>
            </div>
          </div>
        </div>


      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import TipTricks from '../../components/TipTricks.vue'
import { reviewModel } from '../../scripts/models/reviewModel.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { recurringModel } from '../../scripts/models/recurringModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const router = useRouter()
const toaster = errorModel()
const { stats } = statsModel()
const { createRecurring } = recurringModel()
const {
  steps,
  inReview,
  hasReminder,
  daysSinceReview,
  lastReviewDate,
  allStepsComplete,
  startReview,
  toggleStep,
  completeReview,
  setTemplateId,
} = reviewModel()

const setupTip = ref(null)
const creatingReminder = ref(false)

const reviewSteps = [
  { title: 'Empty your Inbox', hint: 'Process all items — clarify, delegate, or delete', statsKey: 'inbox', route: 'inbox' },
  { title: 'Review Next Actions', hint: 'Still relevant? Move stale ones to Someday or Trash', statsKey: 'next', route: 'next' },
  { title: 'Review Waiting For', hint: 'Follow up on delegated items. Any responses?', statsKey: 'waiting', route: 'waiting-for' },
  { title: 'Review Projects', hint: 'Does each have a next action? Any stuck?', statsKey: 'projects', route: 'projects' },
  { title: 'Review Someday/Maybe', hint: 'Anything ready to activate? Anything to delete?', statsKey: 'someday', route: 'someday' },
  { title: 'Review Calendar', hint: 'Check upcoming week. Any prep needed?', statsKey: 'calendar', route: 'calendar' },
]

const lastReviewedText = computed(() => {
  if (!lastReviewDate.value) return 'Never reviewed'
  const days = daysSinceReview.value
  if (days === 0) return 'Last reviewed: today'
  if (days === 1) return 'Last reviewed: yesterday'
  return `Last reviewed: ${days} days ago`
})

const completedCount = computed(() => steps.value.filter(Boolean).length)

function stepCount(key) {
  const val = stats.value?.[key]?.count
  return val != null ? val : null
}

async function createReminder() {
  creatingReminder.value = true
  try {
    const created = await createRecurring({
      title: 'Weekly Review',
      recurrence_rule: 'FREQ=WEEKLY;BYDAY=FR',
      scheduled_time: '09:00',
      scheduled_duration: 60,
    })
    setTemplateId(created.id)
    setupTip.value?.dismiss()
    toaster.success('Weekly review reminder created')
    router.push({ name: 'recurring-detail', params: { id: created.id } })
  } catch (err) {
    toaster.push(err.message || 'Failed to create reminder')
  } finally {
    creatingReminder.value = false
  }
}

function onComplete() {
  completeReview()
  toaster.success('Weekly review completed!')
}
</script>

<style scoped>
.review-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.review-header {
  flex-shrink: 0;
  padding: 0;
}

.review-header h1 {
  margin: 0;
}

.review-last {
  color: var(--color-text-secondary);
  margin: 2px 0 24px 0;
}

.review-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tip-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.tip-content :deep(.btn) {
  min-width: 169px;
}

.tip-content p {
  margin: 0;
  font-size: var(--font-size-body-s);
}

/* ── Actions ── */
.review-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* ── Card ── */
.review-card {
  border: 1px solid var(--color-border-light);
  border-radius: var(--card-radius);
}

.review-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
}

.review-card-title {
  font-size: var(--font-size-overline);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-default);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-action);
}

.review-card--disabled .review-steps {
  opacity: 0.5;
  pointer-events: none;
}

/* ── Steps ── */
.review-steps {
  display: flex;
  flex-direction: column;
}

.review-step {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-top: 1px solid var(--color-border-subtle);
  transition: background 0.15s ease;
}

.review-step:hover {
  background: var(--color-bg-hover);
}

.review-step--checked {
  background: var(--color-bg-subtle);
}

.review-step--checked .review-step__title,
.review-step--checked .review-step__hint {
  opacity: 0.5;
}

.review-step__checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.review-step__checkbox input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-action);
  border-radius: 4px;
}

.review-step__checkbox input:disabled {
  cursor: default;
  opacity: 0.4;
}

.review-step__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.review-step__title {
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary-dark);
}

.review-step__hint {
  color: var(--color-text-secondary);
  font-size: var(--font-size-caption);
}

.review-step__count {
  flex-shrink: 0;
  color: var(--color-action);
  background: var(--color-bg-accent-light);
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-medium);
}

.review-step__go {
  flex-shrink: 0;
}

/* ── Progress ── */
.review-progress {
  color: var(--color-text-secondary);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .review-step {
    padding: 14px 8px;
    gap: 8px;
  }

  .review-step__hint {
    display: none;
  }
}
</style>
