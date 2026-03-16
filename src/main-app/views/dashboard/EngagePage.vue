<template>
  <DashboardLayout>
    <div class="engage-page">

      <div class="engage-header">
        <div class="header-row">
          <h1 class="page-title">Engage</h1>
          <div class="header-actions">
            <TagFilter v-model="filterTags" />
          </div>
        </div>
      </div>

      <div class="engage-content">

        <!-- Loading state -->
        <div v-if="!initialLoadDone" class="loading-state">
          <span class="loading-spinner"></span>
        </div>

        <template v-else>

          <!-- Overdue alert -->
          <div v-if="overdueCount > 0" class="overdue-banner" @click="router.push({ name: 'overdue' })">
            <span class="overdue-banner__text">{{ overdueCount }} overdue item{{ overdueCount !== 1 ? 's' : '' }} need attention</span>
            <Btn variant="ghost-danger" size="sm" @click.stop="router.push({ name: 'overdue' })">View</Btn>
          </div>

          <!-- Today section -->
          <div class="card" v-if="topToday.length > 0">
            <div class="card-header">
              <router-link :to="{ name: 'today' }" class="section__title">
                Today
                <span v-if="todayCount > 0" class="section__count">{{ todayCount }}</span>
              </router-link>
              <router-link v-if="hasMoreToday" :to="{ name: 'today' }" class="section__link">View all</router-link>
            </div>
            <ItemList
                v-model="displayToday"
                :loading="false"
                :has-more="false"
                :loading-ids="loadingIds"
                :completing-ids="completingIds"
                source-type="action"
                :accept-drop="['action']"
                @update="onUpdate"
                @check="onCheck"
                @click="onTodayClick"
                @move="onTodayMove"
                @external-drop="onDropToToday"
            >
              <template #subtitle="{ item }">
                <MetadataRow :item="item" entity-type="action" />
              </template>
              <template #actions></template>
            </ItemList>
          </div>

          <!-- Next Actions section -->
          <div class="card" v-if="topActions.length > 0">
            <div class="card-header">
              <router-link :to="{ name: 'next' }" class="section__title">
                Next Actions
                <span v-if="nextCount > 0" class="section__count">{{ nextCount }}</span>
              </router-link>
              <router-link v-if="hasMoreNext" :to="{ name: 'next' }" class="section__link">View all</router-link>
            </div>
            <ItemList
                v-model="displayActions"
                :loading="false"
                :has-more="false"
                :loading-ids="loadingIds"
                :completing-ids="completingIds"
                source-type="action"
                :accept-drop="['action']"
                @update="onUpdate"
                @check="onCheck"
                @click="onNextClick"
                @move="onNextMove"
                @external-drop="onDropToNext"
            >
              <template #subtitle="{ item }">
                <MetadataRow :item="item" entity-type="action" />
              </template>
              <template #actions></template>
            </ItemList>
          </div>

          <!-- Waiting For section -->
          <div class="card" v-if="topWaiting.length > 0">
            <div class="card-header">
              <router-link :to="{ name: 'waiting-for' }" class="section__title">
                Waiting For
                <span v-if="waitingCount > 0" class="section__count">{{ waitingCount }}</span>
              </router-link>
              <router-link v-if="hasMoreWaiting" :to="{ name: 'waiting-for' }" class="section__link">View all</router-link>
            </div>
            <ItemList
                v-model="displayWaiting"
                :loading="false"
                :has-more="false"
                :loading-ids="loadingIds"
                :completing-ids="completingIds"
                source-type="action"
                :accept-drop="['action']"
                @update="onUpdate"
                @check="onCheck"
                @click="onWaitingClick"
                @move="onWaitingMove"
                @external-drop="onDropToWaiting"
            >
              <template #subtitle="{ item }">
                <MetadataRow :item="item" entity-type="action" />
              </template>
              <template #actions></template>
            </ItemList>
          </div>

          <!-- Secondary nudges (low priority) -->
          <div v-if="hasNudges" class="card">
            <div class="card-header">
              <span class="nudges__title">Keep your system clean</span>
            </div>
            <div v-if="inboxCount > 0" class="nudge" @click="router.push({ name: 'inbox', query: { clarify: 1 } })">
              <span class="nudge__text"><strong>{{ inboxCount }}</strong> item{{ inboxCount !== 1 ? 's' : '' }} in inbox to clarify</span>
              <router-link :to="{ name: 'inbox', query: { clarify: 1 } }" class="nudge__link" @click.stop>Clarify</router-link>
            </div>
            <div v-if="stuckProjects.length > 0" class="nudge" @click="router.push({ name: 'projects' })">
              <span class="nudge__text"><strong>{{ stuckProjects.length }}</strong> project{{ stuckProjects.length !== 1 ? 's' : '' }} need a next action</span>
              <router-link :to="{ name: 'projects' }" class="nudge__link" @click.stop>View</router-link>
            </div>
            <div v-if="reviewNudgeVisible" class="nudge" @click="router.push({ name: 'review' })">
              <span class="nudge__text">{{ reviewLabel }}</span>
              <router-link :to="{ name: 'review' }" class="nudge__link" @click.stop>Review</router-link>
            </div>
          </div>

          <!-- Empty state: filtered -->
          <div v-if="noActionItems && (activeTag || filterTags.length)" class="card">
            <div class="empty-state">
              <FilterEmptyState title="No actions for this context" :tags="effectiveTags" />
            </div>
          </div>

          <!-- Empty state: truly empty -->
          <div v-else-if="isEmpty" class="card">
            <div class="empty-state">
              <EngageIcon class="empty-state__icon" />
              <h2 class="text-h3 empty-state__title">Ready to get things done?</h2>
              <p class="text-body-m empty-state__text">
                Capture what's on your mind and let your system take care of the rest.
              </p>
              <Btn variant="primary" size="sm" class="empty-state__btn" @click="router.push({ name: 'inbox' })">
                Go to Inbox
              </Btn>
            </div>
          </div>

        </template>

      </div>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import Btn from '../../components/Btn.vue'
