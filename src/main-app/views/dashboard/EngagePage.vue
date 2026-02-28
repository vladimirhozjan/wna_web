<template>
  <DashboardLayout>
    <div class="engage-page">

      <div class="engage-header">
        <h1 class="text-h1 color-text-primary">Engage</h1>
      </div>

      <div class="engage-content">

        <!-- Loading state -->
        <div v-if="loading && !stats" class="loading-state">
          <span class="loading-spinner"></span>
        </div>

        <template v-else>

          <!-- Overdue alert (urgent - stays at top) -->
          <div v-if="overdueCount > 0" class="status-item status-item--danger" @click="router.push({ name: 'today' })">
            <span class="status-item__text">{{ overdueCount }} overdue item{{ overdueCount !== 1 ? 's' : '' }} need attention</span>
            <Btn variant="ghost-danger" size="sm" @click.stop="router.push({ name: 'today' })">View</Btn>
          </div>

          <!-- Today section -->
          <div class="section" v-if="topToday.length > 0">
            <div class="section__header">
              <router-link :to="{ name: 'today' }" class="section__title">
                Today
                <span v-if="todayCount > 0" class="section__count">{{ todayCount }}</span>
              </router-link>
              <router-link :to="{ name: 'today' }" class="section__link">View all</router-link>
            </div>
            <ItemList
                v-model="topToday"
                :loading="false"
                :has-more="false"
                :loading-ids="loadingIds"
                source-type="action"
                @update="onUpdate"
                @check="onCheck"
                @click="onTodayClick"
                @move="onTodayMove"
            >
              <template #subtitle="{ item }">
                <MetadataRow :item="item" entity-type="action" />
              </template>
              <template #actions></template>
            </ItemList>
          </div>

          <!-- Next Actions section -->
          <div class="section" v-if="topActions.length > 0">
            <div class="section__header">
              <router-link :to="{ name: 'next' }" class="section__title">
                Next Actions
                <span v-if="nextCount > 0" class="section__count">{{ nextCount }}</span>
              </router-link>
              <router-link :to="{ name: 'next' }" class="section__link">View all</router-link>
            </div>
            <ItemList
                v-model="topActions"
                :loading="false"
                :has-more="false"
                :loading-ids="loadingIds"
                source-type="action"
                @update="onUpdate"
                @check="onCheck"
                @click="onNextClick"
                @move="onNextMove"
            >
              <template #subtitle="{ item }">
                <MetadataRow :item="item" entity-type="action" />
              </template>
              <template #actions></template>
            </ItemList>
          </div>

          <!-- Waiting For section -->
          <div class="section" v-if="topWaiting.length > 0">
            <div class="section__header">
              <router-link :to="{ name: 'waiting-for' }" class="section__title">
                Waiting For
                <span v-if="waitingCount > 0" class="section__count">{{ waitingCount }}</span>
              </router-link>
              <router-link :to="{ name: 'waiting-for' }" class="section__link">View all</router-link>
            </div>
            <ItemList
                v-model="topWaiting"
                :loading="false"
                :has-more="false"
                :loading-ids="loadingIds"
                source-type="action"
                @update="onUpdate"
                @check="onCheck"
                @click="onWaitingClick"
                @move="onWaitingMove"
            >
              <template #subtitle="{ item }">
                <MetadataRow :item="item" entity-type="action" />
              </template>
              <template #actions></template>
            </ItemList>
          </div>

          <!-- Secondary nudges (low priority) -->
          <div v-if="hasNudges" class="nudges">
            <div class="nudges__title">Keep your system clean</div>
            <div v-if="inboxCount > 0" class="nudge" @click="router.push({ name: 'inbox', query: { clarify: 1 } })">
              <span class="nudge__text">{{ inboxCount }} item{{ inboxCount !== 1 ? 's' : '' }} in inbox to clarify</span>
              <router-link :to="{ name: 'inbox', query: { clarify: 1 } }" class="nudge__link" @click.stop>Clarify</router-link>
            </div>
            <div v-if="stuckProjects.length > 0" class="nudge" @click="router.push({ name: 'projects' })">
              <span class="nudge__text">{{ stuckProjects.length }} project{{ stuckProjects.length !== 1 ? 's' : '' }} need a next action</span>
              <router-link :to="{ name: 'projects' }" class="nudge__link" @click.stop>View</router-link>
            </div>
            <div v-if="reviewNudgeVisible" class="nudge" @click="router.push({ name: 'review' })">
              <span class="nudge__text">{{ reviewLabel }}</span>
              <router-link :to="{ name: 'review' }" class="nudge__link" @click.stop>Review</router-link>
            </div>
          </div>

          <!-- Empty state: filtered -->
          <div v-if="noActionItems && activeTag" class="empty-state">
            <FilterEmptyState title="No actions for this context" :tags="effectiveTags" />
          </div>

          <!-- Empty state: truly empty -->
          <div v-else-if="isEmpty" class="empty-state">
            <EngageIcon class="empty-state__icon" />
            <h2 class="empty-state__title">Ready to get things done?</h2>
            <p class="empty-state__text">
              Capture what's on your mind and let your system take care of the rest.
            </p>
            <Btn variant="primary" size="sm" class="empty-state__btn" @click="router.push({ name: 'inbox' })">
              Go to Inbox
            </Btn>
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
import FilterEmptyState from '../../components/FilterEmptyState.vue'
import { engageModel } from '../../scripts/models/engageModel.js'
import { contextModel } from '../../scripts/models/contextModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { statsModel } from '../../scripts/models/statsModel.js'
import apiClient from '../../scripts/core/apiClient.js'

