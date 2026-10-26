import { ref, computed } from 'vue'
import { settingsModel } from './settingsModel.js'

const STEP_COUNT = 6

const pendingTicks = ref([])
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
    const savedSteps = computed(() => inProgress.value?.steps ?? Array(STEP_COUNT).fill(false))
    const steps = computed(() => pendingTicks.value.reduce(flipStep, savedSteps.value))
    const allStepsComplete = computed(() => pendingTicks.value.length === 0 && savedSteps.value.every(Boolean))
    const starting = computed(() => !inReview.value && settings.state.saving.reviewInProgress)
    const completing = computed(() => settings.state.saving.reviewLastDate)

    function startReview() {
        return settings.setReviewInProgress({ started_at: today(), steps: Array(STEP_COUNT).fill(false) })
    }

    // Ticks save one at a time, each on top of the last accepted steps[], so a failed one can't undo a later one
    function toggleStep(index) {
        pendingTicks.value = [...pendingTicks.value, index]
        const run = tickQueue.then(async () => {
            try {
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
