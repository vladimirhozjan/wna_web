<template>
  <div class="select-wrapper" ref="wrapperRef">
    <button
        type="button"
        class="select-trigger"
        :class="{ 'select-trigger--open': isOpen }"
        @click="toggle"
    >
      <span class="select-value">{{ selectedLabel }}</span>
      <span class="select-arrow">▾</span>
    </button>

    <!-- Desktop dropdown -->
    <Teleport to="body">
      <template v-if="isOpen && !isMobile">
        <div class="select-backdrop" @click="close"></div>
        <div
            class="select-dropdown"
            :style="dropdownStyle"
            ref="dropdownRef"
        >
          <button
              v-for="option in options"
              :key="option.value"
              type="button"
              class="select-option"
              :class="{ 'select-option--selected': option.value === modelValue }"
              @click="select(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
      </template>

      <!-- Mobile action sheet -->
      <template v-if="isOpen && isMobile">
        <div class="select-sheet-overlay" @click="close">
          <div class="select-sheet" @click.stop>
            <div class="select-sheet-header">
              <span class="select-sheet-title">{{ title }}</span>
              <button type="button" class="select-sheet-close" @click="close">&times;</button>
            </div>
            <div class="select-sheet-options">
              <button
                  v-for="option in options"
                  :key="option.value"
                  type="button"
                  class="select-sheet-option"
                  :class="{ 'select-sheet-option--selected': option.value === modelValue }"
                  @click="select(option.value)"
              >
                <span>{{ option.label }}</span>
                <span v-if="option.value === modelValue" class="select-sheet-check">✓</span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    required: true
  },
  options: {
    type: Array, // [{ value: 'foo', label: 'Foo' }]
    required: true
  },
  title: {
    type: String,
    default: 'Select'
  }
})

const emit = defineEmits(['update:modelValue'])

const wrapperRef = ref(null)
const dropdownRef = ref(null)
const isOpen = ref(false)
const isMobile = ref(false)
const dropdownStyle = ref({})

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue)
  return option ? option.label : ''
})

function checkMobile() {
  isMobile.value = window.innerWidth <= 768
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function open() {
  isOpen.value = true
  if (!isMobile.value) {
    nextTick(() => {
      positionDropdown()
    })
  }
}

function close() {
  isOpen.value = false
}

function select(value) {
  emit('update:modelValue', value)
  close()
}

function positionDropdown() {
  if (!wrapperRef.value) return

  const rect = wrapperRef.value.getBoundingClientRect()
  const dropdownHeight = dropdownRef.value?.offsetHeight || 150

  // Check if dropdown would go off screen at bottom
  const spaceBelow = window.innerHeight - rect.bottom
  const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

  dropdownStyle.value = {
    position: 'fixed',
    left: `${rect.left}px`,
    minWidth: `${rect.width}px`,
    ...(showAbove
        ? { bottom: `${window.innerHeight - rect.top + 4}px` }
        : { top: `${rect.bottom + 4}px` }
    )
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.select-wrapper {
  position: relative;
  display: inline-block;
}

.select-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
  min-width: 100px;
}

.select-trigger:hover {
  border-color: var(--color-border);
}

.select-trigger--open {
  border-color: var(--color-action);
}

.select-value {
  flex: 1;
  text-align: left;
}

.select-arrow {
  color: var(--color-text-tertiary);
  font-size: 12px;
  transition: transform 0.2s;
}

.select-trigger--open .select-arrow {
  transform: rotate(180deg);
}

/* Desktop dropdown */
.select-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
}

.select-dropdown {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow-y: auto;
  max-height: 300px;
}

.select-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  cursor: pointer;
}

.select-option:hover {
  background: var(--color-bg-secondary);
}

.select-option--selected {
  background: var(--color-bg-secondary);
  color: var(--color-action);
  font-weight: 500;
}

/* Mobile action sheet */
.select-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.select-sheet {
  width: 100%;
  background: var(--color-bg-primary);
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
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

.select-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.select-sheet-title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-l);
  font-weight: 600;
  color: var(--color-text-primary);
}

.select-sheet-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
}

.select-sheet-close:hover {
  color: var(--color-text-primary);
}

.select-sheet-options {
  padding: 8px 0;
  overflow-y: auto;
}

.select-sheet-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background: none;
  border: none;
  text-align: left;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-l);
  color: var(--color-text-primary);
  cursor: pointer;
}

.select-sheet-option:hover {
  background: var(--color-bg-secondary);
}

.select-sheet-option--selected {
  color: var(--color-action);
  font-weight: 500;
}

.select-sheet-check {
  color: var(--color-action);
  font-weight: 600;
}
</style>
