<template>
  <div class="bottom-sheet-overlay" :style="overlayStyle" data-testid="bottom-sheet-backdrop" @click="onBackdrop" @touchmove.self.prevent>
    <div
        ref="sheetEl"
        class="bottom-sheet"
        :class="{ 'bottom-sheet--snapping': snapping }"
        :style="sheetStyle"
        :data-expanded="expanded"
        data-testid="bottom-sheet"
        @click.stop
    >
      <div ref="handleEl" class="bottom-sheet__handle" data-testid="bottom-sheet-handle">
        <span class="bottom-sheet__handle-bar"></span>
      </div>
      <div ref="bodyEl" class="bottom-sheet__body">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useSwipe, SNAP_MS } from '../scripts/core/swipe.js'

const props = defineProps({
  dismissible: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const OPEN_RATIO = 0.7
const DISMISS_RATIO = 0.25

const sheetEl = ref(null)
const handleEl = ref(null)
const bodyEl = ref(null)
const viewport = reactive({ height: window.innerHeight, top: 0 })
const expanded = ref(false)
const dragY = ref(0)
const snapping = ref(false)
let resizeObserver = null
let mutationObserver = null

const overlayStyle = computed(() => ({ top: `${viewport.top}px`, height: `${viewport.height}px` }))
const sheetStyle = computed(() => ({
  height: `${expanded.value ? viewport.height : Math.round(viewport.height * OPEN_RATIO)}px`,
  transform: dragY.value ? `translateY(${dragY.value}px)` : null,
}))

function onBackdrop() {
  if (props.dismissible) emit('close')
}

function syncViewport() {
  const vv = window.visualViewport
  viewport.height = vv ? vv.height : window.innerHeight
  viewport.top = vv ? vv.offsetTop : 0
  nextTick(checkOverflow)
}

// Expansion is one-way: once the content needs full height, it keeps it until the sheet closes.
function checkOverflow() {
  if (expanded.value || !bodyEl.value) return
  const overflowing = [bodyEl.value, ...bodyEl.value.querySelectorAll('*')].some(el =>
      el.scrollHeight > el.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(el).overflowY))
  if (overflowing) expanded.value = true
}

useSwipe(handleEl, {
  axis: 'y',
  holdLimit: Infinity,
  canStart: () => props.dismissible && !snapping.value,
  onMove(dy) {
    dragY.value = Math.max(0, dy)
    return true
  },
  onEnd() {
    if (dragY.value > sheetEl.value.offsetHeight * DISMISS_RATIO) {
      emit('close')
      return
    }
    snapping.value = true
    dragY.value = 0
    setTimeout(() => { snapping.value = false }, SNAP_MS)
  },
})

onMounted(() => {
  syncViewport()
  window.visualViewport?.addEventListener('resize', syncViewport)
  window.visualViewport?.addEventListener('scroll', syncViewport)
  window.addEventListener('resize', syncViewport)
  resizeObserver = new ResizeObserver(checkOverflow)
  resizeObserver.observe(bodyEl.value)
  mutationObserver = new MutationObserver(() => nextTick(checkOverflow))
  mutationObserver.observe(bodyEl.value, { childList: true, subtree: true, characterData: true })
})

onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', syncViewport)
  window.visualViewport?.removeEventListener('scroll', syncViewport)
  window.removeEventListener('resize', syncViewport)
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})
</script>

<style scoped>
.bottom-sheet-overlay {
  position: fixed;
  left: 0;
  right: 0;
  background: var(--color-overlay-light);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-primary);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  animation: bottom-sheet-up 0.2s ease-out;
  transition: height 0.2s ease;
}

.bottom-sheet--snapping {
  transition: height 0.2s ease, transform 0.15s ease;
}

@keyframes bottom-sheet-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.bottom-sheet__handle {
  flex-shrink: 0;
  height: var(--touch-target-min);
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: grab;
}

.bottom-sheet__handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--color-border-medium);
}

.bottom-sheet__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
