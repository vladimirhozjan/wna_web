<template>
  <transition name="tip-tricks">
    <div v-if="visible" class="tip-tricks" :class="`tip-tricks--${variant}`">
      <div class="tip-tricks__icon" v-if="$slots.icon">
        <slot name="icon" />
      </div>
      <div class="text-body-m tip-tricks__content">
        <slot />
      </div>
      <button v-if="dismissible" class="tip-tricks__close" @click="dismiss" aria-label="Dismiss tip">
        &times;
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { settingsModel } from '../scripts/models/settingsModel.js'

const props = defineProps({
  storageKey: { type: String, required: true },
  dismissible: { type: Boolean, default: true },
  variant: { type: String, default: 'info' },
})

const settings = settingsModel()
const hidden = ref(false)

const visible = computed(() => !hidden.value && !settings.isTipDismissed(props.storageKey))

function dismiss() {
  hidden.value = true
  settings.dismissTip(props.storageKey)
}

defineExpose({ dismiss, visible })
</script>

<style scoped>
.tip-tricks {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-bg-accent-light);
  border-left: 4px solid var(--color-info);
  border-radius: 8px;
}

.tip-tricks--quote {
  border-left-color: var(--color-text-tertiary);
  font-style: italic;
}

.tip-tricks__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--color-action);
}

.tip-tricks--quote .tip-tricks__icon {
  color: var(--color-text-tertiary);
}

.tip-tricks__content {
  flex: 1;
  color: var(--color-text-secondary);
  line-height: var(--lh-relaxed);
}

.tip-tricks__close {
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  line-height: var(--lh-none);
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0 2px;
}

.tip-tricks__close:hover {
  color: var(--color-text-primary);
}

.tip-tricks-enter-active,
.tip-tricks-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tip-tricks-enter-from,
.tip-tricks-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
