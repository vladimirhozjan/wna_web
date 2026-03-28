<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" @click.self="$emit('close')" @keyup.esc="$emit('close')" tabindex="0" ref="overlayRef">
        <div class="dialog" :style="dialogStyle">
          <div class="dialog-header">
            <h3 class="text-body-l fw-semibold title">{{ title }}</h3>
            <button type="button" class="close-btn" @click="$emit('close')" aria-label="Close">&times;</button>
          </div>
          <div class="dialog-body">
            <slot />
          </div>
          <div v-if="$slots.actions" class="dialog-actions">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  maxWidth: {
    type: String,
    default: '480px',
  },
})

defineEmits(['close'])

const overlayRef = ref(null)

const dialogStyle = computed(() => ({
  maxWidth: props.maxWidth,
}))

watch(() => props.visible, (val) => {
  if (val) nextTick(() => overlayRef.value?.focus())
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--color-overlay);
  display: flex;
  align-items: center;
  padding-bottom: 48px;
  justify-content: center;
  z-index: 99998;
}

.dialog {
  background: var(--color-bg-primary);
  border-radius: 12px;
  min-width: 320px;
  width: 90vw;
  box-shadow: var(--shadow-modal);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.title {
  margin: 0;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  background: none;
  border: none;
  font-size: var(--font-size-2xl);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  line-height: var(--lh-none);
  border-radius: 4px;
}

.close-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

.dialog-body {
  padding: 16px 24px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 24px 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
