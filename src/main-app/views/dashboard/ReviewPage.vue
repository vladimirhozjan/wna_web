<template>
    <div class="review-page">

      <div class="review-header">
        <div class="header-row">
          <h1 class="page-title">Weekly Review</h1>
          <div class="header-actions">
            <template v-if="settingsFailed">
              <span class="text-body-s color-text-secondary">Couldn't load your review progress.</span>
              <Btn variant="secondary" size="sm" @click="settings.load()">Retry</Btn>
            </template>
            <Btn v-else-if="!inReview" variant="primary" size="sm" :loading="!settings.state.loaded || starting" @click="onStart">
              Start Review
            </Btn>
            <Btn
                v-else
                variant="primary"
                size="sm"
                :disabled="!allStepsComplete"
                :loading="completing"
                :title="allStepsComplete ? undefined : 'Check all 6 steps to complete the review'"
                @click="onComplete"
            >
              Complete Review
            </Btn>
          </div>
        </div>
        <p class="review-last text-body-s color-text-secondary">{{ lastReviewedText }}</p>
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

        <div v-if="inReview" class="review-progress">
          <div class="review-progress__bar">
            <div
                v-for="(step, index) in reviewSteps"
                :key="index"
                class="review-progress__segment"
                :class="{ 'review-progress__segment--filled': steps[index] }"
                :title="step.title"
                @click="scrollToStep(index)"
            />
          </div>
          <span class="review-progress__count text-body-s">
            {{ completedCount }} of {{ reviewSteps.length }} complete
          </span>
        </div>

        <Celebration
            v-if="celebrating"
            class="card review-celebration"
            title="Review complete"
            subtitle="Your system is current."
            @dismiss="celebrating = false"
        />

        <div v-else class="card review-steps">
          <div
              v-for="(step, index) in reviewSteps"
              :key="index"
              :ref="el => { stepEls[index] = el }"
              class="review-step"
          >
            <div class="review-step__checkbox">
              <AnimatedCheckbox
                  :checked="steps[index]"
                  :disabled="!inReview || completing"
                  @change="onToggle(index)"
              />
            </div>
            <router-link :to="{ name: step.route }" class="review-step__link" :data-testid="`review-step-${index + 1}`">
              <span class="review-step__body">
                <span class="fw-semibold review-step__title">{{ step.title }}</span>
                <span class="review-step__hint text-body-s color-text-secondary">{{ step.hint }}</span>
              </span>
              <ChevronRightIcon class="review-step__chevron" />
            </router-link>
          </div>
        </div>

      </div>

    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import Btn from '../../components/Btn.vue'
import TipTricks from '../../components/TipTricks.vue'
import AnimatedCheckbox from '../../components/AnimatedCheckbox.vue'
import Celebration from '../../components/Celebration.vue'
import ChevronRightIcon from '../../assets/ChevronRightIcon.vue'
import { reviewModel } from '../../scripts/models/reviewModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'
import { recurringModel } from '../../scripts/models/recurringModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const router = useRouter()
const toaster = errorModel()
const settings = settingsModel()
const { createRecurring } = recurringModel()
const {
  steps,
  inReview,
  hasReminder,
  daysSinceReview,
  lastReviewDate,
  allStepsComplete,
  starting,
  completing,
  startReview,
  toggleStep,
  completeReview,
  setTemplateId,
} = reviewModel()

const setupTip = ref(null)
const creatingReminder = ref(false)
const celebrating = ref(false)
const stepEls = []

const reviewSteps = [
  { title: 'Empty your Inbox', hint: 'Process all items — clarify, delegate, or delete', route: 'inbox' },
  { title: 'Review Next Actions', hint: 'Still relevant? Move stale ones to Someday or Trash', route: 'next' },
  { title: 'Review Waiting For', hint: 'Follow up on delegated items. Any responses?', route: 'waiting-for' },
  { title: 'Review Projects', hint: 'Does each have a next action? Any stuck?', route: 'projects' },
  { title: 'Review Someday/Maybe', hint: 'Anything ready to activate? Anything to delete?', route: 'someday' },
  { title: 'Review Calendar', hint: 'Anything left from last week? Any prep needed for what\'s coming?', route: 'calendar' },
]

const lastReviewedText = computed(() => {
  if (!lastReviewDate.value) return 'Never reviewed'
  const days = daysSinceReview.value
  if (days === 0) return 'Last reviewed: today'
  if (days === 1) return 'Last reviewed: yesterday'
  return `Last reviewed: ${days} days ago`
})

const completedCount = computed(() => steps.value.filter(Boolean).length)

const settingsFailed = computed(() => !settings.state.loaded && !settings.state.loading && !!settings.state.error)

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

function scrollToStep(index) {
  stepEls[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

async function onStart() {
  celebrating.value = false
  try {
    await startReview()
  } catch {
    toaster.push('Couldn\'t start the review. Try again.')
  }
}

async function onToggle(index) {
  try {
    await toggleStep(index)
  } catch {
    toaster.push('Couldn\'t save this step. Try again.')
  }
}

async function onComplete() {
  try {
    await completeReview()
    celebrating.value = true
  } catch {
    toaster.push('Couldn\'t complete the review. Try again.')
  }
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

.header-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-header h1 {
  margin: 0;
}

.review-last {
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
  touch-action: pan-y;
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

/* ── Steps ── */
.review-steps {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin-bottom: 0;
}

.review-step {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--color-border-subtle);
  transition: background 0.15s ease;
}

.review-step:first-child {
  border-top: none;
}

.review-step:hover {
  background: var(--color-bg-row-hover);
}

.review-step__checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  align-self: stretch;
  padding-left: 20px;
}

.review-step__link {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px 18px 16px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
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
  color: var(--color-text-primary-dark);
}

.review-step__chevron {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
}

/* ── Progress ── */
.review-progress {
  display: flex;
  align-items: center;
  gap: 16px;
}

.review-progress__bar {
  flex: 1;
  display: flex;
  gap: 4px;
  min-width: 0;
}

.review-progress__segment {
  position: relative;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border-medium);
  cursor: pointer;
  transition: background 0.15s ease;
}

.review-progress__segment::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: var(--touch-target-min);
  transform: translateY(-50%);
}

.review-progress__segment:hover {
  background: var(--color-bg-hover);
}

.review-progress__segment--filled,
.review-progress__segment--filled:hover {
  background: var(--color-action);
}

.review-progress__count {
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.review-celebration {
  flex-shrink: 0;
  margin-bottom: 0;
  padding: 64px 24px;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .review-step__checkbox {
    padding-left: 8px;
  }

  .review-step__checkbox :deep(.animated-checkbox) {
    position: relative;
  }

  .review-step__checkbox :deep(.animated-checkbox)::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--touch-target-min);
    height: var(--touch-target-min);
    transform: translate(-50%, -50%);
  }

  .review-step__link {
    gap: 8px;
    padding: 14px 8px 14px 12px;
  }

  .review-step__hint {
    font-size: var(--font-size-caption);
    line-height: var(--lh-caption);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
