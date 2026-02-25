import { ref, computed } from 'vue'
import { settingsModel } from './settingsModel.js'

const steps = ref([false, false, false, false, false, false])
const inReview = ref(false)

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

    const allStepsComplete = computed(() => steps.value.every(Boolean))

    function startReview() {
        inReview.value = true
        steps.value = [false, false, false, false, false, false]
    }

    function toggleStep(index) {
        steps.value[index] = !steps.value[index]
    }

    function completeReview() {
        const now = new Date().toISOString().split('T')[0]
        settings.setReviewLastDate(now)
        inReview.value = false
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
        startReview,
        toggleStep,
        completeReview,
        setTemplateId,
        clearTemplateId,
    }
}