import MetadataRow from '../../components/MetadataRow.vue'
import EngageIcon from '../../assets/EngageIcon.vue'
import TagFilter from '../../components/TagFilter.vue'
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import { engageModel } from '../../scripts/models/engageModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import apiClient from '../../scripts/core/apiClient.js'
import { moveModel } from '../../scripts/models/moveModel.js'
import { hapticFeedback } from '../../scripts/core/haptics.js'

const router = useRouter()
const toaster = errorModel()
const mover = moveModel()
const { refreshStats } = statsModel()
const { activeTag } = contextModel()
const filterTags = ref([])

const {
    stats,
    topActions,
    topToday,
    topWaiting,
    stuckProjects,
    loading,
    loadDashboard,
    daysSinceReview,
    isReviewOverdue,
    reviewEnabled,
} = engageModel()

const effectiveTags = computed(() => {
    const tags = [...filterTags.value]
    if (activeTag.value && !tags.includes(activeTag.value)) {
        tags.push(activeTag.value)
    }
    return tags
})

const initialLoadDone = ref(false)

onMounted(async () => {
    try {
        await loadDashboard({ tags: effectiveTags.value })
    } catch {
        // API error — empty state will show
    } finally {
        initialLoadDone.value = true
    }
})

watch(effectiveTags, (tags) => {
    loadDashboard({ tags })
})

// Loading state tracking
const movingId = ref(null)
const updatingId = ref(null)

const loadingIds = computed(() => {
    const ids = []
    if (movingId.value) ids.push(movingId.value)
    if (updatingId.value) ids.push(updatingId.value)
    return ids
})

const inboxCount = computed(() => stats.value?.inbox?.count ?? 0)
const todayCount = computed(() => stats.value?.today?.count ?? 0)
const nextCount = computed(() => stats.value?.next?.count ?? 0)
const waitingCount = computed(() => stats.value?.waiting?.count ?? 0)
const overdueCount = computed(() => {
    return (stats.value?.next?.overdue ?? 0)
        + (stats.value?.today?.overdue ?? 0)
        + (stats.value?.calendar?.overdue ?? 0)
        + (stats.value?.waiting?.overdue ?? 0)
})

