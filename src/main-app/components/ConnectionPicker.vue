<template>
  <div class="cp" :class="{ 'cp--focused': focused, 'cp--disabled': disabled }">
    <input
        ref="inputEl"
        :value="query"
        :placeholder="placeholder"
        :disabled="disabled"
        type="text"
        class="text-body-m cp-input"
        autocomplete="off"
        spellcheck="false"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
    />

    <div v-if="open && (filtered.length > 0 || isLoading)" class="cp-dropdown">
      <div v-if="isLoading" class="text-body-s cp-loading">Loading…</div>
      <div
          v-for="(c, i) in filtered"
          :key="c.user_id"
          class="cp-option"
          :class="{ 'cp-option--active': i === highlightedIndex }"
          @mousedown.prevent="selectConnection(c)"
      >
        <span class="cp-avatar" aria-hidden="true">{{ initials(c) }}</span>
        <span class="text-body-m cp-option-label">{{ c.email }}</span>
      </div>
      <div
          v-if="allowText && query.trim() && !exactMatch"
          class="cp-option cp-option--free"
          :class="{ 'cp-option--active': highlightedIndex === filtered.length }"
          @mousedown.prevent="selectFreeText()"
      >
        <span class="text-body-s cp-option-sub">Use as text:</span>
        <span class="text-body-m cp-option-label">"{{ query.trim() }}"</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { connectionModel } from '../scripts/models/connectionModel.js'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null,
  },
  placeholder: {
    type: String,
    default: 'Search a connection or type a name…',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  excludeUserIds: {
    type: Array,
    default: () => [],
  },
  allowText: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'enter'])

const conn = connectionModel()

const inputEl = ref(null)
const focused = ref(false)
const open = ref(false)
const highlightedIndex = ref(-1)

const query = ref(initialQuery())

function initialQuery() {
  const v = props.modelValue
  if (!v) return ''
  if (v.kind === 'connection') return v.label || v.email || ''
  if (v.kind === 'text') return v.value || ''
  return ''
}

watch(() => props.modelValue, (v) => {
  const next = (() => {
    if (!v) return ''
    if (v.kind === 'connection') return v.label || v.email || ''
    if (v.kind === 'text') return v.value || ''
    return ''
  })()
  // Compare trimmed: emitted text is trimmed, so a trailing space the user
  // just typed must not be clobbered by the value echoing back
  if (next !== query.value.trim()) query.value = next
})

const isLoading = computed(() => conn.loading.value && !conn.loaded.value)

const filtered = computed(() => {
  const exclude = new Set(props.excludeUserIds || [])
  const list = (conn.connections.value || []).filter(c => !exclude.has(c.user_id))
  const q = query.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(c => (c.email || '').toLowerCase().includes(q))
})

const exactMatch = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return false
  return (conn.connections.value || []).some(c => (c.email || '').toLowerCase() === q)
})

function labelOf(c) {
  return c.email || ''
}

function initials(c) {
  const local = (c.email || '').split('@')[0]
  if (!local) return '?'
  return local.slice(0, 2).toUpperCase()
}

function emitText(text) {
  const v = (text || '').trim()
  emit('update:modelValue', v ? { kind: 'text', value: v } : null)
}

function emitConnection(c) {
  emit('update:modelValue', {
    kind: 'connection',
    userId: c.user_id,
    email: c.email,
    label: labelOf(c),
  })
}

function onInput(e) {
  query.value = e.target.value
  highlightedIndex.value = filtered.value.length > 0 ? 0 : -1
  open.value = true
  emitText(query.value)
}

function onFocus() {
  focused.value = true
  open.value = true
  highlightedIndex.value = filtered.value.length > 0 ? 0 : -1
  if (!conn.loaded.value && !conn.loading.value) {
    conn.loadAll().catch(() => {})
  }
}

function onBlur() {
  focused.value = false
  setTimeout(() => { open.value = false }, 120)
}

function onKeydown(e) {
  const total = filtered.value.length + (query.value.trim() && !exactMatch.value ? 1 : 0)
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!open.value) open.value = true
    if (total === 0) return
    highlightedIndex.value = (highlightedIndex.value + 1) % total
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (total === 0) return
    highlightedIndex.value = (highlightedIndex.value - 1 + total) % total
  } else if (e.key === 'Enter') {
    if (open.value && highlightedIndex.value >= 0) {
      e.preventDefault()
      const list = filtered.value
      if (highlightedIndex.value < list.length) {
        selectConnection(list[highlightedIndex.value])
      } else {
        selectFreeText()
      }
      emit('enter')
    } else {
      emit('enter')
    }
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

function selectConnection(c) {
  query.value = labelOf(c)
  open.value = false
  emitConnection(c)
  inputEl.value?.blur()
}

function selectFreeText() {
  open.value = false
  emitText(query.value)
  inputEl.value?.blur()
}

function focus() {
  inputEl.value?.focus()
}

defineExpose({ focus })

onMounted(() => {
  if (!conn.loaded.value && !conn.loading.value) {
    conn.loadAll().catch(() => {})
  }
  if (props.autofocus) {
    nextTick(() => focus())
  }
})
</script>

<style scoped>
.cp {
  position: relative;
  width: 100%;
}

.cp-input {
  width: 100%;
  color: var(--color-text-primary);
  padding: 10px 12px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  outline: none;
  box-sizing: border-box;
}

.cp-input::placeholder {
  color: var(--color-text-prefill);
}

.cp--focused .cp-input,
.cp-input:focus {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.cp--disabled .cp-input {
  opacity: 0.6;
  cursor: not-allowed;
}

.cp-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  box-shadow: var(--shadow-modal);
  max-height: 280px;
  overflow-y: auto;
  z-index: 99999;
  padding: 4px 0;
}

.cp-loading {
  padding: 10px 12px;
  color: var(--color-text-secondary);
}

.cp-option {
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
}

.cp-option:hover,
.cp-option--active {
  background: var(--color-bg-secondary);
}

.cp-option-label {
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-option-sub {
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cp-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-action-subtle);
  color: var(--color-action);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.cp-option--free {
  grid-template-columns: auto 1fr;
  border-top: 1px solid var(--color-border-subtle);
}
</style>
