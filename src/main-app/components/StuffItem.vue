<template>
  <div
      class="stuff-item"
      :class="{ 'stuff-item--checked': checked, 'stuff-item--dragging': isDragging, 'stuff-item--editing': isEditing }"
      :draggable="!isEditing"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
  >
    <!-- Checkbox -->
    <div class="stuff-item__checkbox" @click.stop>
      <input
          type="checkbox"
          :checked="checked"
          @change="onCheck"
      />
    </div>

    <!-- Content -->
    <div class="stuff-item__content" @click="onClick">
      <input
          v-if="isEditing"
          ref="editInput"
          v-model="editValue"
          class="stuff-item__input"
          @keyup.enter="onSave"
          @keyup.escape="onCancel"
          @blur="onSave"
          @click.stop
      />
      <span v-else class="stuff-item__title">{{ title }}</span>
    </div>

    <div class="stuff-item__separator"></div>

    <!-- Actions slot -->
    <div class="stuff-item__actions" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

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

function onClick() {
  if (isEditing.value) return

  isEditing.value = true
  editValue.value = props.title

  nextTick(() => {
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
.stuff-item {
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

.stuff-item:hover {
  background: var(--color-bg-hover, #f9f9f9);
}

.stuff-item--checked {
  opacity: 0.6;
}

.stuff-item--checked .stuff-item__title {
  text-decoration: line-through;
  color: var(--color-text-secondary, #888);
}

.stuff-item--dragging {
  opacity: 0.5;
  background: var(--color-bg-dragging, #f0f0f0);
}

.stuff-item__checkbox {
  flex-shrink: 0;
}

.stuff-item__checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary, #4a90d9);
}

.stuff-item__content {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.stuff-item__separator {
  flex: 1;
}
.stuff-item__title {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m, 14px);
  color: var(--color-text-primary, #1a1a1a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stuff-item__input {
  font-family: var(--font-family-default), sans-serif;
  font-size: var(--font-size-body-m, 14px);
  color: var(--color-text-primary, #1a1a1a);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-primary, #4a90d9);
  padding: 0;
  margin: 0;
  outline: none;
  width: 100%;
}

.stuff-item--editing {
  background: var(--color-bg-primary, #fff);
}

.stuff-item__actions {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.stuff-item:hover .stuff-item__actions {
  opacity: 1;
}
</style>