// Show "View all" when count > 5
const hasMoreToday = computed(() => todayCount.value > 5)
const hasMoreNext = computed(() => nextCount.value > 5)
const hasMoreWaiting = computed(() => waitingCount.value > 5)

// Display at most 5 items per section
const displayToday = computed(() => topToday.value.slice(0, 5))
const displayActions = computed(() => topActions.value.slice(0, 5))
const displayWaiting = computed(() => topWaiting.value.slice(0, 5))

const reviewLabel = computed(() => {
    const days = daysSinceReview.value
    if (days === null) return 'Never reviewed'
    if (days === 0) return 'Last reviewed today'
    if (days === 1) return 'Last reviewed yesterday'
    return `Last reviewed ${days} days ago`
})

const hasAnythingToReview = computed(() => {
    if (!stats.value) return false
    return inboxCount.value > 0
        || todayCount.value > 0
        || nextCount.value > 0
        || waitingCount.value > 0
        || (stats.value?.projects?.count ?? 0) > 0
        || (stats.value?.someday?.count ?? 0) > 0
})

const reviewNudgeVisible = computed(() => {
    return reviewEnabled.value
        && hasAnythingToReview.value
        && (daysSinceReview.value === null || daysSinceReview.value >= 6)
})

const hasNudges = computed(() => {
    return stuckProjects.value.length > 0
        || inboxCount.value > 0
        || reviewNudgeVisible.value
})

const noActionItems = computed(() => {
    return topToday.value.length === 0
        && topActions.value.length === 0
        && topWaiting.value.length === 0
})

const isEmpty = computed(() => {
    return noActionItems.value
        && overdueCount.value === 0
        && !hasNudges.value
})

function truncateTitle(title, maxLen = 30) {
    if (!title || title.length <= maxLen) return title
    return title.slice(0, maxLen).trim() + '\u2026'
}

function removeFromList(list, id) {
    const idx = list.value.findIndex(i => i.id === id)
    if (idx !== -1) list.value.splice(idx, 1)
}

const completingIds = ref([])
const ANIM_MS = 800

async function onCheck(id, checked) {
    if (!checked) return

    const item = topToday.value.find(i => i.id === id)
        || topActions.value.find(i => i.id === id)
        || topWaiting.value.find(i => i.id === id)
    const title = truncateTitle(item?.title)

    if (item) item.checked = true
    completingIds.value.push(id)
    hapticFeedback('success')

    try {
        await Promise.all([
            apiClient.completeAction(id),
            new Promise(r => setTimeout(r, ANIM_MS))
        ])
        removeFromList(topToday, id)
        removeFromList(topActions, id)
        removeFromList(topWaiting, id)
        refreshStats()
        toaster.success(`"${title}" completed`)
    } catch (err) {
        if (item) item.checked = false
        completingIds.value = completingIds.value.filter(x => x !== id)
        toaster.push(err.message || 'Failed to complete action')
    }
}

async function onUpdate(id, { title }) {
    updatingId.value = id
    try {
        await apiClient.updateAction(id, { title })
    } catch (e) {
        await loadDashboard({ tags: effectiveTags.value })
    } finally {
        updatingId.value = null
    }
}

// Move handlers per section
async function onTodayMove(id, newIndex) {
    movingId.value = id
    try {
        await apiClient.moveAction(id, newIndex)
    } catch (e) {
        await loadDashboard({ tags: effectiveTags.value })
    } finally {
        movingId.value = null
    }
}

async function onNextMove(id, newIndex) {
    movingId.value = id
    try {
        await apiClient.moveAction(id, newIndex)
    } catch (e) {
        await loadDashboard({ tags: effectiveTags.value })
    } finally {
        movingId.value = null
    }
}

async function onWaitingMove(id, newIndex) {
    movingId.value = id
    try {
        await apiClient.moveWaitingPosition(id, newIndex)
    } catch (e) {
        await loadDashboard({ tags: effectiveTags.value })
    } finally {
        movingId.value = null
    }
}

