<template>
  <div class="select-wrapper" ref="wrapperRef">
    <button
        type="button"
        class="text-body-m select-trigger"
        :class="{ 'select-trigger--open': isOpen }"
        ref="triggerRef"
        aria-haspopup="listbox"
        :aria-expanded="isOpen"
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
          <div v-if="isSearchable" class="select-search">
            <input
                ref="searchInputRef"
                v-model="searchQuery"
                type="text"
                class="text-body-m select-search-input"
                :placeholder="searchPlaceholder"
                role="combobox"
                aria-autocomplete="list"
                :aria-expanded="isOpen"
                :aria-controls="listboxId"
                :aria-activedescendant="activeIndex >= 0 ? optionId(activeIndex) : undefined"
                @input="onSearchInput"
                @keydown="onKeydown"
            />
          </div>
          <div class="select-options" ref="optionsRef" :id="listboxId" role="listbox">
            <button
                v-for="(option, i) in filteredOptions"
                :key="option.value"
                :id="optionId(i)"
                :data-index="i"
                type="button"
                role="option"
                :aria-selected="option.value === modelValue"
                class="text-body-m select-option"
                :class="{
                  'select-option--selected': option.value === modelValue,
                  'select-option--active': i === activeIndex,
                }"
                @click="select(option.value)"
                @mouseenter="activeIndex = i"
            >
              {{ option.label }}
            </button>
            <div v-if="filteredOptions.length === 0" class="text-body-m select-empty" role="presentation" aria-live="polite">No matches</div>
          </div>
        </div>
      </template>

      <!-- Mobile action sheet -->
      <template v-if="isOpen && isMobile">
        <div class="select-sheet-overlay" @click="close">
          <div class="select-sheet" @click.stop>
            <div class="select-sheet-header">
              <span class="text-body-l fw-semibold select-sheet-title">{{ title }}</span>
              <button type="button" class="select-sheet-close" @click="close">&times;</button>
            </div>
            <div v-if="isSearchable" class="select-sheet-search">
              <input
                  ref="sheetSearchInputRef"
                  v-model="searchQuery"
                  type="text"
                  class="text-body-l select-search-input"
                  :placeholder="searchPlaceholder"
                  role="combobox"
                  aria-autocomplete="list"
                  :aria-expanded="isOpen"
                  :aria-controls="listboxId"
                  :aria-activedescendant="activeIndex >= 0 ? optionId(activeIndex) : undefined"
                  @input="onSearchInput"
                  @keydown="onKeydown"
              />
            </div>
            <div class="select-sheet-options" ref="optionsRef" :id="listboxId" role="listbox">
              <button
                  v-for="(option, i) in filteredOptions"
                  :key="option.value"
                  :id="optionId(i)"
                  :data-index="i"
                  type="button"
                  role="option"
                  :aria-selected="option.value === modelValue"
                  class="text-body-l select-sheet-option"
                  :class="{
                    'select-sheet-option--selected': option.value === modelValue,
                    'select-sheet-option--active': i === activeIndex,
                  }"
                  @click="select(option.value)"
              >
                <span>{{ option.label }}</span>
                <span v-if="option.value === modelValue" class="select-sheet-check">✓</span>
              </button>
              <div v-if="filteredOptions.length === 0" class="text-body-l select-empty" role="presentation" aria-live="polite">No matches</div>
            </div>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, useId } from 'vue'

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
  },
  // true / false to force; 'auto' (default) enables the filter for long lists
  searchable: {
    type: [Boolean, String],
    default: 'auto'
  }
})

const emit = defineEmits(['update:modelValue'])

const SEARCH_THRESHOLD = 8
const uid = useId()
const listboxId = `${uid}-listbox`

const wrapperRef = ref(null)
const triggerRef = ref(null)
const dropdownRef = ref(null)
const optionsRef = ref(null)
const searchInputRef = ref(null)
const sheetSearchInputRef = ref(null)
const isOpen = ref(false)
const isMobile = ref(false)
const dropdownStyle = ref({})
const searchQuery = ref('')
const activeIndex = ref(-1)

const isSearchable = computed(() =>
    props.searchable === true || (props.searchable === 'auto' && props.options.length > SEARCH_THRESHOLD)
)

const searchPlaceholder = computed(() => props.title && props.title !== 'Select' ? `Search ${props.title}…` : 'Search…')

const selectedLabel = computed(() => {
  const option = props.options.find(o => o.value === props.modelValue)
  return option ? option.label : ''
})

const filteredOptions = computed(() => {
  if (!isSearchable.value) return props.options
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter(o => String(o.label).toLowerCase().includes(q))
})

function optionId(index) {
  return `${uid}-opt-${index}`
}

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
  searchQuery.value = ''
  // start the highlight on the current selection (or first option); -1 when there are no options
  const idx = filteredOptions.value.findIndex(o => o.value === props.modelValue)
  activeIndex.value = filteredOptions.value.length ? Math.max(0, idx) : -1
  nextTick(() => {
    if (!isMobile.value) positionDropdown()
    focusSearch()
    scrollActiveIntoView()
  })
}

function close() {
  const restoreFocus = dropdownHasFocus()
  isOpen.value = false
  searchQuery.value = ''
  activeIndex.value = -1
  // keyboard users: return focus to the trigger when the focused dropdown unmounts
  if (restoreFocus) nextTick(() => triggerRef.value?.focus())
}

function select(value) {
  emit('update:modelValue', value)
  close()
}

