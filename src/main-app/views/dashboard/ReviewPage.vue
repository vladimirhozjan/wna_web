<template>
  <DashboardLayout>
    <div class="review-page">

      <div class="review-header">
        <h1 class="text-h1 color-text-primary">Weekly Review</h1>
        <p class="review-last text-body-s">{{ lastReviewedText }}</p>
      </div>

      <div class="review-body">

        <GtdTip
            v-if="!hasReminder"
            ref="setupTip"
            storage-key="tip_review_setup"
            :dismissible="true"
        >
          <div class="tip-content">
            <p>Set up a recurring reminder so you never miss a weekly review.</p>
            <Btn variant="primary" size="sm" :loading="creatingReminder" @click="createReminder">
              Create reminder
            </Btn>
          </div>
        </GtdTip>

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
              <span class="review-step__title text-body-m">{{ step.title }}</span>
              <span class="review-step__hint text-body-s">{{ step.hint }}</span>
            </div>
            <span v-if="stepCount(step.statsKey) != null" class="review-step__count text-footnote">
              {{ stepCount(step.statsKey) }}
            </span>
            <router-link :to="{ name: step.route }" class="review-step__go text-body-s">
              Go
            </router-link>
          </div>
        </div>

        <div v-if="inReview" class="review-progress text-body-s">
          {{ completedCount }} of {{ reviewSteps.length }} complete
        </div>

        <div class="review-actions">
          <Btn v-if="!inReview" variant="primary" @click="startReview">
            Start Review
          </Btn>
          <Btn v-else variant="primary" :disabled="!allStepsComplete" @click="onComplete">
            Complete Review
          </Btn>
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
import GtdTip from '../../components/GtdTip.vue'
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
  padding: 10px;
}

.review-header h1 {
  margin: 0;
}

.review-last {
  color: var(--color-text-tertiary);
  margin: 4px 0 0 0;
}

.review-body {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 10px 24px;
}

.tip-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.tip-content p {
  margin: 0;
}

/* ── Steps ── */
.review-steps {
  display: flex;
  flex-direction: column;
}

.review-step {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  transition: border-color 0.15s ease;
  border-left: 3px solid transparent;
}

.review-step--checked {
  border-left-color: var(--color-success);
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
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-success);
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
  font-weight: 600;
  color: var(--color-text-primary);
}

.review-step__hint {
  color: var(--color-text-secondary);
}

.review-step__count {
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.review-step__go {
  flex-shrink: 0;
  color: var(--color-link-text);
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 4px;
}

.review-step__go:hover {
  color: var(--color-link-hover);
  background: var(--color-bg-secondary);
}

/* ── Progress ── */
.review-progress {
  padding: 12px 0;
  color: var(--color-text-secondary);
  text-align: center;
}

/* ── Actions ── */
.review-actions {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .review-step {
    padding: 12px 8px;
    gap: 8px;
  }

  .review-step__hint {
    display: none;
  }
}
</style>
