<template>
  <div class="tag-input-wrapper">
    <div
        class="tag-input-container"
        :class="{ 'tag-input-container--focused': focused, 'tag-input-container--disabled': disabled }"
        @click="focusInput"
    >
      <span
          v-for="tag in modelValue"
          :key="tag"
          class="text-body-s tag-chip"
      >
        {{ tag }}
        <button
            v-if="!disabled"
            type="button"
            class="tag-chip-remove"
            @click.stop="removeTag(tag)"
        >&times;</button>
      </span>
      <input
          ref="inputEl"
          v-model="inputValue"
          type="text"
          class="text-body-m tag-input-field"
          :placeholder="modelValue.length === 0 ? placeholder : ''"
          :disabled="disabled"
          @focus="onFocus"
          @blur="onBlur"
          @keydown="onKeydown"
          @input="onInput"
      />
      <div
          v-if="showSuggestions && suggestions.length > 0"
          class="tag-suggestions"
      >
        <div
            v-for="(suggestion, index) in suggestions"
            :key="suggestion"
            class="text-body-m tag-suggestion-item"
            :class="{ 'tag-suggestion-item--active': index === highlightedIndex }"
            @mousedown.prevent="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>
    <div v-if="showPresets && availablePresets.length > 0 && !disabled" class="tag-presets">
      <button
          v-for="preset in availablePresets"
          :key="preset"
          type="button"
          class="text-body-s tag-preset-chip"
          @mousedown.prevent
          @click="addPreset(preset)"
      >+ {{ preset }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { tagModel } from '../scripts/models/tagModel.js'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: 'Add tags...'
  },
  showPresets: {
    type: Boolean,
    default: true
  },
  presetSource: {
    type: Array,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const inputEl = ref(null)
const inputValue = ref('')
const focused = ref(false)
const highlightedIndex = ref(-1)
const showSuggestions = ref(false)

const tagMdl = tagModel()

const suggestions = computed(() => {
  return tagMdl.filterSuggestions(inputValue.value, props.modelValue)
})

const availablePresets = computed(() => {
  const source = props.presetSource || tagMdl.getPresets()
  return source.filter(p => !props.modelValue.includes(p))
})

onMounted(() => {
  tagMdl.loadTags()
})

function focusInput() {
  inputEl.value?.focus()
}

function onFocus() {
  focused.value = true
  showSuggestions.value = true
  highlightedIndex.value = -1
}

function onBlur() {
  // Delay to allow click on suggestion
  setTimeout(() => {
    focused.value = false
    showSuggestions.value = false
    commitInput()
  }, 150)
}

function onInput() {
  showSuggestions.value = true
  highlightedIndex.value = -1
}

function onKeydown(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    if (highlightedIndex.value >= 0 && highlightedIndex.value < suggestions.value.length) {
      selectSuggestion(suggestions.value[highlightedIndex.value])
    } else {
      commitInput()
    }
  } else if (e.key === 'Backspace' && inputValue.value === '' && props.modelValue.length > 0) {
    removeTag(props.modelValue[props.modelValue.length - 1])
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      highlightedIndex.value = Math.min(highlightedIndex.value + 1, suggestions.value.length - 1)
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
    }
  } else if (e.key === 'Escape') {
    showSuggestions.value = false
    highlightedIndex.value = -1
  }
}

function commitInput() {
  const tag = inputValue.value.trim().toLowerCase()
  if (tag && !props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
  inputValue.value = ''
  highlightedIndex.value = -1
}

function selectSuggestion(suggestion) {
  if (!props.modelValue.includes(suggestion)) {
    emit('update:modelValue', [...props.modelValue, suggestion])
  }
  inputValue.value = ''
  highlightedIndex.value = -1
  showSuggestions.value = false
  nextTick(() => {
    inputEl.value?.focus()
  })
}

function addPreset(tag) {
  if (!props.modelValue.includes(tag)) {
    emit('update:modelValue', [...props.modelValue, tag])
  }
}

function removeTag(tag) {
  emit('update:modelValue', props.modelValue.filter(t => t !== tag))
}

defineExpose({ focus: focusInput })
</script>

<style scoped>
.tag-input-container {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--color-input-border);
  border-radius: 6px;
  background: var(--color-bg-primary);
  min-height: 38px;
  cursor: text;
}

.tag-input-container--focused {
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus-ring);
}

.tag-input-container--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  color: var(--color-text-primary);
  line-height: var(--lh-normal);
  white-space: nowrap;
}

.tag-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: var(--font-size-sm);
  line-height: var(--lh-none);
  color: var(--color-text-tertiary);
}

.tag-chip-remove:hover {
  color: var(--color-danger);
}

.tag-input-field {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--color-text-primary);
  padding: 2px 0;
}

.tag-input-field::placeholder {
  color: var(--color-text-prefill);
}

.tag-input-field:disabled {
  cursor: not-allowed;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 160px;
  overflow-y: auto;
  z-index: 100;
}

.tag-suggestion-item {
  padding: 8px 12px;
  color: var(--color-text-primary);
  cursor: pointer;
}

.tag-suggestion-item:hover,
.tag-suggestion-item--active {
  background: var(--color-bg-secondary);
}

.tag-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.tag-preset-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border: 1px dashed var(--color-border-light);
  border-radius: 4px;
  background: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  line-height: var(--lh-normal);
  white-space: nowrap;
  transition: all 0.15s;
}

.tag-preset-chip:hover {
  color: var(--color-action);
  border-color: var(--color-action);
  background: var(--color-bg-secondary);
}
</style>
