<template>
  <div class="dropdown-wrapper" ref="wrapperRef">
    <span class="dropdown-trigger" @click="toggle">
      <slot name="trigger" />
    </span>

    <Teleport to="body">
      <template v-if="isOpen && !isMobile">
        <div class="dropdown-backdrop" @click="close"></div>
        <div class="dropdown-menu" :style="menuStyle" ref="menuRef">
          <slot :close="close" />
        </div>
      </template>

      <template v-if="isOpen && isMobile">
        <div class="dropdown-sheet-overlay" @click="close">
          <div class="dropdown-sheet" @click.stop>
            <div class="dropdown-sheet-header">
              <span class="text-body-l fw-semibold dropdown-sheet-title">{{ title }}</span>
              <button type="button" class="dropdown-sheet-close" @click="close">&times;</button>
            </div>
            <div class="dropdown-sheet-content">
              <slot :close="close" />
            </div>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

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
    default: 'left'
  }
})

const emit = defineEmits(['update:modelValue'])

const wrapperRef = ref(null)
const menuRef = ref(null)
const internalOpen = ref(false)
const isMobile = ref(false)
const menuStyle = ref({})
const isOpen = ref(false)

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
  const spaceBelow = window.innerHeight - rect.bottom
  const showAbove = spaceBelow < menuHeight && rect.top > menuHeight
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

.dropdown-sheet-overlay {
  position: fixed;
  inset: 0;
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
  max-height: 70vh;
  overflow: hidden;
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.dropdown-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  padding: 8px 0;
  overflow-y: auto;
}
</style>

<style>
.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: 4px;
}

.dropdown-item:hover {
  background: var(--color-bg-secondary);
}

.dropdown-item--danger {
  color: var(--color-text-danger);
}

.dropdown-item--danger:hover {
  background: rgba(220, 38, 38, 0.08);
}

@media (max-width: 768px) {
  .dropdown-item {
    padding: 12px 16px;
    font-size: var(--font-size-body-l);
  }
}
</style>
