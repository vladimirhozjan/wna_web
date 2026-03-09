import { ref, computed } from 'vue'
import apiClient from '../core/apiClient.js'
import { statsModel } from './statsModel.js'
import { reviewModel } from './reviewModel.js'
import { settingsModel } from './settingsModel.js'

const topToday = ref([])
const topActions = ref([])
const topWaiting = ref([])
const stuckProjects = ref([])
const loading = ref(false)

export function engageModel() {

    const { stats, setStats } = statsModel()
    const review = reviewModel()
    const settings = settingsModel()

    async function loadDashboard({ tags = null } = {}) {
        loading.value = true
        try {
            const tagsParam = tags?.length ? tags.join(',') : null
            const data = await apiClient.getEngage({ tags: tagsParam })

            setStats(data.stats)
            topToday.value = data.today || []
            topActions.value = data.next || []
            topWaiting.value = data.waiting || []

            const allProjects = data.projects || []
            stuckProjects.value = allProjects.filter(p => !p.next_action_id)
        } finally {
            loading.value = false
        }
    }

    const reviewEnabled = computed(() => settings.state.reviewEnabled)

    return {
        stats,
        topToday,
        topActions,
        topWaiting,
        stuckProjects,
        loading,
        loadDashboard,
        daysSinceReview: review.daysSinceReview,
        isReviewOverdue: review.isOverdue,
        reviewEnabled,
    }
}
