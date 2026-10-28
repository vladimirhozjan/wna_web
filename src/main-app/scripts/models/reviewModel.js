import { ref, computed } from 'vue'
import { settingsModel } from './settingsModel.js'
import { horizonModel } from './horizonModel.js'
import apiClient from '../core/apiClient.js'

const BASE_STEP_COUNT = 6
// The optional Review horizons step, frozen into the review at Start Review
const HORIZON_STEP = BASE_STEP_COUNT

const pendingTicks = ref([])
const preparingStart = ref(false)
let tickQueue = Promise.resolve()

function today() {
    return new Date().toISOString().split('T')[0]
}

function flipStep(steps, index) {
    return steps.map((done, i) => i === index ? !done : done)
}

export function reviewModel() {

    const settings = settingsModel()

    const reviewTemplateId = computed(() => settings.state.reviewTemplateId)
    const lastReviewDate = computed(() => settings.state.reviewLastDate)

    const hasReminder = computed(() => !!reviewTemplateId.value)

    const daysSinceReview = computed(() => {
        if (!lastReviewDate.value) return null
        const last = new Date(lastReviewDate.value)
        const now = new Date()
        return Math.floor((now - last) / (1000 * 60 * 60 * 24))
    })

    const isOverdue = computed(() => {
        if (!hasReminder.value) return false
        if (!lastReviewDate.value) return true
        return daysSinceReview.value > 7
    })

    const inProgress = computed(() => settings.state.reviewInProgress)
    const inReview = computed(() => !!inProgress.value)
    const savedSteps = computed(() => inProgress.value?.steps ?? Array(BASE_STEP_COUNT).fill(false))
    // Horizons switched off mid-review hides the step; Complete then needs only the six shown
    const horizonLevels = computed(() => settings.state.horizonsEnabled ? (inProgress.value?.horizon_levels ?? []) : [])
    const stepCount = computed(() => horizonLevels.value.length ? savedSteps.value.length : BASE_STEP_COUNT)
    const steps = computed(() => pendingTicks.value.reduce(flipStep, savedSteps.value).slice(0, stepCount.value))
    const allStepsComplete = computed(() => pendingTicks.value.length === 0 && savedSteps.value.slice(0, stepCount.value).every(Boolean))
    const starting = computed(() => !inReview.value && (preparingStart.value || settings.state.saving.reviewInProgress))
    const completing = computed(() => settings.state.saving.reviewLastDate)

    // An optional step never blocks a review: off, nothing due, or a failed read → the six steps
    async function startReview() {
        let dueLevels = []
        if (settings.state.horizonsEnabled) {
            const horizon = horizonModel()
            preparingStart.value = true
            try {
                await horizon.load()
                dueLevels = [...horizon.state.dueLevels]
            } catch { /* six steps */ } finally {
                preparingStart.value = false
            }
        }
        const review = { started_at: today(), steps: Array(BASE_STEP_COUNT + (dueLevels.length ? 1 : 0)).fill(false) }
        if (dueLevels.length) review.horizon_levels = dueLevels
        return settings.setReviewInProgress(review)
    }

    // Ticks save one at a time, each on top of the last accepted steps[], so a failed one can't undo a later one
    function toggleStep(index) {
        pendingTicks.value = [...pendingTicks.value, index]
        const run = tickQueue.then(async () => {
            try {
                // Ticking Review horizons on records the due levels' review date first (idempotent on a retry)
                if (index === HORIZON_STEP && !savedSteps.value[index]) {
                    await apiClient.markHorizonsReviewed(inProgress.value.horizon_levels)
                    horizonModel().refresh()
                }
                await settings.setReviewInProgress({ ...inProgress.value, steps: flipStep(savedSteps.value, index) })
            } finally {
                pendingTicks.value = pendingTicks.value.slice(1)
            }
        })
        tickQueue = run.catch(() => {})
        return run
    }

    function completeReview() {
        return settings.completeReview(today())
    }

    function setTemplateId(id) {
        settings.setReviewTemplateId(id)
    }

    function clearTemplateId() {
        settings.setReviewTemplateId(null)
    }

    return {
        reviewTemplateId,
        lastReviewDate,
        steps,
        horizonLevels,
        inReview,
        hasReminder,
        daysSinceReview,
        isOverdue,
        allStepsComplete,
        starting,
        completing,
        startReview,
        toggleStep,
        completeReview,
        setTemplateId,
        clearTemplateId,
    }
}
