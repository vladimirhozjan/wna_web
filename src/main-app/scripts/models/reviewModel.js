import { ref, computed } from 'vue'
import { settingsModel } from './settingsModel.js'
import { listCalendar } from '../core/apiClient.js'
import { formatDate, subDays, addDays } from '../core/dateUtils.js'

const STEP_COUNT = 6
const LOOKBACK_DAYS = 7
const LOOKAHEAD_DAYS = 14

const lastWeek = ref({ items: [], loading: false, error: null })
const upcoming = ref({ items: [], loading: false, error: null })

function today() {
    return new Date().toISOString().split('T')[0]
}

async function loadWindow(list, start, end) {
    list.value.loading = true
    list.value.error = null
    try {
        const data = await listCalendar({ start: formatDate(start), end: formatDate(end) })
        list.value.items = data.items || []
    } catch (err) {
        list.value.error = err
    } finally {
        list.value.loading = false
    }
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
    const steps = computed(() => inProgress.value?.steps ?? Array(STEP_COUNT).fill(false))
    const allStepsComplete = computed(() => steps.value.every(Boolean))
    const completing = computed(() => settings.state.saving.reviewLastDate)

    function startReview() {
        return settings.setReviewInProgress({ started_at: today(), steps: Array(STEP_COUNT).fill(false) })
    }

    function toggleStep(index) {
        const next = [...steps.value]
        next[index] = !next[index]
        return settings.setReviewInProgress({ ...inProgress.value, steps: next })
    }

    function completeReview() {
        return settings.completeReview(today())
    }

    function loadCalendarLists() {
        loadLastWeek()
        loadUpcoming()
    }

    function loadLastWeek() {
        const now = new Date()
        return loadWindow(lastWeek, subDays(now, LOOKBACK_DAYS), subDays(now, 1))
    }

    function loadUpcoming() {
        const now = new Date()
        return loadWindow(upcoming, now, addDays(now, LOOKAHEAD_DAYS - 1))
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
        clearTemplateId,
    }
}
