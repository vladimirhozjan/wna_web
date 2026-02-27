<template>
  <router-link
      v-if="props.to"
      :to="props.to"
      custom
      v-slot="{ navigate, isActive }"
  >
    <button
        type="button"
        class="menu-item text-body-m"
        :class="{ active: isActive, 'drop-target': showDropTarget }"
        @click="navigate"
        @dragover="onDragOver"
        @dragenter="onDragEnter"
        @dragleave="onDragLeave"
        @drop="onDrop"
    >
      <span class="icon">
        <slot name="icon" />
      </span>
      <span class="label">{{ props.label }}</span>
      <span v-if="props.badge" class="count text-footnote" :style="props.badgeColor ? { color: props.badgeColor } : {}">{{ props.badge }}</span>
      <span v-else-if="props.count > 0" class="count text-footnote">{{ props.count }}</span>
    </button>
  </router-link>
  <button
      v-else
      type="button"
      class="menu-item text-body-m"
      @click="$emit('click')"
  >
    <span class="icon">
      <slot name="icon" />
    </span>
    <span class="label">{{ props.label }}</span>
  </button>
</template>

<script setup>
import { ref, computed } from "vue";
import { dragModel } from "../scripts/models/dragModel.js";

const props = defineProps({
  label: { type: String, required: true },
  to: { type: [String, Object], default: null },
  acceptDrop: { type: Array, default: () => [] },
  count: { type: Number, default: 0 },
  badge: { type: String, default: null },
  badgeColor: { type: String, default: null },
});

const emit = defineEmits(['drop', 'click']);

const drag = dragModel();
const isOver = ref(false);

const canAcceptDrop = computed(() => {
  if (!props.acceptDrop.length) return false;
  return drag.state.isDragging && props.acceptDrop.includes(drag.state.sourceType);
});

const showDropTarget = computed(() => isOver.value && canAcceptDrop.value);

function onDragOver(e) {
  if (!canAcceptDrop.value) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  isOver.value = true;
}

function onDragEnter(e) {
  if (!canAcceptDrop.value) return;
  e.preventDefault();
  isOver.value = true;
}

function onDragLeave(e) {
  // Only set to false if leaving the button itself, not a child
  if (e.currentTarget.contains(e.relatedTarget)) return;
  isOver.value = false;
}

function onDrop(e) {
  isOver.value = false;
  if (!canAcceptDrop.value) return;

  e.preventDefault();

  try {
    const data = JSON.parse(e.dataTransfer.getData('application/json'));
    emit('drop', data);
  } catch {
    // Invalid data
  }
}
</script>

<style scoped>
.menu-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  transition: 0.15s ease;
  padding: 0;
  color: var(--color-menu-item-default-text);
  column-gap: 12px;
}

.menu-item:hover {
  background: var(--color-menu-item-hover-bg);
  color: var(--color-menu-item-hover-txt);
}

.menu-item.active {
  background: var(--color-menu-item-active-bg);
  color: var(--color-menu-item-active-txt);
  font-weight: 600;
}

.menu-item.drop-target {
  color: var(--color-menu-item-hover-txt);
  background: var(--color-btn-ghost-hover);
}

.icon {
  display: flex;
}

.icon :deep(svg) {
  width: 28px;
  height: 28px;
  padding: 4px;
  box-sizing: border-box;
}

.count {
  margin-left: auto;
  color: var(--color-text-tertiary);
}

</style>