const router = useRouter()
const toaster = errorModel()
const { refreshStats } = statsModel()
const { activeTag } = contextModel()

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
    if (!activeTag.value) return []
    return [activeTag.value]
})

onMounted(() => {
    loadDashboard({ tags: effectiveTags.value })
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
    return !loading.value
        && topToday.value.length === 0
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

async function onCheck(id, checked) {
    if (!checked) return

    const item = topToday.value.find(i => i.id === id)
        || topActions.value.find(i => i.id === id)
        || topWaiting.value.find(i => i.id === id)
    const title = truncateTitle(item?.title)

    try {
        await apiClient.completeAction(id)
        removeFromList(topToday, id)
        removeFromList(topActions, id)
        removeFromList(topWaiting, id)
        refreshStats()
        toaster.success(`"${title}" completed`)
    } catch (err) {
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
</script>

<style scoped>
.engage-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.engage-header {
  flex-shrink: 0;
  background: var(--color-bg-primary);
  margin-bottom: 15px;
}

h1 {
  padding: 10px;
}

.engage-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
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

/* Overdue alert */
.status-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.status-item:hover {
  background: var(--color-bg-hover);
}

.status-item--danger {
  border-left-color: var(--color-danger);
  background-color: rgba(254, 226, 226, 0.35);
}

.status-item--danger:hover {
  background-color: rgba(254, 226, 226, 0.55);
}

.status-item__text {
  flex: 1;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
}

/* Section headers */
.section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 6px;
}

.section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  text-decoration: none;
}

.section__title:hover {
  color: var(--color-text-primary);
}

.section__count {
  font-weight: var(--font-weight-normal);
  color: var(--color-text-tertiary);
}

.section__link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  text-decoration: none;
}

.section__link:hover {
  color: var(--color-text-secondary);
  text-decoration: underline;
}

/* Nudges - gentle secondary prompts */
.nudges {
  margin-top: 20px;
}

.nudges__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding: 0 16px 6px;
}

.nudge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
}

.nudge:last-child {
  border-bottom: none;
}

.nudge__text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
}

.nudge__link {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-tertiary);
  text-decoration: none;
  flex-shrink: 0;
  margin-left: 12px;
}

.nudge__link:hover {
  color: var(--color-text-secondary);
  text-decoration: underline;
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
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.empty-state__text {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 300px;
}

.empty-state__btn {
  margin-top: 16px;
}
</style>
