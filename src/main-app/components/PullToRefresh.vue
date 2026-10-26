<template>
  <div ref="rootEl" class="pull-to-refresh">
    <div
        class="pull-to-refresh__indicator"
        :class="{ 'pull-to-refresh__indicator--settling': !pulling }"
        :style="{ height: `${indicatorHeight}px` }"
        :data-state="indicatorState"
        data-testid="pull-to-refresh"
    >
      <Spinner v-if="refreshing" :size="20" />
      <template v-else-if="pull > 0">
        <ChevronDownIcon class="pull-to-refresh__chevron" :class="{ 'pull-to-refresh__chevron--armed': armed }" />
        <span class="text-body-s pull-to-refresh__label">{{ armed ? 'Release to refresh' : 'Pull to refresh' }}</span>
      </template>
    </div>
    <slot />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Spinner from './Spinner.vue'
import ChevronDownIcon from '../assets/ChevronDownIcon.vue'
import { statsModel } from '../scripts/models/statsModel.js'
import { useSwipe } from '../scripts/core/swipe.js'

const props = defineProps({
  refresh: { type: Function, required: true },
  disabled: { type: Boolean, default: false },
})

const PULL_THRESHOLD = 64
const PULL_MAX = 96
const PULL_RESISTANCE = 0.5
const REFRESHING_HEIGHT = 44

const { loadStats } = statsModel()

const rootEl = ref(null)
const pull = ref(0)
const pulling = ref(false)
const refreshing = ref(false)

const armed = computed(() => pull.value >= PULL_THRESHOLD)
const indicatorHeight = computed(() => refreshing.value ? REFRESHING_HEIGHT : pull.value)
const indicatorState = computed(() => {
  if (refreshing.value) return 'refreshing'
  if (armed.value) return 'armed'
  return pull.value > 0 ? 'pulling' : 'idle'
})

useSwipe(rootEl, {
  axis: 'y',
  canStart: () => !props.disabled && !refreshing.value && !rootEl.value.querySelector('.item--editing'),
  onMove(dy) {
    if (!pulling.value && (dy <= 0 || rootEl.value.scrollTop > 0)) return false
    pulling.value = true
    pull.value = Math.min(PULL_MAX, Math.max(0, dy) * PULL_RESISTANCE)
    return true
  },
  async onEnd() {
    const release = armed.value
    pulling.value = false
    pull.value = 0
    if (!release) return
    refreshing.value = true
    try {
      await Promise.all([props.refresh(), loadStats()])
    } catch {
      // the page's own error toast reports the failure
    } finally {
      refreshing.value = false
    }
  },
})
</script>

<style scoped>
.pull-to-refresh__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 0;
  overflow: hidden;
}

.pull-to-refresh__indicator--settling {
  transition: height 0.15s ease;
}

.pull-to-refresh__chevron {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
  transition: transform 0.15s ease;
}

.pull-to-refresh__chevron--armed {
  transform: rotate(180deg);
}

.pull-to-refresh__label {
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .pull-to-refresh,
  :global(html:has(.pull-to-refresh)),
  :global(body:has(.pull-to-refresh)) {
    overscroll-behavior-y: contain;
  }
}
</style>
