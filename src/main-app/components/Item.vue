<template>
  <div
      class="item"
      :class="{ 'item--checked': checked, 'item--editing': isEditing, 'item--loading': loading, 'item--no-hover': noHover }"
  >
    <!-- Checkbox -->
    <div v-if="!noCheckbox" class="item__checkbox" @click.stop>
      <input
          type="checkbox"
          :checked="checked"
          @change="onCheck"
      />
    </div>

    <!-- Prefix slot (for icons etc.) -->
    <div v-if="$slots.prefix" class="item__prefix">
      <slot name="prefix" />
    </div>

    <!-- Content -->
    <div class="item__content">
      <span v-if="isEditing" class="item__input-wrapper" @click.stop>
        <span ref="inputMeasure" class="item__measure">{{ editValue || ' ' }}</span>
        <input
            ref="editInput"
            v-model="editValue"
            class="item__input"
            :style="{ width: inputWidth + 'px' }"
            @keyup.enter="onSave"
            @keyup.esc="onCancel"
            @blur="onSave"
            @click.stop
        />
      </span>
      <span v-else class="item__title" @click.stop="onClick">{{ title }}</span>
      <span v-if="$slots.subtitle" class="item__subtitle">
        <slot name="subtitle" />
      </span>
    </div>

    <!-- Spinner overlay -->
    <span v-if="loading" class="item__spinner"></span>

    <div class="item__separator"></div>

    <!-- Actions slot -->
    <div class="item__actions" @click.stop>
      <slot name="actions" />
    </div>

    <!-- Drag handle slot (right side) -->
    <slot name="drag-handle" />
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  checked: {
    type: Boolean,
    default: false
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
  },
  noCheckbox: {
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
.item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.item__actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

@media (hover: hover) and (pointer: fine) {
  .item:not(.item--no-hover):hover {
    background: var(--color-bg-hover);
  }

  .item:not(.item--no-hover):hover .item__actions {
    opacity: 1;
  }

}

.item:not(.item--no-hover):active {
  background: var(--color-bg-hover) !important;
}

.item:not(.item--no-hover):active .item__actions {
  opacity: 0;
}

@media (hover: none) and (pointer: coarse) {
  .item__actions {
    opacity: 1;
  }
}

.item--checked {
  opacity: 0.6;
}

.item--checked .item__title {
  text-decoration: line-through;
  color: var(--color-text-secondary);
}

.item__checkbox {
  flex-shrink: 0;
}

.item__checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-action);
}

.item__prefix {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.item__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.item__separator {
  flex: 1;
}
.item__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item__subtitle {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-s);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item__input-wrapper {
  position: relative;
  display: inline-block;
}

.item__measure {
  position: absolute;
  visibility: hidden;
  white-space: pre;
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m);
}

.item__input {
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

.item--editing {
  background: var(--color-bg-primary);
}

.item--loading {
  pointer-events: none;
  opacity: 0.7;
}

.item__spinner {
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