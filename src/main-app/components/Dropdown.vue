<template>
  <div class="dropdown-wrapper" ref="wrapperRef">
    <span class="dropdown-trigger" @click="toggle">
      <slot name="trigger" />
    </span>

    <Teleport to="body">
      <!-- Desktop dropdown -->
      <template v-if="isOpen && !isMobile">
        <div class="dropdown-backdrop" @click="close"></div>
        <div class="dropdown-menu" :style="menuStyle" ref="menuRef">
          <slot :close="close" :mobile="false" />
        </div>
      </template>

      <!-- Mobile action sheet -->
      <template v-if="isOpen && isMobile">
        <div class="dropdown-sheet-overlay" :style="sheetOverlayStyle" @click="close">
          <div class="dropdown-sheet" data-testid="dropdown-sheet" @click.stop>
            <div class="dropdown-sheet-header">
              <span class="text-body-l fw-semibold dropdown-sheet-title">{{ title }}</span>
              <button type="button" class="dropdown-sheet-close" @click="close">&times;</button>
            </div>
            <div class="dropdown-sheet-content">
              <slot :close="close" :mobile="true" />
            </div>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useVisualViewport } from '../scripts/core/visualViewport.js'

const props = defineProps({
  title: {
    type: String,
    default: 'Select'
  },
  modelValue: {
    type: Boolean,
    default: undefined
  },
  align: {
    type: String,
    default: 'left' // 'left' or 'right'
  }
})

const emit = defineEmits(['update:modelValue'])

const wrapperRef = ref(null)
const menuRef = ref(null)
const internalOpen = ref(false)
const isMobile = ref(false)
const menuStyle = ref({})

// Support both controlled (v-model) and uncontrolled usage
const isOpen = ref(false)

const viewport = useVisualViewport(() => isOpen.value && isMobile.value)
const sheetOverlayStyle = computed(() => ({ top: `${viewport.top}px`, height: `${viewport.height}px` }))

function prePosition() {
  if (!wrapperRef.value) return
  const rect = wrapperRef.value.getBoundingClientRect()
  const alignRight = props.align === 'right'
  menuStyle.value = {
    position: 'fixed',
    ...(alignRight
        ? { right: `${window.innerWidth - rect.right}px` }
        : { left: `${rect.left}px` }
    ),
    top: `${rect.bottom + 2}px`
  }
}

function schedulePosition() {
  prePosition()
  nextTick(() => requestAnimationFrame(() => positionMenu()))
}

watch(() => props.modelValue, (val) => {
  if (val !== undefined) {
    isOpen.value = val
    if (val && !isMobile.value) {
      schedulePosition()
    }
  }
}, { immediate: true })

watch(internalOpen, (val) => {
  if (props.modelValue === undefined) {
    isOpen.value = val
  }
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function toggle() {
  if (props.modelValue !== undefined) {
    emit('update:modelValue', !props.modelValue)
  } else {
    internalOpen.value = !internalOpen.value
    isOpen.value = internalOpen.value
    if (isOpen.value && !isMobile.value) {
      schedulePosition()
    }
  }
}

function open() {
  if (props.modelValue !== undefined) {
    emit('update:modelValue', true)
  } else {
    internalOpen.value = true
    isOpen.value = true
    if (!isMobile.value) {
      schedulePosition()
    }
  }
}

function close() {
  if (props.modelValue !== undefined) {
    emit('update:modelValue', false)
  } else {
    internalOpen.value = false
    isOpen.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && isOpen.value) close()
}

function positionMenu() {
  if (!wrapperRef.value) return

  const rect = wrapperRef.value.getBoundingClientRect()
  const menuHeight = menuRef.value?.offsetHeight || 200
  const menuWidth = menuRef.value?.offsetWidth || 160

  // Check if menu would go off screen at bottom
  const spaceBelow = window.innerHeight - rect.bottom
  const showAbove = spaceBelow < menuHeight && rect.top > menuHeight

  // Check horizontal alignment
  const alignRight = props.align === 'right' || (rect.left + menuWidth > window.innerWidth)

  menuStyle.value = {
    position: 'fixed',
    ...(alignRight
        ? { right: `${window.innerWidth - rect.right}px` }
        : { left: `${rect.left}px` }
    ),
    ...(showAbove
        ? { bottom: `${window.innerHeight - rect.top + 2}px` }
        : { top: `${rect.bottom + 2}px` }
    )
  }
}

defineExpose({ open, close, toggle })

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.dropdown-wrapper {
  position: relative;
  display: inline-flex;
}

.dropdown-trigger {
  display: inline-flex;
}

/* Desktop dropdown */
.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.dropdown-menu {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: var(--shadow-dropdown);
  z-index: 1000;
  overflow: hidden;
  min-width: 160px;
  padding: 8px;
}

/* Mobile action sheet */
.dropdown-sheet-overlay {
  position: fixed;
  left: 0;
  right: 0;
  background: var(--color-overlay-light);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.dropdown-sheet {
  width: 100%;
  background: var(--color-bg-primary);
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  max-height: 70%;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.dropdown-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.dropdown-sheet-title {
  color: var(--color-text-primary);
}

.dropdown-sheet-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: var(--lh-none);
}

.dropdown-sheet-close:hover {
  color: var(--color-text-primary);
}

.dropdown-sheet-content {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  overflow-y: auto;
  overscroll-behavior: contain;
}

@media (max-width: 768px) {
  .dropdown-sheet-close {
    min-width: var(--touch-target-min);
    min-height: var(--touch-target-min);
  }
}
</style>

<style>
/* Global styles for dropdown items - can be used by parent components */
.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  cursor: pointer;
}

.dropdown-item:hover:where(:not(:disabled)) {
  background: var(--color-bg-secondary);
}

.dropdown-item:disabled {
  color: var(--color-text-tertiary);
  background: none;
  cursor: default;
}

.dropdown-item-icon {
  width: 32px;
  height: 32px;
  padding: 5px;
  box-sizing: border-box;
  margin-right: 4px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.dropdown-item:hover:where(:not(:disabled)) .dropdown-item-icon {
  color: var(--color-action);
}

.dropdown-item--danger {
  color: var(--color-text-danger);
}

.dropdown-item--danger:hover:where(:not(:disabled)) {
  background: rgba(220, 38, 38, 0.08);
}

/* Mobile-specific item styles */
@media (max-width: 768px) {
  .dropdown-item {
    padding: 12px 16px;
    font-size: var(--font-size-md);
    min-height: var(--touch-target-min);
    box-sizing: border-box;
  }

  .dropdown-item-icon {
    width: 32px;
    height: 32px;
    margin-right: 8px;
  }
}
</style>
