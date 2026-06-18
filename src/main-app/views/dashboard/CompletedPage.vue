<template>
  <DashboardLayout>
    <div class="completed-page">
      <div class="completed-header">
        <h1 class="page-title">Completed</h1>
      </div>

      <!-- Charts row — FIXED above the list (does not scroll). Independent of the list:
           hidden when stats failed or there are no completions; a skeleton shows while stats load. -->
      <div v-if="showCharts" class="card completed-charts">
        <p v-if="lowActivity" class="text-body-s completed-charts__hint">
          Great start — every completed item counts. Keep the momentum going!
        </p>

        <!-- Single-chart segmented switcher (only when one chart fits). -->
        <div v-if="visibleCount === 1" class="completed-switcher" role="tablist" aria-label="Chart range">
          <button
              v-for="opt in switcherOptions"
              :key="opt.value"
              type="button"
              role="tab"
              :aria-selected="activeChart === opt.value"
              :class="['text-body-s fw-medium completed-switcher__btn', { 'completed-switcher__btn--active': activeChart === opt.value }]"
              @click="activeChart = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="completed-charts__row">
          <CompletedBarChart
              v-for="ch in shownCharts"
              :key="ch.key"
              :title="ch.title"
              :labels="ch.labels"
              :data="ch.data"
              :highlight-index="ch.highlightIndex"
              :best-day-index="ch.bestDayIndex"
              :aria-label="ch.ariaLabel"
          />
        </div>
      </div>
      <div v-else-if="showChartSkeleton" class="card completed-charts completed-charts--skeleton">
        <Spinner :size="24" />
      </div>

      <!-- Scrollable list area — only this scrolls; the charts stay fixed above. -->
      <div class="completed-scroll">
        <!-- Recency-grouped list. .card overflow relaxed so sticky section headers anchor
             to .completed-scroll (the scroll container). -->
        <div class="card completed-list">
          <div v-if="loading && items.length === 0" class="completed-loading">
            <Spinner :size="32" />
          </div>

          <div v-else-if="!loading && items.length === 0" class="completed-empty">
            <EmptyState :icon="CompletedIcon" title="No completed items" text="Items you complete will appear here. You can restore them by unchecking." />
          </div>

          <template v-else>
            <div v-for="group in groups" :key="group.key" class="completed-group">
              <div class="completed-group__header">
                <span class="text-body-s fw-semibold completed-group__label">{{ group.label }}</span>
                <span v-if="group.count > 0" class="text-footnote completed-group__count">{{ group.count }}</span>
              </div>
              <ItemList
                  v-model="group.items"
                  :loading="false"
                  :has-more="false"
                  :editable="false"
                  :loading-ids="loadingIds"
                  :completing-ids="completingIds"
                  :no-initial-animation="true"
                  :reorderable="false"
                  source-type="completed"
                  @click="onItemClick"
                  @check="onItemCheck"
              >
                <template #prefix="{ item }">
                  <ItemTypeIcon :type="item.type" />
                </template>
                <template #actions><span></span></template>
              </ItemList>
            </div>

            <div v-if="hasMore" class="completed-loadmore">
              <Btn variant="secondary" size="sm" :loading="loading" @click="loadMore">Load more</Btn>
            </div>
          </template>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { watch, onMounted, onUnmounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '../../layouts/DashboardLayout.vue'
import ItemList from '../../components/ItemList.vue'
import CompletedBarChart from '../../components/CompletedBarChart.vue'
import CompletedIcon from '../../assets/CompletedIcon.vue'
import EmptyState from '../../components/EmptyState.vue'
import ItemTypeIcon from '../../components/ItemTypeIcon.vue'
import Spinner from '../../components/Spinner.vue'
import Btn from '../../components/Btn.vue'
import { completedModel } from '../../scripts/models/completedModel.js'
import { errorModel } from '../../scripts/core/errorModel.js'
import { hapticFeedback } from '../../scripts/core/haptics.js'

const router = useRouter()

const {
  items,
  loading,
  error,
  hasMore,
  groups,
  charts,
  statsLoading,
  statsError,
  hasCompletions,
  loadCompleted,
  loadStats,
  uncompleteItem,
  removeItem,
} = completedModel()

const toaster = errorModel()

const undoingId = ref(null)
const completingIds = ref([])
const ANIM_MS = 800

const loadingIds = computed(() => {
  const ids = []
  if (undoingId.value) ids.push(undoingId.value)
  return ids
})

// ── Responsive chart layout: reveal 1–3 charts by width (3 → 2 → 1). ──
const windowWidth = ref(window.innerWidth)
function onResize() { windowWidth.value = window.innerWidth }
const visibleCount = computed(() => windowWidth.value >= 1024 ? 3 : windowWidth.value >= 768 ? 2 : 1)

const activeChart = ref('week')

const allCharts = computed(() => {
  if (!charts.value) return []
  const c = charts.value
  return [
    { key: 'week', value: 'week', label: 'Week', title: 'This week',
      labels: c.week.labels, data: c.week.data, highlightIndex: c.week.highlightIndex, bestDayIndex: c.week.bestDayIndex,
      ariaLabel: `Items completed each day this week. ${describe(c.week)}` },
    { key: 'month', value: 'month', label: 'Month', title: 'This month',
      labels: c.month.labels, data: c.month.data, highlightIndex: c.month.highlightIndex, bestDayIndex: -1,
      ariaLabel: `Items completed each week this month. ${describe(c.month)}` },
    { key: 'year', value: 'year', label: 'Year', title: 'This year',
      labels: c.year.labels, data: c.year.data, highlightIndex: c.year.highlightIndex, bestDayIndex: -1,
      ariaLabel: `Items completed each month this year. ${describe(c.year)}` },
  ]
})

function describe(ch) {
  return ch.labels.map((l, i) => `${l}: ${ch.data[i]}`).join(', ') + '.'
}

const switcherOptions = computed(() => allCharts.value.map(c => ({ value: c.value, label: c.label })))

const shownCharts = computed(() => {
  const list = allCharts.value
  if (!list.length) return []
  if (visibleCount.value === 1) return list.filter(c => c.value === activeChart.value)
  return list.slice(0, visibleCount.value)
})

// Charts render only with at least one completion and a successful stats fetch.
const showCharts = computed(() => hasCompletions.value && !statsError.value && !!charts.value)
const showChartSkeleton = computed(() => statsLoading.value && !statsError.value && !charts.value && (items.value.length > 0 || loading.value))
const lowActivity = computed(() => hasCompletions.value && (charts.value ? totalShown() <= 5 : false))
function totalShown() {
  return charts.value ? charts.value.year.data.reduce((a, b) => a + b, 0) : 0
}

watch(error, (err) => {
  if (!err) return
  // Skip 409 errors — handled directly in onItemCheck with a specific message
  if (err.status === 409) return
  const msg = typeof err === 'string' ? err : err.message ?? 'Unknown error'
  toaster.push(msg)
})

onMounted(() => {
  window.addEventListener('resize', onResize)
  // Two independent fetches: the list never waits on the stats call.
  loadCompleted({ reset: true }).catch(() => {})
  loadStats()
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
})

async function loadMore() {
  await loadCompleted()
}

function truncateTitle(title, maxLen = 30) {
  if (!title || title.length <= maxLen) return title
  return title.slice(0, maxLen).trim() + '…'
}

function onItemClick(item) {
  const idx = items.value.findIndex(i => i.id === item.id)
  const query = {
    position: idx >= 0 ? idx : 0,
    total: items.value.length,
    from: 'completed'
  }

  switch (item.type) {
    case 'STUFF':
      router.push({ name: 'stuff-detail', params: { id: item.id }, query })
      break
    case 'ACTION':
      router.push({ name: 'action-detail', params: { id: item.id }, query })
      break
    case 'PROJECT':
      router.push({ name: 'project-detail', params: { id: item.id }, query })
      break
  }
}

async function onItemCheck(id, checked) {
  if (checked) return // Already completed, ignore checking

  // Unchecking = uncomplete (restore)
  const item = items.value.find(i => i.id === id)
  if (!item) return

  const title = truncateTitle(item.title)
  item.checked = false
  completingIds.value.push(id)
  hapticFeedback('success')
  undoingId.value = id

  try {
    await Promise.all([
      uncompleteItem(item),
      new Promise(r => setTimeout(r, ANIM_MS))
    ])
    // Optimistic row removal + decrement + debounced reconcile of stats & list.
    removeItem(id)
    completingIds.value = completingIds.value.filter(x => x !== id)
    toaster.success(`"${title}" restored`)
  } catch (err) {
    item.checked = true
    completingIds.value = completingIds.value.filter(x => x !== id)
    const msg = (err.status === 409 && item.type === 'ACTION')
      ? 'Cannot restore this action — its parent project is completed or trashed. Restore the project first.'
      : (err.message || 'Failed to restore item')
    toaster.push(msg)
  } finally {
    undoingId.value = null
  }
}
</script>

<!--suppress CssUnusedSymbol -->
<style scoped>
.completed-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.completed-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.completed-header h1 {
  margin: 0;
  padding: 0;
}

/* Only the list scrolls; the charts row stays fixed above it. */
.completed-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 0 0 20px;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

/* ── Charts row (fixed) ── */
.completed-charts {
  flex-shrink: 0;
  padding: 20px;
}

.completed-charts--skeleton {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.completed-charts__hint {
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0 0 16px;
}

.completed-charts__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 24px;
  align-items: end;
}

/* ── Segmented Week/Month/Year switcher (mirrors CalendarHeader's --active idiom) ── */
.completed-switcher {
  display: flex;
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
  margin: 0 auto 16px;
}

.completed-switcher__btn {
  padding: 8px 16px;
  border: none;
  border-right: 1px solid var(--color-border-light);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.completed-switcher__btn:last-child {
  border-right: none;
}

.completed-switcher__btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.completed-switcher__btn--active {
  background: var(--color-action);
  color: var(--color-text-inverse);
}

.completed-switcher__btn--active:hover {
  background: var(--color-btn-primary-hover);
  color: var(--color-text-inverse);
}

/* ── Grouped list ── */
.completed-list {
  /* Relax .card's overflow:hidden so sticky headers anchor to .completed-content. */
  overflow: visible;
}

.completed-group__header {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border-subtle);
}

.completed-group:first-child .completed-group__header {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.completed-group__label {
  color: var(--color-text-primary);
}

.completed-group__count {
  color: var(--color-text-tertiary);
}

.completed-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
}

.completed-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.completed-loadmore {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid var(--color-border-subtle);
}
</style>