// Did focus live inside the (about-to-unmount) dropdown? Guards against stealing focus on programmatic closes
function dropdownHasFocus() {
  const ae = document.activeElement
  if (!ae) return false
  return ae === searchInputRef.value
      || ae === sheetSearchInputRef.value
      || !!optionsRef.value?.contains(ae)
      || !!dropdownRef.value?.contains(ae)
}

function focusSearch() {
  // desktop only — auto-focusing on mobile would pop the on-screen keyboard
  if (!isSearchable.value || isMobile.value) return
  searchInputRef.value?.focus()
}

function onSearchInput() {
  activeIndex.value = filteredOptions.value.length ? 0 : -1
  if (!isMobile.value) nextTick(positionDropdown) // height may change → re-clamp vertical placement
  nextTick(scrollActiveIntoView)
}

function moveActive(delta) {
  const n = filteredOptions.value.length
  if (!n) return
  const i = activeIndex.value < 0
      ? (delta > 0 ? 0 : n - 1)
      : (activeIndex.value + delta + n) % n
  activeIndex.value = i
  nextTick(scrollActiveIntoView)
}

function onKeydown(e) {
  if (e.isComposing || e.keyCode === 229) return // let the IME own composition keys
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault(); moveActive(1); break
    case 'ArrowUp':
      e.preventDefault(); moveActive(-1); break
    case 'Enter':
      e.preventDefault()
      if (filteredOptions.value[activeIndex.value]) select(filteredOptions.value[activeIndex.value].value)
      break
    case 'Escape':
      e.preventDefault(); close(); break
    case 'Home':
      e.preventDefault()
      if (filteredOptions.value.length) { activeIndex.value = 0; nextTick(scrollActiveIntoView) }
      break
    case 'End':
      e.preventDefault()
      if (filteredOptions.value.length) { activeIndex.value = filteredOptions.value.length - 1; nextTick(scrollActiveIntoView) }
      break
  }
}

function scrollActiveIntoView() {
  const container = optionsRef.value
  if (!container || activeIndex.value < 0) return
  container.querySelector(`[data-index="${activeIndex.value}"]`)?.scrollIntoView({ block: 'nearest' })
}

function positionDropdown() {
  if (!wrapperRef.value || !dropdownRef.value) return

  const rect = wrapperRef.value.getBoundingClientRect()
  const margin = 8

  // Size to content (CSS width:max-content), but never narrower than the trigger; pin it so filtering doesn't jitter the width
  const width = Math.max(rect.width, dropdownRef.value.offsetWidth)
  const dropdownHeight = dropdownRef.value.offsetHeight || 150

  // Check if dropdown would go off screen at bottom
  const spaceBelow = window.innerHeight - rect.bottom
  const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

  // Clamp horizontally so a content-wide dropdown stays within the viewport
  let left = rect.left
  if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width
  if (left < margin) left = margin

  dropdownStyle.value = {
    position: 'fixed',
    left: `${left}px`,
    minWidth: `${width}px`,
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
  color: var(--color-text-primary);
  cursor: pointer;
  min-width: 100px;
}

.select-trigger:hover {
  border-color: var(--color-border-light);
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
  font-size: var(--font-size-xs);
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
  box-shadow: var(--shadow-dropdown);
  z-index: 1000;
  overflow-y: auto;
  max-height: 300px;
  width: max-content;
  max-width: min(420px, calc(100vw - 16px));
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-light) transparent;
}

.select-dropdown::-webkit-scrollbar {
  width: 4px;
}

.select-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.select-dropdown::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
  border-radius: 2px;
}

/* Filter input pinned above the scrolling option list */
.select-search {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
}

.select-search-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 8px 10px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  color: var(--color-text-primary);
  outline: none;
}

.select-search-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: 0 0 0 1px var(--color-action-ring);
}

.select-search-input::placeholder {
  color: var(--color-text-tertiary);
}

.select-option {
  display: block;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  text-align: left;
  white-space: nowrap;
  color: var(--color-text-primary);
  cursor: pointer;
}

.select-option:hover,
.select-option--active {
  background: var(--color-bg-secondary);
}

.select-option--selected {
  background: var(--color-bg-secondary);
  color: var(--color-action);
  font-weight: var(--font-weight-medium);
}

.select-empty {
  padding: 14px;
  text-align: center;
  color: var(--color-text-tertiary);
}

/* Mobile action sheet */
.select-sheet-overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay-light);
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
  display: flex;
  flex-direction: column;
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
  color: var(--color-text-primary);
}

.select-sheet-close {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: var(--lh-none);
}

.select-sheet-close:hover {
  color: var(--color-text-primary);
}

.select-sheet-search {
  padding: 12px 20px;
  border-bottom: 1px solid var(--color-border-light);
}

.select-sheet-options {
  padding: 8px 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-light) transparent;
}

.select-sheet-options::-webkit-scrollbar {
  width: 4px;
}

.select-sheet-options::-webkit-scrollbar-track {
  background: transparent;
}

.select-sheet-options::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
  border-radius: 2px;
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
  color: var(--color-text-primary);
  cursor: pointer;
}

.select-sheet-option:hover,
.select-sheet-option--active {
  background: var(--color-bg-secondary);
}

.select-sheet-option--selected {
  color: var(--color-action);
  font-weight: var(--font-weight-medium);
}

.select-sheet-check {
  color: var(--color-action);
  font-weight: var(--font-weight-semibold);
}
</style>
