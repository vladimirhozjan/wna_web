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
      <span v-if="props.badge" class="badge" :style="props.badgeColor ? { color: props.badgeColor } : {}">{{ props.badge }}</span>
      <span v-else-if="props.count > 0" class="badge badge-blue">{{ props.count }}</span>
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
  drag.markExternalDrop();

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
  transition: all 0.2s ease;
  padding: 8px 16px;
  color: var(--color-text-secondary);
  column-gap: 10px;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  position: relative;
  border-radius: 0;
  text-align: left;
}

.menu-item:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.menu-item.active {
  background: var(--color-bg-accent-light);
  color: var(--color-action);
  font-weight: 600;
}

.menu-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  background: var(--color-action);
  border-radius: 0 4px 4px 0;
}

.menu-item.drop-target {
  color: var(--color-menu-item-hover-txt);
  background: var(--color-btn-secondary-hover);
}

.icon {
  display: flex;
  flex-shrink: 0;
}

.icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.label {
  flex: 1;
}

.badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-tertiary);
  background: var(--color-bg-secondary);
  border-radius: 9999px;
  padding: 1px 7px;
  line-height: 13px;
}

.badge-blue {
  color: var(--color-action);
  background: var(--color-bg-accent-light);
}
</style>
