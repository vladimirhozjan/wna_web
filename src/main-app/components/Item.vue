<template>
  <div
      class="item"
      :class="{ 'item--checked': checked, 'item--dragging': isDragging, 'item--editing': isEditing }"
      :draggable="!isEditing"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
  >
    <!-- Checkbox -->
    <div class="item__checkbox" @click.stop>
      <input
          type="checkbox"
          :checked="checked"
          @change="onCheck"
      />
    </div>

    <!-- Content -->
    <div class="item__content" @click="onClick">
      <span v-if="isEditing" class="item__input-wrapper">
        <span ref="inputMeasure" class="item__measure">{{ editValue || ' ' }}</span>
        <input
            ref="editInput"
            v-model="editValue"
            class="item__input"
            :style="{ width: inputWidth + 'px' }"
            @keyup.enter="onSave"
            @keyup.escape="onCancel"
            @blur="onSave"
            @click.stop
        />
      </span>
      <span v-else class="item__title">{{ title }}</span>
    </div>

    <div class="item__separator"></div>

    <!-- Actions slot -->
    <div class="item__actions" @click.stop>
      <slot name="actions" />
    </div>
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
  dragData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update', 'check', 'dragstart', 'dragend'])

const isDragging = ref(false)
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

function onDragStart(e) {
  if (isEditing.value) {
    e.preventDefault()
    return
  }

  isDragging.value = true

  const data = props.dragData || { id: props.id, title: props.title }
  e.dataTransfer.setData('application/json', JSON.stringify(data))
  e.dataTransfer.effectAllowed = 'move'

  emit('dragstart', props.id, e)
}

function onDragEnd(e) {
  isDragging.value = false
  emit('dragend', props.id, e)
}
</script>

<style scoped>
.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-primary, #fff);
  border-bottom: 1px solid var(--color-border-light, #eee);
  cursor: pointer;
  transition: background 0.15s ease;
  user-select: none;
}

.item:hover {
  background: var(--color-bg-hover, #f9f9f9);
}

.item--checked {
  opacity: 0.6;
}

.item--checked .item__title {
  text-decoration: line-through;
  color: var(--color-text-secondary, #888);
}

.item--dragging {
  opacity: 0.5;
  background: var(--color-bg-dragging, #f0f0f0);
}

.item__checkbox {
  flex-shrink: 0;
}

.item__checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #4a90d9);
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
  font-size: var(--font-size-body-m, 14px);
  color: var(--color-text-primary, #1a1a1a);
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
  font-size: var(--font-size-body-m, 14px);
}

.item__input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m, 14px);
  color: var(--color-text-primary, #1a1a1a);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-primary, #4a90d9);
  padding: 0;
  margin: 0;
  outline: none;
  min-width: 50px;
  max-width: 100%;
}

.item--editing {
  background: var(--color-bg-primary, #fff);
}

.item__actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.item:hover .item__actions {
  opacity: 1;
}

@media (hover: none) {
  .item__actions {
    opacity: 1;
  }
}
</style>