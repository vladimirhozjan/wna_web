<template>
  <div
      class="waiting-item"
      :class="{ 'waiting-item--loading': loading }"
  >
    <!-- Checkbox -->
    <div class="waiting-item__checkbox" @click.stop>
      <input
          type="checkbox"
          :checked="false"
          @change="onCheck"
      />
    </div>

    <!-- Content -->
    <div class="waiting-item__content" @click.stop="onClick">
      <span v-if="isEditing" class="waiting-item__input-wrapper">
        <span ref="inputMeasure" class="waiting-item__measure">{{ editValue || ' ' }}</span>
        <input
            ref="editInput"
            v-model="editValue"
            class="waiting-item__input"
            :style="{ width: inputWidth + 'px' }"
            @keyup.enter="onSave"
            @keyup.esc="onCancel"
            @blur="onSave"
            @click.stop
        />
      </span>
      <span v-else class="waiting-item__title">{{ title }}</span>
      <span class="waiting-item__meta">
        <span v-if="waitingFor" class="waiting-item__waiting-for">{{ waitingFor }}</span>
        <span v-if="waitingSince" class="waiting-item__waiting-since">{{ waitingDuration }}</span>
      </span>
    </div>

    <!-- Spinner overlay -->
    <span v-if="loading" class="waiting-item__spinner"></span>

    <div class="waiting-item__separator"></div>

    <!-- Actions -->
    <div class="waiting-item__actions" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  waitingFor: {
    type: String,
    default: ''
  },
  waitingSince: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  editable: {
    type: Boolean,
    default: true
  },
  noHover: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update', 'check'])

const isEditing = ref(false)
const editValue = ref('')
const editInput = ref(null)
const inputMeasure = ref(null)
const inputWidth = ref(50)

const waitingDuration = computed(() => {
  if (!props.waitingSince) return ''
  const since = new Date(props.waitingSince)
  const now = new Date()
  const diffMs = now - since
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day'
  if (diffDays < 7) return `${diffDays} days`
  if (diffDays < 14) return '1 week'
  const weeks = Math.floor(diffDays / 7)
  if (diffDays < 30) return `${weeks} weeks`
  const months = Math.floor(diffDays / 30)
  if (months === 1) return '1 month'
  return `${months} months`
})

watch(editValue, () => {
  nextTick(() => {
    if (inputMeasure.value) {
      inputWidth.value = Math.max(50, inputMeasure.value.offsetWidth + 2)
    }
  })
})

function onClick() {
  if (isEditing.value) return
  if (!props.editable) return

  isEditing.value = true
  editValue.value = props.title

  nextTick(() => {
    if (inputMeasure.value) {
      inputWidth.value = Math.max(50, inputMeasure.value.offsetWidth + 2)
    }
    editInput.value?.focus()
    editInput.value?.select()
  })
}

function onSave() {
  if (!isEditing.value) return

  const newTitle = editValue.value.trim()
  isEditing.value = false

  if (newTitle && newTitle !== props.title) {
    emit('update', props.id, { title: newTitle })
  }
}

function onCancel() {
  isEditing.value = false
  editValue.value = props.title
}

function onCheck(e) {
  emit('check', props.id, e.target.checked)
}
</script>

<style scoped>
.waiting-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.waiting-item__actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
  align-self: center;
}

@media (hover: hover) and (pointer: fine) {
  .waiting-item:hover {
    background: var(--color-bg-hover);
  }

  .waiting-item:hover .waiting-item__actions {
    opacity: 1;
  }
}

.waiting-item:active {
  background: var(--color-bg-hover) !important;
}

.waiting-item:active .waiting-item__actions {
  opacity: 0;
}

@media (hover: none) and (pointer: coarse) {
  .waiting-item__actions {
    opacity: 1;
  }
}

.waiting-item__checkbox {
  flex-shrink: 0;
  padding-top: 2px;
}

.waiting-item__checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-action);
}

.waiting-item__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.waiting-item__separator {
  flex: 1;
}

.waiting-item__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.waiting-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
}

.waiting-item__waiting-for {
  color: var(--color-text-secondary);
}

.waiting-item__waiting-since {
  color: var(--color-text-tertiary);
}

.waiting-item__waiting-since::before {
  content: '·';
  margin-right: 8px;
}

.waiting-item__input-wrapper {
  position: relative;
  display: inline-block;
}

.waiting-item__measure {
  position: absolute;
  visibility: hidden;
  white-space: pre;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
}

.waiting-item__input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-action);
  padding: 0;
  margin: 0;
  outline: none;
  min-width: 50px;
  max-width: 100%;
}

.waiting-item--loading {
  pointer-events: none;
  opacity: 0.7;
}

.waiting-item__spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -10px;
  margin-left: -10px;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-light);
  border-top-color: var(--color-action);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