function onTodayClick(item) {
    router.push({ name: 'action-detail', params: { id: item.id }, query: { from: 'engage' } })
}

function onNextClick(item) {
    router.push({ name: 'action-detail', params: { id: item.id }, query: { from: 'engage' } })
}

function onWaitingClick(item) {
    router.push({ name: 'action-detail', params: { id: item.id }, query: { from: 'engage' } })
}

// Cross-list drop handlers
function removeFromAllLists(id) {
    removeFromList(topToday, id)
    removeFromList(topActions, id)
    removeFromList(topWaiting, id)
}

async function onDropToToday(data) {
    if (data.state === 'TODAY') return
    try {
        await apiClient.todayAction(data.id)
        await loadDashboard({ tags: effectiveTags.value })
        refreshStats()
        toaster.success(`"${truncateTitle(data.title)}" moved to Today`)
    } catch (err) {
        toaster.push(err.message || 'Failed to move item')
    }
}

async function onDropToNext(data) {
    if (data.state === 'NEXT') return
    try {
        await apiClient.undeferAction(data.id)
        await loadDashboard({ tags: effectiveTags.value })
        refreshStats()
        toaster.success(`"${truncateTitle(data.title)}" moved to Next Actions`)
    } catch (err) {
        toaster.push(err.message || 'Failed to move item')
    }
}

async function onDropToWaiting(data) {
    if (data.state === 'WAITING') return
    const waitingFor = await mover.showWaiting({ waitingFor: '' })
    if (!waitingFor) return
    try {
        await apiClient.waitAction(data.id, waitingFor)
        await loadDashboard({ tags: effectiveTags.value })
        refreshStats()
        toaster.success(`"${truncateTitle(data.title)}" moved to Waiting For`)
    } catch (err) {
        toaster.push(err.message || 'Failed to move item')
    }
}

</script>

<style scoped>
.engage-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.engage-header {
  flex-shrink: 0;
  margin-bottom: 15px;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  padding: 0 10px;
}

.engage-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 10px 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Overdue banner */
.overdue-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-danger-bg-subtle);
  border: 1px solid var(--color-danger-light);
  border-left: 3px solid var(--color-danger);
  border-radius: 8px;
  padding: 10px 16px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.overdue-banner:hover {
  background: var(--color-danger-bg-medium);
}

.overdue-banner__text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-danger);
}


.section__title,
.section__title:visited,
.section__title:link {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-family-default);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 13px;
  color: var(--color-action);
  text-decoration: none;
}

.section__title:hover {
  opacity: 0.8;
}


.section__count {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-action);
  background: var(--color-bg-accent-light);
  border-radius: 9999px;
  padding: 1px 8px;
}

.section__link,
.section__link:visited,
.section__link:link {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-family-default);
  color: var(--color-action);
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  line-height: 14px;
}

.section__link:hover {
  background: var(--color-bg-accent-light);
}


/* Nudges - gentle secondary prompts */
.nudges__title {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-family-default);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  line-height: 13px;
  color: var(--color-text-tertiary);
}

.nudge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background 0.15s ease;
}

.nudge:last-child {
  border-bottom: none;
}

.nudge:hover {
  background: var(--color-bg-hover);
}

.nudge__text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 17px;
}

.nudge__text strong {
  color: var(--color-action);
  font-weight: 600;
}

.nudge__link {
  font-size: 12px;
  font-weight: 600;
  font-family: var(--font-family-default);
  color: var(--color-action);
  text-decoration: none;
  flex-shrink: 0;
  margin-left: 12px;
  border: 1.5px solid var(--color-btn-ghost-border);
  border-radius: 4px;
  padding: 5px 12px;
  line-height: 14px;
  background: transparent;
}

.nudge__link:hover {
  background: var(--color-bg-accent-light);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.empty-state__icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.empty-state__title {
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}

.empty-state__btn {
  margin-top: 16px;
}
</style>
