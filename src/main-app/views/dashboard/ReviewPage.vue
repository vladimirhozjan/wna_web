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
          <template v-if="settingsFailed">
            <span class="review-error text-body-s">Couldn't load your review progress.</span>
            <Btn variant="secondary" size="sm" @click="settings.load()">Retry</Btn>
          </template>
          <Btn v-else-if="!inReview" variant="primary" size="md" :loading="!settings.state.loaded || starting" @click="onStart">
            Start Review
          </Btn>
          <Btn v-else variant="primary" size="md" :disabled="!allStepsComplete" :loading="completing" @click="onComplete">
            Complete Review
          </Btn>
        </div>

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
            class="review-celebration"
            title="Review Complete"
            subtitle="Your system is current."
            @dismiss="celebrating = false"
        />

        <div v-else class="card review-card" :class="{ 'review-card--disabled': !inReview }">
          <div class="card-header review-card-header">
            <span class="review-card-title">Review Steps</span>

          </div>
          <div class="review-steps">
            <div
                v-for="(step, index) in reviewSteps"
                :key="index"
                :ref="el => { stepEls[index] = el }"
                class="review-step"
                :class="{ 'review-step--checked': steps[index] }"
            >
              <label class="review-step__checkbox">
                <input
                    type="checkbox"
                    :checked="steps[index]"
                    :disabled="!inReview || completing"
                    @change="onToggle(index)"
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
              <div v-if="step.statsKey === 'calendar' && inReview" class="review-step__lists">
                <div v-for="list in calendarLists" :key="list.label" class="review-list">
                  <span class="text-overline review-list__label">{{ list.label }}</span>
                  <div v-if="list.state.error" class="review-list__state text-body-s">
                    <span>{{ list.errorText }}</span>
                    <Btn variant="secondary" size="sm" @click="list.retry">Retry</Btn>
                  </div>
                  <p v-else-if="!list.state.loading && list.state.items.length === 0" class="review-list__state review-list__empty text-body-s">
                    {{ list.emptyText }}
                  </p>
                  <ItemList
                      v-else
                      v-model="list.state.items"
                      :loading="list.state.loading"
                      :disabled="true"
                      :editable="false"
                      :no-checkbox="true"
                      @click="onActionClick"
                  >
                    <template #subtitle="{ item }">
                      <MetadataRow :item="item" entity-type="action" />
                    </template>
                    <template #actions><span></span></template>
                  </ItemList>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import Btn from '../../components/Btn.vue'
import TipTricks from '../../components/TipTricks.vue'
import ItemList from '../../components/ItemList.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import Celebration from '../../components/Celebration.vue'
import { reviewModel } from '../../scripts/models/reviewModel.js'
import { settingsModel } from '../../scripts/models/settingsModel.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import { recurringModel } from '../../scripts/models/recurringModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'

const router = useRouter()
const toaster = errorModel()
const settings = settingsModel()
const { stats } = statsModel()
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
  lastWeek,
  upcoming,
  startReview,
  toggleStep,
  completeReview,
  loadCalendarLists,
  loadLastWeek,
  loadUpcoming,
  setTemplateId,
} = reviewModel()

const setupTip = ref(null)
const creatingReminder = ref(false)
const celebrating = ref(false)
const stepEls = []

const reviewSteps = [
  { title: 'Empty your Inbox', hint: 'Process all items — clarify, delegate, or delete', statsKey: 'inbox', route: 'inbox' },
  { title: 'Review Next Actions', hint: 'Still relevant? Move stale ones to Someday or Trash', statsKey: 'next', route: 'next' },
  { title: 'Review Waiting For', hint: 'Follow up on delegated items. Any responses?', statsKey: 'waiting', route: 'waiting-for' },
  { title: 'Review Projects', hint: 'Does each have a next action? Any stuck?', statsKey: 'projects', route: 'projects' },
  { title: 'Review Someday/Maybe', hint: 'Anything ready to activate? Anything to delete?', statsKey: 'someday', route: 'someday' },
  { title: 'Review Calendar', hint: 'Anything left from last week? Any prep needed for what\'s coming?', statsKey: 'calendar', route: 'calendar' },
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

const calendarLists = computed(() => [
  {
    label: 'Last 7 days — still open',
    state: lastWeek.value,
    errorText: 'Couldn\'t load last week\'s actions.',
    emptyText: 'Nothing left open from last week.',
    retry: loadLastWeek,
  },
  {
    label: 'Next 14 days',
    state: upcoming.value,
    errorText: 'Couldn\'t load upcoming actions.',
    emptyText: 'Nothing scheduled for the next 14 days.',
    retry: loadUpcoming,
  },
])

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

function scrollToStep(index) {
  stepEls[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

function onActionClick(item) {
  router.push({ name: 'action-detail', params: { id: item.id }, query: { from: 'review' } })
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

watch(inReview, (active) => {
  if (active) loadCalendarLists()
}, { immediate: true })
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
  flex-wrap: wrap;
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

.review-step__lists {
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-left: 32px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-list__label,
.review-list__empty {
  color: var(--color-text-secondary);
}

.review-list__state {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.review-error {
  color: var(--color-text-secondary);
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
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
}

.review-progress__segment--filled {
  background: var(--color-action);
}

.review-progress__count {
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.review-celebration {
  padding: 64px 24px;
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

  .review-step__lists {
    padding-left: 0;
  }
}
</style>
