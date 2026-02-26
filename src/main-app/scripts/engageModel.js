import { ref, computed } from 'vue'
import apiClient from './apiClient.js'
import { statsModel } from './statsModel.js'
import { reviewModel } from './reviewModel.js'
import { settingsModel } from './settingsModel.js'

const topToday = ref([])
const topActions = ref([])
const topWaiting = ref([])
const stuckProjects = ref([])
const loading = ref(false)

export function engageModel() {

    const { stats, loadStats } = statsModel()
    const review = reviewModel()
    const settings = settingsModel()

    async function loadDashboard({ tags = null } = {}) {
        loading.value = true
        try {
            const tagsParam = tags?.length ? tags.join(',') : null
            const results = await Promise.allSettled([
                loadStats(),
                apiClient.listTodayActions({ limit: 5, tags: tagsParam }),
                apiClient.listActions({ limit: 5, tags: tagsParam }),
                apiClient.listWaiting({ limit: 5, tags: tagsParam }),
                apiClient.listProjects({ limit: 100, tags: tagsParam }),
            ])

            if (results[1].status === 'fulfilled') {
                topToday.value = results[1].value || []
            }
            if (results[2].status === 'fulfilled') {
                topActions.value = results[2].value || []
            }
            if (results[3].status === 'fulfilled') {
                topWaiting.value = results[3].value || []
            }
            if (results[4].status === 'fulfilled') {
                const allProjects = results[4].value || []
                stuckProjects.value = allProjects.filter(p => !p.next_action_id)
            }
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
