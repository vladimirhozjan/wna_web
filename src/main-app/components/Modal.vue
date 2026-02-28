<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="visible" class="overlay" @click.self="$emit('close')">
        <div class="dialog" :style="dialogStyle">
          <h3 class="text-h3 title">{{ title }}</h3>
          <slot />
          <div class="actions">
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
