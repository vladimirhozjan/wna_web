<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" :class="{ 'overlay--fullscreen-mobile': fullscreenMobile }" @click.self="$emit('close')">
        <div class="dialog" :class="{ 'dialog--fullscreen-mobile': fullscreenMobile }" :style="dialogStyle">
          <h3 v-if="title" class="text-h3 title">{{ title }}</h3>
          <slot />
          <div v-if="$slots.actions" class="actions">
            <slot name="actions" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {computed} from 'vue'

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
    default: '400px',
  },
  fullscreenMobile: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['close'])

const dialogStyle = computed(() => ({
  maxWidth: props.maxWidth,
}))
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
  padding: 24px;
  min-width: 320px;
  width: 90vw;
  box-shadow: var(--shadow-modal);
}

.title {
  margin: 0 0 16px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .overlay--fullscreen-mobile {
    padding-bottom: 0;
    background: var(--color-bg-primary);
  }

  .dialog--fullscreen-mobile {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    width: 100%;
    max-width: none !important;
    height: 100%;
    min-width: 0;
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
    border-radius: 0;
    box-shadow: none;
  }

  .dialog--fullscreen-mobile .actions {
    margin-top: auto;
    padding-top: 20px;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
